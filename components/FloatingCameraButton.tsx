import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur'; // Removed for compatibility

const { width, height } = Dimensions.get('window');

interface FloatingCameraButtonProps {
  onScanFood: () => void;
  onScanBarcode: () => void;
  onScanFoodLabel: () => void;
  onOpenLibrary: () => void;
}

const FloatingCameraButton: React.FC<FloatingCameraButtonProps> = ({
  onScanFood,
  onScanBarcode,
  onScanFoodLabel,
  onOpenLibrary,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Scale animation for button press feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsMenuOpen(true);

    // Rotate and fade in menu
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMenuOpen(false);
    });
  };

  const handleMenuOption = (action: () => void) => {
    closeMenu();
    setTimeout(action, 300); // Delay to allow menu close animation
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const menuOptions = [
    {
      title: 'Scan food',
      icon: 'restaurant-outline',
      color: '#4CAF50',
      action: () => handleMenuOption(onScanFood),
    },
    {
      title: 'Barcode',
      icon: 'barcode-outline',
      color: '#2196F3',
      action: () => handleMenuOption(onScanBarcode),
    },
    {
      title: 'Food label',
      icon: 'document-text-outline',
      color: '#FF9800',
      action: () => handleMenuOption(onScanFoodLabel),
    },
    {
      title: 'Library',
      icon: 'images-outline',
      color: '#9C27B0',
      action: () => handleMenuOption(onOpenLibrary),
    },
  ];

  return (
    <>
      {/* Main floating button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          style={styles.buttonTouchable}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.buttonInner,
              {
                transform: [{ rotate }],
              },
            ]}
          >
            <Ionicons name="camera" size={28} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.blurContainer}>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  opacity: menuOpacity,
                },
              ]}
            >
              <View style={styles.menuGrid}>
                {menuOptions.map((option, index) => (
                  <Animated.View
                    key={option.title}
                    style={[
                      styles.menuOption,
                      {
                        opacity: menuOpacity,
                        transform: [
                          {
                            scale: menuOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                          {
                            translateY: menuOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={option.action}
                      style={[
                        styles.menuButton,
                        { backgroundColor: option.color },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                    <Text style={styles.menuLabel}>{option.title}</Text>
                  </Animated.View>
                ))}
              </View>
              
              {/* Close instruction */}
              <Text style={styles.closeInstruction}>Tap anywhere to close</Text>
            </Animated.View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100, // Above the tab bar
    alignSelf: 'center',
    zIndex: 1000,
  },
  buttonTouchable: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6F4C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F4C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  menuOption: {
    alignItems: 'center',
    width: 80,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  closeInstruction: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});

export default FloatingCameraButton;
