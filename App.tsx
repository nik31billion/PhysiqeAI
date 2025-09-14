import React from 'react';
import { AppNavigator } from './navigation';
import { AuthProvider } from './utils/AuthContext';
import { OnboardingProvider } from './utils/OnboardingContext';
import { NotificationProvider } from './utils/NotificationContext';
import NotificationManager from './components/NotificationManager';

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <NotificationProvider>
          <NotificationManager>
            <AppNavigator />
          </NotificationManager>
        </NotificationProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
