import ApiService from './ApiService';

export class DeviceService {
  static async getUserDevices(userId) {
    try {
      const response = await ApiService.get(`/devices/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Get user devices error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get devices',
        data: [],
      };
    }
  }

  static async createDevice(deviceData) {
    try {
      const response = await ApiService.post('/devices', deviceData);
      return response;
    } catch (error) {
      console.error('Create device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create device',
      };
    }
  }

  static async getDevice(deviceId) {
    try {
      const response = await ApiService.get(`/devices/${deviceId}`);
      return response;
    } catch (error) {
      console.error('Get device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get device',
      };
    }
  }

  static async updateDevice(deviceId, deviceData) {
    try {
      const response = await ApiService.put(`/devices/${deviceId}`, deviceData);
      return response;
    } catch (error) {
      console.error('Update device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update device',
      };
    }
  }

  static async deleteDevice(deviceId) {
    try {
      const response = await ApiService.delete(`/devices/${deviceId}`);
      return response;
    } catch (error) {
      console.error('Delete device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete device',
      };
    }
  }

  static async connectDevice(deviceId) {
    try {
      const response = await ApiService.post(`/devices/${deviceId}/connect`);
      return response;
    } catch (error) {
      console.error('Connect device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect device',
      };
    }
  }

  static async disconnectDevice(deviceId) {
    try {
      const response = await ApiService.post(`/devices/${deviceId}/disconnect`);
      return response;
    } catch (error) {
      console.error('Disconnect device error:', error);
      return {
        success: false,
        message: error.message || 'Failed to disconnect device',
      };
    }
  }
}