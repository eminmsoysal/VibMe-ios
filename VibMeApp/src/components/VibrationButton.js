import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const VibrationButton = ({
  title,
  pattern = 'Pulse',
  onPress,
  isActive = false,
  disabled = false,
  style = {},
  hapticFeedback = true
}) => {
  const handlePress = () => {
    if (disabled) return;

    if (hapticFeedback) {
      // Provide haptic feedback based on pattern
      switch (pattern) {
        case 'Pulse':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'Wave':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'Heartbeat':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.activeButton,
        disabled && styles.disabledButton,
        style
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        isActive && styles.activeButtonText,
        disabled && styles.disabledButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeButtonText: {
    color: '#FFF',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default VibrationButton;
