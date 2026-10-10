import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.eventHandlers = {};
  }

  async connect() {
    try {
      if (this.connection && this.isConnected) {
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5276/vibmehub') // Change this to your backend URL
        .withAutomaticReconnect()
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      await this.connection.start();
      this.isConnected = true;
      
      console.log('SignalR connection established');
      this.triggerEvent('connectionStatusChange', 'connected');
      
    } catch (error) {
      console.error('SignalR connection error:', error);
      this.isConnected = false;
      this.triggerEvent('connectionStatusChange', 'error');
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.stop();
        this.isConnected = false;
        this.triggerEvent('connectionStatusChange', 'disconnected');
        console.log('SignalR connection closed');
      }
    } catch (error) {
      console.error('SignalR disconnect error:', error);
    }
  }

  setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on('Connected', (data) => {
      console.log('SignalR Connected:', data);
    });

    this.connection.on('DeviceStatusUpdate', (update) => {
      this.triggerEvent('deviceStatusUpdate', update);
    });

    this.connection.on('TemperatureAlert', (alert) => {
      this.triggerEvent('temperatureAlert', alert);
    });

    this.connection.on('VibrationCommand', (command) => {
      console.log('Received vibration command:', command);
    });

    this.connection.on('EmergencyStop', (command) => {
      console.log('Received emergency stop:', command);
      this.triggerEvent('emergencyStop', command);
    });

    this.connection.on('DevicesDiscovered', (devices) => {
      this.triggerEvent('devicesDiscovered', devices);
    });

    this.connection.on('CommandSent', (response) => {
      console.log('Command sent response:', response);
    });

    this.connection.on('Error', (error) => {
      console.error('SignalR error:', error);
      this.triggerEvent('error', error);
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.isConnected = false;
      this.triggerEvent('connectionStatusChange', 'reconnecting');
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.isConnected = true;
      this.triggerEvent('connectionStatusChange', 'connected');
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.isConnected = false;
      this.triggerEvent('connectionStatusChange', 'disconnected');
    });
  }

  async joinUserGroup(userId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('JoinUserGroup', userId);
        console.log('Joined user group:', userId);
      } catch (error) {
        console.error('Error joining user group:', error);
      }
    }
  }

  async joinDeviceGroup(deviceId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('JoinDeviceGroup', deviceId);
        console.log('Joined device group:', deviceId);
      } catch (error) {
        console.error('Error joining device group:', error);
      }
    }
  }

  async leaveDeviceGroup(deviceId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('LeaveDeviceGroup', deviceId);
        console.log('Left device group:', deviceId);
      } catch (error) {
        console.error('Error leaving device group:', error);
      }
    }
  }

  async sendVibrationCommand(command) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('SendVibrationCommand', command);
        console.log('Sent vibration command:', command);
      } catch (error) {
        console.error('Error sending vibration command:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR not connected');
    }
  }

  async sendEmergencyStop(targetDeviceId, senderId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('SendEmergencyStop', targetDeviceId, senderId);
        console.log('Sent emergency stop:', targetDeviceId);
      } catch (error) {
        console.error('Error sending emergency stop:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR not connected');
    }
  }

  async updateDeviceStatus(deviceId, status, temperature, batteryLevel) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('UpdateDeviceStatus', deviceId, status, temperature, batteryLevel);
      } catch (error) {
        console.error('Error updating device status:', error);
      }
    }
  }

  async discoverDevices() {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('DiscoverDevices');
        console.log('Device discovery started');
      } catch (error) {
        console.error('Error discovering devices:', error);
      }
    }
  }

  async sendHeartbeat(deviceId) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('SendHeartbeat', deviceId);
      } catch (error) {
        console.error('Error sending heartbeat:', error);
      }
    }
  }

  // Event handling
  on(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push(handler);
  }

  off(eventName, handler) {
    if (this.eventHandlers[eventName]) {
      const index = this.eventHandlers[eventName].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[eventName].splice(index, 1);
      }
    }
  }

  triggerEvent(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  // Convenience methods for common event subscriptions
  onDeviceStatusUpdate(handler) {
    this.on('deviceStatusUpdate', handler);
  }

  onTemperatureAlert(handler) {
    this.on('temperatureAlert', handler);
  }

  onConnectionStatusChange(handler) {
    this.on('connectionStatusChange', handler);
  }

  onDevicesDiscovered(handler) {
    this.on('devicesDiscovered', handler);
  }

  onEmergencyStop(handler) {
    this.on('emergencyStop', handler);
  }

  onError(handler) {
    this.on('error', handler);
  }
}

// Export singleton instance
export default new SignalRService();