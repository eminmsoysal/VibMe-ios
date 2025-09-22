import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const StatusIndicator = ({ 
  status, 
  label, 
  size = 'medium', // 'small', 'medium', 'large'
  showLabel = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: '#4CAF50',
          icon: 'checkmark-circle',
          text: 'Connected'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          color: '#FF9800',
          icon: 'sync',
          text: 'Connecting...'
        };
      case 'disconnected':
        return {
          color: '#9E9E9E',
          icon: 'close-circle',
          text: 'Disconnected'
        };
      case 'error':
        return {
          color: '#F44336',
          icon: 'warning',
          text: 'Error'
        };
      case 'normal':
        return {
          color: '#4CAF50',
          icon: 'thermometer',
          text: 'Normal'
        };
      case 'warning':
        return {
          color: '#FF9800',
          icon: 'warning',
          text: 'Warning'
        };
      case 'high':
        return {
          color: '#FF5722',
          icon: 'flame',
          text: 'High'
        };
      case 'critical':
        return {
          color: '#F44336',
          icon: 'alert',
          text: 'Critical'
        };
      default:
        return {
          color: '#9E9E9E',
          icon: 'help-circle',
          text: 'Unknown'
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: 12 };
      case 'large':
        return { iconSize: 24, fontSize: 16 };
      default:
        return { iconSize: 20, fontSize: 14 };
    }
  };

  const config = getStatusConfig();
  const sizeStyle = getSizeStyle();
  const displayText = label || config.text;

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: config.color }]}>
        <Icon 
          name={config.icon} 
          size={sizeStyle.iconSize} 
          color="white" 
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: sizeStyle.fontSize, color: config.color }]}>
          {displayText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default StatusIndicator;