import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AboutCoachGlowScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#e7f8f4', '#fce7e3']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Coach Glow</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Main Content Card */}
          <View style={styles.mainCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle-outline" size={48} color="#937AFD" />
            </View>
            
            <Text style={styles.title}>Coach Glow Disclaimer</Text>
            
            <View style={styles.contentCard}>
              <Text style={styles.disclaimerText}>
                Coach Glow uses publicly available health and fitness knowledge and general best practices to generate its responses. All advice is for educational purposes only.
              </Text>
            </View>
            
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoTitle}>Important Notes:</Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Always consult with healthcare professionals before making significant changes to your diet or exercise routine</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Individual results may vary based on personal circumstances</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>This app is not a substitute for professional medical advice</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(147, 122, 253, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232323',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  contentCard: {
    backgroundColor: 'rgba(147, 122, 253, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#937AFD',
  },
  disclaimerText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  additionalInfo: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#937AFD',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    flex: 1,
  },
});

export default AboutCoachGlowScreen;
