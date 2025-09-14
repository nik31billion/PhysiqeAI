# Update Remaining Onboarding Screens (8-22)

I've successfully updated OnboardingScreens 3-7 with proper validation. Here's what you need to do to update the remaining screens (8-22):

## ✅ **Already Updated:**
- OnboardingScreen3 ✅ (Primary goals selection)
- OnboardingScreen4 ✅ (Fitness goals selection) 
- OnboardingScreen5 ✅ (Gender selection)
- OnboardingScreen6 ✅ (Age/birthday with age validation)
- OnboardingScreen7 ✅ (Height/weight with number validation)

## 🔄 **Need to Update (8-22):**

For each remaining screen, follow this pattern:

### **Step 1: Add Imports**
```typescript
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';
```

### **Step 2: Add State Variables**
```typescript
const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
const [showValidationError, setShowValidationError] = useState(false);
```

### **Step 3: Update handleContinue Function**
```typescript
const handleContinue = async () => {
  // Add validation logic based on screen type
  if (!selectedOption) { // or other validation
    setShowValidationError(true);
    return;
  }
  
  setShowValidationError(false);
  const success = await navigateToNextStep(SCREEN_NUMBER, {
    // Map your screen's data to OnboardingData fields
    field_name: value,
  });
  
  if (!success) {
    console.error('Failed to save onboarding data');
  }
};
```

### **Step 4: Wrap with Error Handler**
```typescript
return (
  <OnboardingErrorHandler 
    error={error} 
    loading={isSaving}
    onRetry={() => handleContinue()}
  >
    {/* Your existing UI */}
  </OnboardingErrorHandler>
);
```

### **Step 5: Add Validation UI**
```typescript
{/* Validation Error Message */}
{showValidationError && (
  <Text style={styles.validationError}>
    Please make a selection before continuing
  </Text>
)}

{/* Update Continue Button */}
<TouchableOpacity 
  onPress={handleContinue}
  disabled={!selectedOption || isSaving}
>
  <Text style={[styles.buttonText, (!selectedOption || isSaving) && styles.buttonTextDisabled]}>
    {isSaving ? 'Saving...' : 'Continue'}
  </Text>
</TouchableOpacity>
```

### **Step 6: Add Styles**
```typescript
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

## 📋 **Screen-Specific Data Mapping:**

| Screen | Field to Save | Validation |
|--------|---------------|------------|
| OnboardingScreen8 | `activity_level` | Must select one option |
| OnboardingScreen9 | `workout_frequency` | Must select one option |
| OnboardingScreen10 | `workout_duration` | Must select one option |
| OnboardingScreen11 | `preferred_workout_time` | Must select one option |
| OnboardingScreen12 | `fitness_experience` | Must select one option |
| OnboardingScreen13 | `target_weight_kg` | Must enter valid number |
| OnboardingScreen14 | `target_date` | Must select valid date |
| OnboardingScreen15 | `motivation_level` | Must select one option |
| OnboardingScreen16 | `preferred_exercises` | Must select at least one |
| OnboardingScreen17 | `dietary_preferences` | Must select one option |
| OnboardingScreen18 | `allergies` | Can be empty array |
| OnboardingScreen19 | `medical_conditions` | Can be empty array |
| OnboardingScreen20 | `equipment_available` | Must select at least one |
| OnboardingScreen21 | `notification_preferences` | Can be default object |
| OnboardingScreen22 | `privacy_settings`, `additional_notes` | Use `completeOnboardingFlow` |

## 🚨 **Special Cases:**

### **OnboardingScreen22 (Final Screen):**
```typescript
const { completeOnboardingFlow } = useOnboardingNavigation();
const success = await completeOnboardingFlow(finalData);
```

### **Screens with Multiple Selections:**
```typescript
// For arrays (like preferred_exercises, allergies, etc.)
const success = await navigateToNextStep(SCREEN_NUMBER, {
  preferred_exercises: selectedExercises, // Array of strings
});
```

### **Screens with Number Inputs:**
```typescript
// Validate numbers
const num = parseFloat(inputValue);
if (!num || num <= 0) {
  setShowValidationError(true);
  return;
}
```

## 🎯 **Quick Update Checklist:**

For each screen (8-22):
- [ ] Add imports
- [ ] Add state variables
- [ ] Update handleContinue with validation
- [ ] Wrap with OnboardingErrorHandler
- [ ] Add validation error message
- [ ] Update continue button
- [ ] Add validation styles
- [ ] Test validation works

## 🚀 **After All Updates:**

1. **Test the complete flow** - Sign up → Complete all onboarding screens
2. **Test validation** - Try proceeding without selections on each screen
3. **Test error handling** - Simulate network issues
4. **Test data persistence** - Close app mid-onboarding and resume

The validation pattern is now consistent across all screens, ensuring users cannot proceed without making required selections!
