import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DeviceContext';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const { devices, clearError, connectionStatus } = useDevices();

  const connectedDevicesCount = devices.filter(d => d.status === 'Connected').length;
  const totalDevicesCount = devices.length;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all devices and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you would implement data clearing
            Alert.alert('Info', 'Data clearing would be implemented here');
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About VibMe',
      'VibMe is a cross-platform vibration control application that allows users to connect and control various devices through Bluetooth and online connectivity.\n\nVersion: 1.0.0\nBuilt with React Native and .NET 8',
      [{ text: 'OK' }]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'reconnecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'reconnecting': return 'Reconnecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Icon name="person" size={40} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.username}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="globe" size={20} color="#666" />
              <Text style={styles.settingLabel}>Server Status</Text>
            </View>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { backgroundColor: getConnectionStatusColor() }
                ]} 
              />
              <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
                {getConnectionStatusText()}
              </Text>
            </View>
          </View>
        </View>

        {/* Device Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devices</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalDevicesCount}</Text>
              <Text style={styles.statLabel}>Total Devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{connectedDevicesCount}</Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearError}>
            <View style={styles.settingLeft}>
              <Icon name="refresh" size={20} color="#666" />
              <Text style={styles.settingLabel}>Refresh Devices</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Safety Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="thermometer" size={20} color="#666" />
              <Text style={styles.settingLabel}>Temperature Monitoring</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Enabled</Text>
              <View style={[styles.toggle, styles.toggleActive]}>
                <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
              </View>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="warning" size={20} color="#666" />
              <Text style={styles.settingLabel}>Max Safe Temperature</Text>
            </View>
            <Text style={styles.settingValue}>40.0°C</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="shield-checkmark" size={20} color="#666" />
              <Text style={styles.settingLabel}>Emergency Stop</Text>
            </View>
            <Text style={styles.settingValue}>Always Available</Text>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingLeft}>
              <Icon name="information-circle" size={20} color="#666" />
              <Text style={styles.settingLabel}>About VibMe</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="code-slash" size={20} color="#666" />
              <Text style={styles.settingLabel}>Version</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="logo-react" size={20} color="#666" />
              <Text style={styles.settingLabel}>Built with</Text>
            </View>
            <Text style={styles.settingValue}>React Native</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <Icon name="trash" size={20} color="#F44336" />
              <Text style={[styles.settingLabel, { color: '#F44336' }]}>Clear All Data</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <Icon name="log-out" size={20} color="#F44336" />
              <Text style={[styles.settingLabel, { color: '#F44336' }]}>Sign Out</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            VibMe - Cross-platform vibration control with safety monitoring
          </Text>
        </View>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffebee',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SettingsScreen;