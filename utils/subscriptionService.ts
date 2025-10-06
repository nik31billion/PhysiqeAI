import { CustomerInfo } from 'react-native-purchases';

export interface SubscriptionInfo {
  productId: string;
  title: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial' | 'unknown';
  renewalDate: Date | null;
  purchaseDate: Date | null;
  willRenew: boolean;
  isTrialPeriod: boolean;
  trialEndDate: Date | null;
  price?: string;
  billingPeriod?: string;
  isPrepaidSubscription?: boolean;
}

/**
 * Extract subscription information from RevenueCat CustomerInfo
 */
export const extractSubscriptionInfo = (customerInfo: CustomerInfo | null): SubscriptionInfo | null => {
  if (!customerInfo) return null;

  // Get active or most recent entitlement
  const activeEntitlements = customerInfo.entitlements.active;
  const allEntitlements = customerInfo.entitlements.all;
  
  const mainEntitlement = Object.values(activeEntitlements)[0] || Object.values(allEntitlements)[0];
  
  if (!mainEntitlement) return null;

  const productId = mainEntitlement.productIdentifier;
  const productPlanId = mainEntitlement.productPlanIdentifier || productId;
  
  console.log('🔍 extractSubscriptionInfo - productId:', productId);
  console.log('🔍 extractSubscriptionInfo - productPlanId:', productPlanId);
  console.log('🔍 extractSubscriptionInfo - mainEntitlement:', JSON.stringify(mainEntitlement, null, 2));
  
  // Check both productIdentifier and productPlanIdentifier for yearly/annual
  const isPrepaidSubscription = productId.toLowerCase().includes('yearly') || productId.toLowerCase().includes('annual') ||
                               productPlanId.toLowerCase().includes('yearly') || productPlanId.toLowerCase().includes('annual');
  
  // For billing period, we need to use the full product identifier that includes the plan
  // The productPlanId alone (like "default") doesn't contain the billing period info
  const fullProductId = `${productId}:${productPlanId}`;
  console.log('🔍 Using full product ID for billing period:', fullProductId);
  
  const billingPeriod = getBillingPeriod(fullProductId);
  console.log('🔍 Final billingPeriod result:', billingPeriod);
  
  return {
    productId: productId,
    title: getSubscriptionTitle(productPlanId), // Use productPlanId for title
    status: getSubscriptionStatus(mainEntitlement),
    renewalDate: mainEntitlement.expirationDate ? new Date(mainEntitlement.expirationDate) : null,
    purchaseDate: mainEntitlement.latestPurchaseDate ? new Date(mainEntitlement.latestPurchaseDate) : null,
    willRenew: isPrepaidSubscription ? false : mainEntitlement.willRenew, // Prepaid subscriptions don't auto-renew
    isTrialPeriod: mainEntitlement.periodType === 'TRIAL',
    trialEndDate: mainEntitlement.isActive && mainEntitlement.periodType === 'TRIAL' 
      ? mainEntitlement.expirationDate ? new Date(mainEntitlement.expirationDate) : null
      : null,
    billingPeriod: billingPeriod, // Use full product ID for billing period
    isPrepaidSubscription: isPrepaidSubscription,
  };
};

/**
 * Get user-friendly subscription title from product ID
 */
export const getSubscriptionTitle = (productId: string): string => {
  const lowercaseId = productId.toLowerCase();
  
  // Check for yearly FIRST (before monthly) to avoid false matches
  // Handle cases like "flexaura_monthly:flexaura-yearly" where yearly is at the end
  if (lowercaseId.includes('yearly') || lowercaseId.includes('annual')) {
    return 'Flex Aura Pro (Yearly)';
  }
  // Check for monthly - either in the full ID or in the base product part (before colon)
  // Handle cases like "flexaura_monthly:default" where monthly is in the base product
  if (lowercaseId.includes('monthly') && !lowercaseId.includes('yearly')) {
    return 'Flex Aura Pro (Monthly)';
  }
  // Also check if the base product (before colon) contains monthly
  const baseProduct = lowercaseId.split(':')[0];
  if (baseProduct.includes('monthly') && !lowercaseId.includes('yearly')) {
    return 'Flex Aura Pro (Monthly)';
  }
  if (lowercaseId.includes('weekly')) {
    return 'Flex Aura Pro (Weekly)';
  }
  if (lowercaseId.includes('premium') || lowercaseId.includes('pro')) {
    return 'Flex Aura Pro';
  }
  
  return 'Flex Aura Premium';
};

/**
 * Get billing period from product ID
 */
