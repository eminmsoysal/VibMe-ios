import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Slider,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDevices } from '../context/DeviceContext';

const ControllerScreen = () => {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    sendVibrationCommand,
    sendEmergencyStop,
    connectionStatus,
  } = useDevices();

  const [vibrationSettings, setVibrationSettings] = useState({
    pattern: 'Pulse',
    intensity: 0.5,
    duration: 1.0,
    intervalBetweenPatterns: 0.5,
    isRepeating: false,
  });

  const [isVibrating, setIsVibrating] = useState(false);

  const targetDevices = devices.filter(
    (device) => device.role === 'Target' && device.status === 'Connected'
  );

  const vibrationPatterns = [
    { value: 'Pulse', label: 'Pulse', description: 'Quick pulses with pauses' },
    { value: 'Wave', label: 'Wave', description: 'Gradual intensity waves' },
    { value: 'Heartbeat', label: 'Heartbeat', description: 'Rhythmic heartbeat pattern' },
    { value: 'Rhythm', label: 'Rhythm', description: 'Musical rhythm pattern' },
    { value: 'Steady', label: 'Steady', description: 'Constant vibration' },
    { value: 'Custom', label: 'Custom', description: 'User-defined pattern' },
  ];

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleStartVibration = async () => {
    if (!selectedDevice) {
      Alert.alert('No Device Selected', 'Please select a target device first');
      return;
    }

    if (connectionStatus !== 'connected') {
      Alert.alert('Connection Error', 'Not connected to server');
      return;
    }

    const command = {
      pattern: vibrationSettings.pattern,
      intensity: vibrationSettings.intensity,
      duration: vibrationSettings.duration,
      intervalBetweenPatterns: vibrationSettings.intervalBetweenPatterns,
      isRepeating: vibrationSettings.isRepeating,
      targetDeviceId: selectedDevice.id,
      senderId: selectedDevice.id, // In a real app, this would be the current user's device ID
      createdAt: new Date().toISOString(),
    };

    const result = await sendVibrationCommand(command);
    
    if (result.success) {
      setIsVibrating(true);
      
      // Trigger local haptic feedback for immediate response
      triggerLocalHaptic(vibrationSettings.pattern);
      
      // Auto-stop after duration if not repeating
      if (!vibrationSettings.isRepeating) {
        setTimeout(() => {
          setIsVibrating(false);
        }, vibrationSettings.duration * 1000);
      }
    } else {
      Alert.alert('Vibration Failed', result.message);
    }
  };

  const handleStopVibration = () => {
    setIsVibrating(false);
    // In a real implementation, you would send a stop command to the target device
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      'Emergency Stop',
      'This will immediately stop all vibrations on all connected devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop All',
          style: 'destructive',
          onPress: async () => {
            for (const device of targetDevices) {
              await sendEmergencyStop(device.id);
            }
            setIsVibrating(false);
          },
        },
      ]
    );
  };

  const handleTestVibration = (pattern) => {
    const testSettings = {
      ...vibrationSettings,
      pattern,
      duration: 0.5, // Short test duration
    };
    
    triggerLocalHaptic(pattern);
  };

  const triggerLocalHaptic = (pattern) => {
    switch (pattern) {
      case 'Pulse':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'Wave':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        break;
      case 'Heartbeat':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
        break;
      case 'Rhythm':
        [0, 250, 750, 1000, 1250].forEach((delay) => {
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), delay);
        });
        break;
      case 'Steady':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const getTemperatureSeverity = (temperature) => {
    if (temperature < 35) return { level: 'Normal', color: '#4CAF50' };
    if (temperature < 40) return { level: 'Warning', color: '#FF9800' };
    if (temperature < 45) return { level: 'High', color: '#FF5722' };
    return { level: 'Critical', color: '#F44336' };
  };

  if (targetDevices.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="game-controller" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Target Devices</Text>
          <Text style={styles.emptySubtitle}>
            Connect target devices to start controlling vibrations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Device Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Device</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.deviceSelector}>
              {targetDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceCard,
                    selectedDevice?.id === device.id && styles.selectedDeviceCard,
                  ]}
                  onPress={() => handleDeviceSelect(device)}
                >
                  <Icon
                    name="phone-portrait"
                    size={24}
                    color={selectedDevice?.id === device.id ? 'white' : '#007AFF'}
                  />
                  <Text
                    style={[
                      styles.deviceCardText,
                      selectedDevice?.id === device.id && styles.selectedDeviceCardText,
                    ]}
                  >
                    {device.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {selectedDevice && (
          <>
            {/* Temperature Status */}
            <View style={styles.section}>
              <View style={styles.temperatureCard}>
                <View style={styles.temperatureHeader}>
                  <Icon name="thermometer" size={20} color={getTemperatureSeverity(selectedDevice.temperature).color} />
                  <Text style={styles.temperatureTitle}>Device Temperature</Text>
                  <Text style={[styles.temperatureValue, { color: getTemperatureSeverity(selectedDevice.temperature).color }]}>
                    {selectedDevice.temperature}°C
                  </Text>
                </View>
                <View style={styles.temperatureBar}>
                  <View 
                    style={[
                      styles.temperatureFill, 
                      { 
                        width: `${Math.min(selectedDevice.temperature / 50 * 100, 100)}%`,
                        backgroundColor: getTemperatureSeverity(selectedDevice.temperature).color
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.temperatureStatus, { color: getTemperatureSeverity(selectedDevice.temperature).color }]}>
                  Status: {getTemperatureSeverity(selectedDevice.temperature).level}
                </Text>
              </View>
            </View>

            {/* Vibration Controls */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vibration Pattern</Text>
              <View style={styles.patternGrid}>
                {vibrationPatterns.map((pattern) => (
                  <TouchableOpacity
                    key={pattern.value}
                    style={[
                      styles.patternButton,
                      vibrationSettings.pattern === pattern.value && styles.selectedPatternButton,
                    ]}
                    onPress={() => setVibrationSettings(prev => ({ ...prev, pattern: pattern.value }))}
                    onLongPress={() => handleTestVibration(pattern.value)}
                  >
                    <Text
                      style={[
                        styles.patternButtonText,
                        vibrationSettings.pattern === pattern.value && styles.selectedPatternButtonText,
                      ]}
                    >
                      {pattern.label}
                    </Text>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Intensity Control */}
            <View style={styles.section}>
              <View style={styles.controlHeader}>
                <Text style={styles.sectionTitle}>Intensity</Text>
                <Text style={styles.controlValue}>{Math.round(vibrationSettings.intensity * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                value={vibrationSettings.intensity}
                onValueChange={(value) => setVibrationSettings(prev => ({ ...prev, intensity: value }))}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E0E0E0"
                disabled={isVibrating}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Gentle</Text>
                <Text style={styles.sliderLabel}>Intense</Text>
              </View>
            </View>

            {/* Duration Control */}
            <View style={styles.section}>
              <View style={styles.controlHeader}>
                <Text style={styles.sectionTitle}>Duration</Text>
                <Text style={styles.controlValue}>{vibrationSettings.duration.toFixed(1)}s</Text>
              </View>
              <Slider
                style={styles.slider}
                value={vibrationSettings.duration}
                onValueChange={(value) => setVibrationSettings(prev => ({ ...prev, duration: value }))}
                minimumValue={0.1}
                maximumValue={10}
                step={0.1}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E0E0E0"
                disabled={isVibrating}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0.1s</Text>
                <Text style={styles.sliderLabel}>10s</Text>
              </View>
            </View>

            {/* Repeat Toggle */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setVibrationSettings(prev => ({ ...prev, isRepeating: !prev.isRepeating }))}
                disabled={isVibrating}
              >
                <Text style={styles.toggleLabel}>Repeat Pattern</Text>
                <View style={[styles.toggle, vibrationSettings.isRepeating && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, vibrationSettings.isRepeating && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              {vibrationSettings.isRepeating && (
                <View style={styles.intervalControl}>
                  <View style={styles.controlHeader}>
                    <Text style={styles.intervalLabel}>Interval Between Patterns</Text>
                    <Text style={styles.controlValue}>{vibrationSettings.intervalBetweenPatterns.toFixed(1)}s</Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    value={vibrationSettings.intervalBetweenPatterns}
                    onValueChange={(value) => setVibrationSettings(prev => ({ ...prev, intervalBetweenPatterns: value }))}
                    minimumValue={0.1}
                    maximumValue={5}
                    step={0.1}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#E0E0E0"
                    disabled={isVibrating}
                  />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.section}>
              <View style={styles.actionButtons}>
                {isVibrating ? (
                  <TouchableOpacity style={styles.stopButton} onPress={handleStopVibration}>
                    <Icon name="stop" size={20} color="white" />
                    <Text style={styles.stopButtonText}>Stop</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.startButton} onPress={handleStartVibration}>
                    <Icon name="play" size={20} color="white" />
                    <Text style={styles.startButtonText}>Start Vibration</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => handleTestVibration(vibrationSettings.pattern)}
                >
                  <Icon name="pulse" size={20} color="white" />
                  <Text style={styles.testButtonText}>Test</Text>
                </TouchableOpacity>
              </View>

              {/* Emergency Stop */}
              <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyStop}>
                <Icon name="warning" size={20} color="#F44336" />
                <Text style={styles.emergencyButtonText}>Emergency Stop All</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  deviceSelector: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  deviceCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
  },
  selectedDeviceCard: {
    backgroundColor: '#007AFF',
  },
  deviceCardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedDeviceCardText: {
    color: 'white',
  },
  temperatureCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  temperatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperatureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#000',
  },
  temperatureValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  temperatureBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  temperatureFill: {
    height: '100%',
    borderRadius: 2,
  },
  temperatureStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  patternButton: {
    width: '48%',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedPatternButton: {
    backgroundColor: '#007AFF',
  },
  patternButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  selectedPatternButtonText: {
    color: 'white',
  },
  patternDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  intervalControl: {
    marginTop: 16,
  },
  intervalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  emergencyButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ControllerScreen;