import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDevices } from '../context/DeviceContext';

const TemperatureScreen = () => {
  const { devices, temperatureAlerts, clearTemperatureAlerts, loadDevices } = useDevices();
  const [refreshing, setRefreshing] = React.useState(false);

  const targetDevices = devices.filter(device => device.role === 'Target');

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const getTemperatureSeverity = (temperature) => {
    if (temperature < 35) return { level: 'Normal', color: '#4CAF50' };
    if (temperature < 40) return { level: 'Warning', color: '#FF9800' };
    if (temperature < 45) return { level: 'High', color: '#FF5722' };
    return { level: 'Critical', color: '#F44336' };
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const renderDevice = ({ item }) => {
    const severity = getTemperatureSeverity(item.temperature);
    
    return (
      <View style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <Icon name="phone-portrait" size={24} color="#007AFF" />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceType}>{item.type}</Text>
          </View>
          <View style={styles.temperatureContainer}>
            <Text style={[styles.temperatureValue, { color: severity.color }]}>
              {item.temperature}°C
            </Text>
            <Text style={[styles.severityText, { color: severity.color }]}>
              {severity.level}
            </Text>
          </View>
        </View>
        
        <View style={styles.temperatureBar}>
          <View 
            style={[
              styles.temperatureFill, 
              { 
                width: `${Math.min(item.temperature / 50 * 100, 100)}%`,
                backgroundColor: severity.color
              }
            ]} 
          />
        </View>

        <View style={styles.deviceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: item.status === 'Connected' ? '#4CAF50' : '#666' }]}>
              {item.status}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Last Seen</Text>
            <Text style={styles.statValue}>
              {formatTime(item.lastSeen)}
            </Text>
          </View>
          {item.batteryLevel && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Battery</Text>
              <Text style={styles.statValue}>
                {Math.round(item.batteryLevel)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAlert = ({ item }) => {
    const severity = getTemperatureSeverity(item.temperature);
    
    return (
      <View style={[styles.alertCard, { borderLeftColor: severity.color }]}>
        <View style={styles.alertHeader}>
          <Icon name="warning" size={20} color={severity.color} />
          <Text style={styles.alertDevice}>{item.deviceName}</Text>
          <Text style={styles.alertTime}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        <Text style={styles.alertMessage}>
          Temperature alert: {item.temperature}°C ({severity.level})
        </Text>
      </View>
    );
  };

  const renderEmptyDevices = () => (
    <View style={styles.emptyState}>
      <Icon name="thermometer" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No devices to monitor</Text>
      <Text style={styles.emptySubtitle}>
        Add and connect target devices to monitor their temperature
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Temperature Alerts */}
      {temperatureAlerts.length > 0 && (
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Text style={styles.alertsTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={clearTemperatureAlerts}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={temperatureAlerts.slice(0, 3)} // Show only 3 most recent
            renderItem={renderAlert}
            keyExtractor={(item, index) => `alert-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Device Temperature List */}
      <View style={styles.devicesSection}>
        <Text style={styles.sectionTitle}>Device Temperature</Text>
        <FlatList
          data={targetDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyDevices}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Safety Information */}
      <View style={styles.safetyInfo}>
        <View style={styles.safetyHeader}>
          <Icon name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.safetyTitle}>Safety Thresholds</Text>
        </View>
        <View style={styles.safetyThresholds}>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.thresholdText}>Normal: &lt; 35°C</Text>
          </View>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.thresholdText}>Warning: 35-40°C</Text>
          </View>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdColor, { backgroundColor: '#FF5722' }]} />
            <Text style={styles.thresholdText}>High: 40-45°C</Text>
          </View>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.thresholdText}>Critical: &gt; 45°C</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  alertsSection: {
    backgroundColor: 'white',
    marginBottom: 8,
    paddingTop: 16,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertDevice: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#000',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
  },
  devicesSection: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#000',
  },
  deviceCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  temperatureContainer: {
    alignItems: 'flex-end',
  },
  temperatureValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  temperatureBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 12,
  },
  temperatureFill: {
    height: '100%',
    borderRadius: 3,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
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
  safetyInfo: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000',
  },
  safetyThresholds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  thresholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  thresholdColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  thresholdText: {
    fontSize: 12,
    color: '#333',
  },
});

export default TemperatureScreen;