export const getBillingPeriod = (productId: string): string => {
  const lowercaseId = productId.toLowerCase();
  
  console.log('🔍 getBillingPeriod called with productId:', productId);
  console.log('🔍 lowercaseId:', lowercaseId);
  
  // Check for yearly FIRST (before monthly) to avoid false matches
  // Some product IDs might be like "flexaura_monthly:flexaura-yearly"
  if (lowercaseId.includes('yearly') || lowercaseId.includes('annual')) {
    console.log('✅ Found yearly/annual, returning Annual');
    return 'Annual';
  }
  
  // Check for monthly - either in the full ID or in the base product part (before colon)
  // Handle cases like "flexaura_monthly:default" where monthly is in the base product
  if (lowercaseId.includes('monthly') && !lowercaseId.includes('yearly')) {
    console.log('✅ Found monthly in full ID, returning Monthly');
    return 'Monthly';
  }
  
  // Also check if the base product (before colon) contains monthly
  const baseProduct = lowercaseId.split(':')[0];
  console.log('🔍 baseProduct:', baseProduct);
  if (baseProduct.includes('monthly') && !lowercaseId.includes('yearly')) {
    console.log('✅ Found monthly in base product, returning Monthly');
    return 'Monthly';
  }
  
  // Check for weekly
  if (lowercaseId.includes('weekly')) {
    console.log('✅ Found weekly, returning Weekly');
    return 'Weekly';
  }
  
  // If we can't determine the billing period, try to infer from common patterns
  // This is a fallback for cases where the product ID doesn't contain clear indicators
  console.log('🔍 No clear billing period found, checking for common patterns...');
  
  // If it's a subscription but we can't determine the period, default to Monthly
  // This handles cases where the product ID might be something like "premium" or "pro"
  if (lowercaseId.includes('premium') || lowercaseId.includes('pro') || lowercaseId.includes('subscription')) {
    console.log('✅ Found premium/pro/subscription, defaulting to Monthly');
    return 'Monthly';
  }
  
  console.log('❌ No match found, returning Unknown');
  return 'Unknown';
};

/**
 * Determine subscription status from entitlement
 */
export const getSubscriptionStatus = (entitlement: any): 'active' | 'expired' | 'cancelled' | 'trial' | 'unknown' => {
  if (!entitlement.isActive) {
    if (entitlement.expirationDate && new Date(entitlement.expirationDate) < new Date()) {
      return 'expired';
    }
    return 'cancelled';
  }
  
  if (entitlement.periodType === 'TRIAL') {
    return 'trial';
  }
  
  if (entitlement.isActive) {
    return 'active';
  }
  
  return 'unknown';
};

/**
 * Format date for display
 */
export const formatSubscriptionDate = (date: Date | null, includeTime: boolean = false): string => {
  if (!date) return 'N/A';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get status color for UI
 */
export const getSubscriptionStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return '#10B981'; // Green
    case 'trial':
      return '#F59E0B'; // Orange
    case 'expired':
      return '#EF4444'; // Red
    case 'cancelled':
      return '#F59E0B'; // Orange
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get human-readable status text
 */
export const getSubscriptionStatusText = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trial':
      return 'Free Trial';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

/**
 * Check if subscription is about to expire (within 3 days)
 */
export const isSubscriptionExpiringSoon = (renewalDate: Date | null): boolean => {
  if (!renewalDate) return false;
  
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  return renewalDate <= threeDaysFromNow && renewalDate > new Date();
};

/**
 * Get days until renewal/expiration
 */
export const getDaysUntilRenewal = (renewalDate: Date | null): number | null => {
  if (!renewalDate) return null;
  
  const now = new Date();
  const diffTime = renewalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if user has any active subscription
 */
export const hasActiveSubscription = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) return false;
  
  const activeEntitlements = customerInfo.entitlements.active;
  return Object.keys(activeEntitlements).length > 0;
};

/**
 * Get subscription benefits based on status
 */
export const getSubscriptionBenefits = (isProUser: boolean): string[] => {
  if (isProUser) {
    return [
      'Unlimited AI Coach conversations',
      'Advanced meal planning',
      'Progress photo comparisons',
      'Premium workout routines',
      'Priority customer support',
      'Ad-free experience',
      'Advanced analytics',
    ];
  }
  
  return [
    'Limited AI Coach conversations',
    'Basic meal planning',
    'Standard workout routines',
    'Community support',
  ];
};

/**
 * Format relative time (e.g., "in 5 days", "2 days ago")
 */
export const formatRelativeTime = (date: Date | null): string => {
  if (!date) return '';
  
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `in ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};
