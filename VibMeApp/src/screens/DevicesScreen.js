import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDevices } from '../context/DeviceContext';

const DevicesScreen = () => {
  const {
    devices,
    isScanning,
    loading,
    error,
    loadDevices,
    addDevice,
    connectDevice,
    disconnectDevice,
    removeDevice,
    startScanning,
    stopScanning,
    clearError,
  } = useDevices();

  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const handleScan = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const handleDevicePress = (device) => {
    Alert.alert(
      device.name,
      `Status: ${device.status}\nTemperature: ${device.temperature}°C`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(device.status === 'Connected'
          ? [{ text: 'Disconnect', onPress: () => handleDisconnect(device.id) }]
          : [{ text: 'Connect', onPress: () => handleConnect(device.id) }]),
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemove(device.id),
        },
      ]
    );
  };

  const handleConnect = async (deviceId) => {
    const result = await connectDevice(deviceId);
    if (!result.success) {
      Alert.alert('Connection Failed', result.message);
    }
  };

  const handleDisconnect = async (deviceId) => {
    const result = await disconnectDevice(deviceId);
    if (!result.success) {
      Alert.alert('Disconnect Failed', result.message);
    }
  };

  const handleRemove = (deviceId) => {
    Alert.alert(
      'Remove Device',
      'Are you sure you want to remove this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeDevice(deviceId);
            if (!result.success) {
              Alert.alert('Remove Failed', result.message);
            }
          },
        },
      ]
    );
  };

  const renderDevice = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const temperatureSeverity = getTemperatureSeverity(item.temperature);

    return (
      <TouchableOpacity style={styles.deviceCard} onPress={() => handleDevicePress(item)}>
        <View style={styles.deviceHeader}>
          <Icon name={getDeviceIcon(item.type)} size={24} color="#007AFF" />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceType}>{item.type} • {item.role}</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        </View>

        <View style={styles.deviceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={styles.detailValue}>{item.connectionType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Temperature:</Text>
            <Text style={[styles.detailValue, { color: temperatureSeverity.color }]}>
              {item.temperature}°C
            </Text>
          </View>
          {item.batteryLevel && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Battery:</Text>
              <Text style={styles.detailValue}>{Math.round(item.batteryLevel)}%</Text>
            </View>
          )}
        </View>

        <View style={styles.deviceActions}>
          {item.status === 'Connected' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.disconnectButton]}
              onPress={() => handleDisconnect(item.id)}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => handleConnect(item.id)}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="phone-portrait" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No devices found</Text>
      <Text style={styles.emptySubtitle}>
        Tap the scan button to discover nearby devices or add a device manually
      </Text>
      <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && devices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isScanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.scanningText}>Scanning...</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleScan}>
            <Icon name="search" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Icon name="close" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          devices.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <AddDeviceModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addDevice}
      />
    </SafeAreaView>
  );
};

const AddDeviceModal = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('iOSPhone');
  const [role, setRole] = useState('Target');
  const [connectionType, setConnectionType] = useState('Bluetooth');
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    { value: 'iOSPhone', label: 'iOS Phone' },
    { value: 'AndroidPhone', label: 'Android Phone' },
    { value: 'SmartWatch', label: 'Smart Watch' },
    { value: 'WindowsPC', label: 'Windows PC' },
    { value: 'macOS', label: 'macOS' },
  ];

  const roles = [
    { value: 'Controller', label: 'Controller' },
    { value: 'Target', label: 'Target' },
  ];

  const connectionTypes = [
    { value: 'Bluetooth', label: 'Bluetooth' },
    { value: 'Online', label: 'Online' },
    { value: 'Local', label: 'Local' },
  ];

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }

    setLoading(true);
    
    const result = await onAdd({
      name: name.trim(),
      type,
      role,
      connectionType,
    });

    setLoading(false);

    if (result.success) {
      setName('');
      setType('iOSPhone');
      setRole('Target');
      setConnectionType('Bluetooth');
      onClose();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Device</Text>
          <TouchableOpacity onPress={handleAdd} disabled={loading}>
            <Text style={[styles.modalAdd, loading && styles.modalAddDisabled]}>
              {loading ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Device Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter device name"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          {/* For simplicity, using text inputs. In a real app, you'd use pickers */}
          <Text style={styles.inputLabel}>Device Type</Text>
          <TextInput
            style={styles.input}
            value={type}
            editable={false}
            placeholder="Device type"
          />

          <Text style={styles.inputLabel}>Role</Text>
          <TextInput
            style={styles.input}
            value={role}
            editable={false}
            placeholder="Device role"
          />

          <Text style={styles.inputLabel}>Connection Type</Text>
          <TextInput
            style={styles.input}
            value={connectionType}
            editable={false}
            placeholder="Connection type"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Connected': return '#4CAF50';
    case 'Connecting': return '#FF9800';
    case 'Error': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getTemperatureSeverity = (temperature) => {
  if (temperature < 35) return { level: 'Normal', color: '#4CAF50' };
  if (temperature < 40) return { level: 'Warning', color: '#FF9800' };
  if (temperature < 45) return { level: 'High', color: '#FF5722' };
  return { level: 'Critical', color: '#F44336' };
};

const getDeviceIcon = (type) => {
  switch (type) {
    case 'iOSPhone': return 'phone-portrait';
    case 'AndroidPhone': return 'phone-portrait';
    case 'SmartWatch': return 'watch';
    case 'WindowsPC': return 'desktop';
    case 'macOS': return 'laptop';
    default: return 'hardware-chip';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: '#d32f2f',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#f0f0f0',
  },
  disconnectButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalAdd: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalAddDisabled: {
    color: '#ccc',
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

export default DevicesScreen;