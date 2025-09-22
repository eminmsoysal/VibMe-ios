import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const PrimaryButton = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  style = {}, 
  textStyle = {},
  variant = 'primary' // 'primary', 'secondary', 'danger'
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    } else {
      switch (variant) {
        case 'secondary':
          baseStyle.push(styles.secondary);
          break;
        case 'danger':
          baseStyle.push(styles.danger);
          break;
        default:
          baseStyle.push(styles.primary);
      }
    }
    
    baseStyle.push(style);
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    if (variant === 'secondary') {
      baseStyle.push(styles.secondaryText);
    } else {
      baseStyle.push(styles.primaryText);
    }
    
    baseStyle.push(textStyle);
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#007AFF' : 'white'} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  disabled: {
    backgroundColor: '#F2F2F7',
    borderColor: '#F2F2F7',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: '#007AFF',
  },
});

export default PrimaryButton;