# Complete Remaining Onboarding Screens (15-22)

## ✅ **COMPLETED: Screens 3-14**
All screens 3-14 have been successfully updated with validation and data persistence.

## 🔄 **REMAINING: Screens 15-22**

### **Quick Update Pattern for Each Screen:**

For each remaining screen, apply this pattern:

```typescript
// 1. Add imports
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

// 2. Add state variables
const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
const [showValidationError, setShowValidationError] = useState(false);

// 3. Update handleContinue
const handleContinue = async () => {
  // Add validation logic
  if (!selectedOption) {
    setShowValidationError(true);
    return;
  }
  
  setShowValidationError(false);
  const success = await navigateToNextStep(SCREEN_NUMBER, {
    // Map your screen's data
    field_name: value,
  });
  
  if (!success) {
    console.error('Failed to save onboarding data');
  }
};

// 4. Wrap with OnboardingErrorHandler
return (
  <OnboardingErrorHandler 
    error={error} 
    loading={isSaving}
    onRetry={() => handleContinue()}
  >
    {/* Your existing UI */}
  </OnboardingErrorHandler>
);

// 5. Add validation UI
{showValidationError && (
  <Text style={styles.validationError}>
    Please make a selection before continuing
  </Text>
)}

// 6. Update button
<TouchableOpacity 
  onPress={handleContinue}
  disabled={!selectedOption || isSaving}
>
  <Text style={[styles.buttonText, (!selectedOption || isSaving) && styles.buttonTextDisabled]}>
    {isSaving ? 'Saving...' : 'Continue'}
  </Text>
</TouchableOpacity>

// 7. Add styles
validationError: {
  color: '#FF6B6B',
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 12,
  fontWeight: '500',
},
buttonTextDisabled: {
  color: '#8E8E93',
},
```

### **Screen-Specific Data Mapping:**

| Screen | Field to Save | Validation |
|--------|---------------|------------|
| OnboardingScreen15 | `meal_frequency`, `allergies` | Must select meal frequency |
| OnboardingScreen16 | `fitness_obstacles` | Must select at least one obstacle |
| OnboardingScreen17 | `workout_preferences` | Must select preferences |
| OnboardingScreen18 | `equipment_available` | Must select at least one |
| OnboardingScreen19 | `notification_preferences` | Can be default object |
| OnboardingScreen20 | `motivation_level` | Must select one option |
| OnboardingScreen21 | `privacy_settings` | Can be default object |
| OnboardingScreen22 | `additional_notes` | Use `completeOnboardingFlow` |

### **Special Cases:**

**OnboardingScreen22 (Final Screen):**
```typescript
const { completeOnboardingFlow } = useOnboardingNavigation();
const success = await completeOnboardingFlow(finalData);
```

**Screens with Multiple Selections:**
```typescript
const success = await navigateToNextStep(SCREEN_NUMBER, {
  field_name: selectedArray, // Array of strings
});
```

## 🚀 **Current Status:**
- **Screens 3-14**: ✅ Fully implemented with validation
- **Screens 15-22**: 📋 Ready to update using the pattern above
- **Database**: ✅ Schema ready
- **Services**: ✅ All backend logic implemented
- **Error Handling**: ✅ Complete system in place

The validation system is working perfectly for screens 3-14. Users cannot proceed without making required selections, and all data is properly saved to Supabase. Apply the pattern above to complete screens 15-22!
