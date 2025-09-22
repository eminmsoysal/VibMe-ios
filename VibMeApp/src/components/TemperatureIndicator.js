import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const TemperatureIndicator = ({ 
  temperature, 
  showIcon = true, 
  size = 'medium',
  showStatus = true 
}) => {
  const getTemperatureSeverity = (temp) => {
    if (temp < 35) {
      return { level: 'Normal', color: '#4CAF50' };
    } else if (temp < 40) {
      return { level: 'Warning', color: '#FF9800' };
    } else if (temp < 45) {
      return { level: 'High', color: '#FF5722' };
    } else {
      return { level: 'Critical', color: '#F44336' };
    }
  };

  const severity = getTemperatureSeverity(temperature);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {showIcon && (
        <Icon 
          name="thermometer" 
          size={sizeStyles.iconSize} 
          color={severity.color} 
          style={styles.icon}
        />
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.temperature, sizeStyles.temperature, { color: severity.color }]}>
          {temperature.toFixed(1)}°C
        </Text>
        {showStatus && (
          <Text style={[styles.status, sizeStyles.status, { color: severity.color }]}>
            {severity.level}
          </Text>
        )}
      </View>
    </View>
  );
};

const getSizeStyles = (size) => {
  switch (size) {
    case 'small':
      return {
        container: { padding: 4 },
        iconSize: 16,
        temperature: { fontSize: 12 },
        status: { fontSize: 10 }
      };
    case 'large':
      return {
        container: { padding: 12 },
        iconSize: 32,
        temperature: { fontSize: 20 },
        status: { fontSize: 14 }
      };
    default: // medium
      return {
        container: { padding: 8 },
        iconSize: 24,
        temperature: { fontSize: 16 },
        status: { fontSize: 12 }
      };
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  temperature: {
    fontWeight: 'bold',
  },
  status: {
    fontWeight: '600',
    marginTop: 2,
  },
});

export default TemperatureIndicator;