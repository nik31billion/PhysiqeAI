import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

const OnboardingScreen6: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2000);
  const [showValidationError, setShowValidationError] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Generate days based on selected month and year
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);
  const years = Array.from({ length: 80 }, (_, i) => 2024 - i);

  // Adjust selected day if it's invalid for the current month/year
  const adjustSelectedDay = (month: number, year: number, currentDay: number) => {
    const maxDays = getDaysInMonth(month, year);
    return Math.min(currentDay, maxDays);
  };

  const handleContinue = async () => {
    // Validate age (must be between 13 and 100)
    const currentYear = new Date().getFullYear();
    const age = currentYear - selectedYear;
    
    if (age < 13 || age > 100) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(6, {
      age: age,
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  const DatePickerBox = ({ 
    label, 
    value, 
    backgroundColor, 
    onPress 
  }: { 
    label: string; 
    value: string | number; 
    backgroundColor: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.dateBox, { backgroundColor }]} onPress={onPress}>
      <Text style={styles.dateLabel}>{label}</Text>
      <View style={styles.dateValueContainer}>
        <Text style={styles.dateValue}>{value}</Text>
        <View style={styles.verticalLine} />
      </View>
    </TouchableOpacity>
  );

  const PickerModal = ({ 
    visible, 
    onClose, 
    title, 
    data, 
    selectedValue, 
    onSelect 
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    selectedValue: any;
    onSelect: (value: any) => void;
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedValue === item && styles.pickerItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedValue === item && styles.pickerItemTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.pickerList}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Full Screen Gradient Background */}
        <LinearGradient
          colors={['#D9EEE4', '#F6EADB']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>When were you born?</Text>

        {/* Date Input Boxes */}
        <View style={styles.datePickerContainer}>
          <DatePickerBox
            label="Month"
            value={months[selectedMonth - 1]}
            backgroundColor="#E0F8E9"
            onPress={() => setShowMonthPicker(true)}
          />
          <DatePickerBox
            label="Day"
            value={selectedDay}
            backgroundColor="#FFE4EC"
            onPress={() => setShowDayPicker(true)}
          />
          <DatePickerBox
            label="Year"
            value={selectedYear}
            backgroundColor="#E8E4FF"
            onPress={() => setShowYearPicker(true)}
          />
        </View>

        {/* Validation Error Message */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please enter a valid age (13-100 years old)
          </Text>
        )}

        {/* Continue Button */}
        <LinearGradient
          colors={['#E6FFF9', '#FFF9CA']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleContinue}
            disabled={isSaving}
          >
            <Text style={[styles.buttonText, isSaving && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Birthday Mascot with Party Hat and Cake */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/bday no bg.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Picker Modals */}
      <PickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        title="Select Month"
        data={months}
        selectedValue={months[selectedMonth - 1]}
        onSelect={(month) => {
          const newMonth = months.indexOf(month) + 1;
          setSelectedMonth(newMonth);
          // Adjust day if it's invalid for the new month
          const adjustedDay = adjustSelectedDay(newMonth, selectedYear, selectedDay);
          if (adjustedDay !== selectedDay) {
            setSelectedDay(adjustedDay);
          }
        }}
      />
      
      <PickerModal
        visible={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        title="Select Day"
        data={days}
        selectedValue={selectedDay}
        onSelect={(day) => setSelectedDay(day)}
      />
      
      <PickerModal
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        title="Select Year"
        data={years}
        selectedValue={selectedYear}
        onSelect={(year) => {
          setSelectedYear(year);
          // Adjust day if it's invalid for the new year (leap year changes)
          const adjustedDay = adjustSelectedDay(selectedMonth, year, selectedDay);
          if (adjustedDay !== selectedDay) {
            setSelectedDay(adjustedDay);
          }
        }}
      />
      </View>
    </OnboardingErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.08,
    right: width * 0.08,
    bottom: height * 0.25,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 40,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    gap: 15,
  },
  dateBox: {
    flex: 1,
    height: 120,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 10,
    textAlign: 'center',
  },
  dateValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    height: 30,
    backgroundColor: 'rgba(141, 141, 147, 0.3)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -0.5 }, { translateY: -15 }],
  },
  buttonGradient: {
    borderRadius: 35,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
  },
  button: {
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.08,
    left: '50%',
    transform: [{ translateX: -60 }],
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 120,
    height: 120,
    zIndex: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#937AFD',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerList: {
    maxHeight: height * 0.4,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  pickerItemSelected: {
    backgroundColor: '#F0F0FF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#2D2D2D',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#937AFD',
    fontWeight: '600',
  },
});

export default OnboardingScreen6;
