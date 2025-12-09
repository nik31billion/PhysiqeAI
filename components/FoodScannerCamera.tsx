import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface FoodScannerCameraProps {
  onClose: () => void;
  onImageCaptured: (imageUri: string) => void;
  scanMode: 'food' | 'barcode' | 'label' | 'library';
}

const FoodScannerCamera: React.FC<FoodScannerCameraProps> = ({
  onClose,
  onImageCaptured,
  scanMode,
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - No conditional returns before this point!
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant access to your photo library.');
        return;
      }

      console.log('Opening image library picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        // Add these options for better compatibility
        exif: false,
        base64: false,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Selected image URI:', result.assets[0].uri);
        onImageCaptured(result.assets[0].uri);
      } else {
        console.log('Image selection was canceled');
        // If user cancels, close the screen
        onClose();
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert(
        'Error',
        'Failed to open photo library. Please try again or use the camera instead.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, [onImageCaptured, onClose]);

  const takePicture = useCallback(async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        onImageCaptured(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  }, [isCapturing, onImageCaptured]);

  useEffect(() => {
    // Handle library mode properly without causing render issues
    if (scanMode === 'library') {
      const handleLibraryMode = async () => {
        // Small delay to ensure component is fully mounted
        setTimeout(async () => {
          await pickImage();
          // Don't call onClose here - let pickImage handle the navigation
        }, 100);
      };
      handleLibraryMode();
      return;
    }

    // Pulse animation for scan overlay
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Scan line animation
    const scanLineAnimation = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    if (scanMode === 'barcode') {
      scanLineAnimation.start();
    }

    return () => {
      pulseAnimation.stop();
      scanLineAnimation.stop();
    };
  }, [scanMode]); // Removed pickImage from dependencies to prevent infinite re-renders

  // NOW we can have conditional returns - all hooks have been called
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F4C" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#ccc" />
        <Text style={styles.permissionText}>Camera access is required to scan food</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scanMode === 'library') {
    // Library mode is handled in useEffect to avoid render issues
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F4C" />
        <Text style={styles.loadingText}>Opening photo library...</Text>
      </View>
    );
  }

  const getScanOverlay = () => {
    const overlaySize = scanMode === 'barcode' ? { width: 280, height: 120 } : { width: 250, height: 250 };
    
    return (
      <View style={styles.scanOverlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <Animated.View
            style={[
              styles.scanFrame,
              overlaySize,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scan line for barcode */}
            {scanMode === 'barcode' && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, overlaySize.height - 4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>
    );
  };

  const getScanInstructions = () => {
    switch (scanMode) {
      case 'food':
        return 'Position the food within the frame';
      case 'barcode':
        return 'Align the barcode within the frame';
      case 'label':
        return 'Capture the nutrition label clearly';
      default:
        return 'Position the item within the frame';
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={type}
        flash={flashMode}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Scan {scanMode === 'label' ? 'Food Label' : scanMode}
          </Text>
          <TouchableOpacity
            onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
            style={styles.flashButton}
          >
            <Ionicons
              name={flashMode === 'off' ? 'flash-off' : 'flash'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Scan overlay */}
        {getScanOverlay()}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{getScanInstructions()}</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
            <Ionicons name="images-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={takePicture}
            style={styles.captureButton}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <View style={styles.captureButtonInner}>
                <Ionicons name="camera" size={32} color="#FF6F4C" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType(type === 'back' ? 'front' : 'back')}
            style={styles.flipButton}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'Poppins-Regular',
  },
  permissionButton: {
    backgroundColor: '#FF6F4C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'capitalize',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  overlayMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 250,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  scanFrame: {
    borderWidth: 2,
    borderColor: '#FF6F4C',
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF6F4C',
    shadowColor: '#FF6F4C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontFamily: 'Poppins-Regular',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FoodScannerCamera;
