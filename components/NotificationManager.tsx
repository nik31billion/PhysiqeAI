import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import NotificationToast from './NotificationToast';
import MilestoneCelebrationModal from './MilestoneCelebrationModal';

interface ToastState {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'celebration';
}

interface MilestoneState {
  visible: boolean;
  milestone: string;
  streakDays?: number;
}

interface NotificationManagerProps {
  children: React.ReactNode;
}

// Global notification state
let globalToastState: ToastState = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
};

let globalMilestoneState: MilestoneState = {
  visible: false,
  milestone: '',
};

// Global functions to control notifications
export const showToast = (
  title: string,
  message: string,
  type: 'success' | 'info' | 'warning' | 'celebration' = 'info'
) => {
  globalToastState = {
    visible: true,
    title,
    message,
    type,
  };
  // Trigger re-render by updating a global state or using a callback
  if (window.notificationUpdateCallback) {
    window.notificationUpdateCallback();
  }
};

export const showMilestone = (milestone: string, streakDays?: number) => {
  globalMilestoneState = {
    visible: true,
    milestone,
    streakDays,
  };
  if (window.notificationUpdateCallback) {
    window.notificationUpdateCallback();
  }
};

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [toastState, setToastState] = useState<ToastState>(globalToastState);
  const [milestoneState, setMilestoneState] = useState<MilestoneState>(globalMilestoneState);

  useEffect(() => {
    // Set up global callback
    window.notificationUpdateCallback = () => {
      setToastState({ ...globalToastState });
      setMilestoneState({ ...globalMilestoneState });
    };

    return () => {
      window.notificationUpdateCallback = null;
    };
  }, []);

  const handleToastClose = () => {
    setToastState(prev => ({ ...prev, visible: false }));
    globalToastState.visible = false;
  };

  const handleMilestoneClose = () => {
    setMilestoneState(prev => ({ ...prev, visible: false }));
    globalMilestoneState.visible = false;
  };

  const handleMilestoneContinue = () => {
    handleMilestoneClose();
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* Toast Notification */}
      <NotificationToast
        visible={toastState.visible}
        title={toastState.title}
        message={toastState.message}
        type={toastState.type}
        onClose={handleToastClose}
      />

      {/* Milestone Celebration Modal */}
      <MilestoneCelebrationModal
        visible={milestoneState.visible}
        milestone={milestoneState.milestone}
        streakDays={milestoneState.streakDays}
        onClose={handleMilestoneClose}
        onContinue={handleMilestoneContinue}
      />
    </View>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    notificationUpdateCallback: (() => void) | null;
  }
}

export default NotificationManager;
