import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceService } from '../services/DeviceService';
import { SignalRService } from '../services/SignalRService';
import { useAuth } from './AuthContext';

const DeviceContext = createContext();

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [temperatureAlerts, setTemperatureAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadDevices();
      connectToSignalR();
    }

    return () => {
      disconnectFromSignalR();
    };
  }, [user]);

  const connectToSignalR = async () => {
    try {
      await SignalRService.connect();
      
      if (user) {
        await SignalRService.joinUserGroup(user.id);
      }

      // Set up event listeners
      SignalRService.onDeviceStatusUpdate((update) => {
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.id === update.deviceId
              ? { ...device, ...update }
              : device
          )
        );
      });

      SignalRService.onTemperatureAlert((alert) => {
        setTemperatureAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      });

      SignalRService.onConnectionStatusChange((status) => {
        setConnectionStatus(status);
      });

      setConnectionStatus('connected');
    } catch (error) {
      console.error('SignalR connection error:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectFromSignalR = () => {
    SignalRService.disconnect();
    setConnectionStatus('disconnected');
  };

  const loadDevices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await DeviceService.getUserDevices(user.id);
      
      if (response.success) {
        setDevices(response.data || []);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to load devices');
      console.error('Load devices error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async (deviceData) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);

      const newDevice = {
        ...deviceData,
        userId: user.id,
        status: 'Disconnected',
        temperature: 20.0,
        lastSeen: new Date().toISOString(),
      };

      const response = await DeviceService.createDevice(newDevice);
      
      if (response.success) {
        setDevices(prev => [...prev, response.data]);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to add device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateDevice = async (deviceId, updates) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) return { success: false, message: 'Device not found' };

      const updatedDevice = { ...device, ...updates };
      const response = await DeviceService.updateDevice(deviceId, updatedDevice);
      
      if (response.success) {
        setDevices(prev =>
          prev.map(d => d.id === deviceId ? response.data : d)
        );
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to update device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const removeDevice = async (deviceId) => {
    try {
      const response = await DeviceService.deleteDevice(deviceId);
      
      if (response.success) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
        if (selectedDevice && selectedDevice.id === deviceId) {
          setSelectedDevice(null);
        }
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to remove device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const connectDevice = async (deviceId) => {
    try {
      const response = await DeviceService.connectDevice(deviceId);
      
      if (response.success) {
        await updateDevice(deviceId, { status: 'Connected' });
        
        // Join device group for real-time updates
        if (connectionStatus === 'connected') {
          await SignalRService.joinDeviceGroup(deviceId);
        }
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to connect device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const disconnectDevice = async (deviceId) => {
    try {
      const response = await DeviceService.disconnectDevice(deviceId);
      
      if (response.success) {
        await updateDevice(deviceId, { status: 'Disconnected' });
        
        // Leave device group
        if (connectionStatus === 'connected') {
          await SignalRService.leaveDeviceGroup(deviceId);
        }
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to disconnect device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const startScanning = async () => {
    setIsScanning(true);
    
    try {
      if (connectionStatus === 'connected') {
        await SignalRService.discoverDevices();
      }
      
      // Simulate scanning for demo purposes
      setTimeout(() => {
        setIsScanning(false);
      }, 5000);
      
    } catch (error) {
      console.error('Scanning error:', error);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const sendVibrationCommand = async (command) => {
    if (connectionStatus !== 'connected') {
      return { success: false, message: 'Not connected to server' };
    }

    try {
      await SignalRService.sendVibrationCommand(command);
      return { success: true };
    } catch (error) {
      console.error('Vibration command error:', error);
      return { success: false, message: 'Failed to send vibration command' };
    }
  };

  const sendEmergencyStop = async (deviceId) => {
    if (connectionStatus !== 'connected') {
      return { success: false, message: 'Not connected to server' };
    }

    try {
      await SignalRService.sendEmergencyStop(deviceId, user.id);
      return { success: true };
    } catch (error) {
      console.error('Emergency stop error:', error);
      return { success: false, message: 'Failed to send emergency stop' };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearTemperatureAlerts = () => {
    setTemperatureAlerts([]);
  };

  const value = {
    devices,
    selectedDevice,
    setSelectedDevice,
    isScanning,
    temperatureAlerts,
    connectionStatus,
    loading,
    error,
    loadDevices,
    addDevice,
    updateDevice,
    removeDevice,
    connectDevice,
    disconnectDevice,
    startScanning,
    stopScanning,
    sendVibrationCommand,
    sendEmergencyStop,
    clearError,
    clearTemperatureAlerts,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};