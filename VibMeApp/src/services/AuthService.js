import ApiService from './ApiService';

export class AuthService {
  static async login(username, password) {
    try {
      const response = await ApiService.post('/auth/login', {
        username,
        password,
      });
      
      return response;
    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  static async register(username, email, password) {
    try {
      const response = await ApiService.post('/auth/register', {
        username,
        email,
        password,
      });
      
      return response;
    } catch (error) {
      console.error('Register service error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  static async logout(userId) {
    try {
      const response = await ApiService.post(`/auth/logout/${userId}`);
      return response;
    } catch (error) {
      console.error('Logout service error:', error);
      return {
        success: false,
        message: error.message || 'Logout failed',
      };
    }
  }

  static async getUser(userId) {
    try {
      const response = await ApiService.get(`/auth/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Get user service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get user',
      };
    }
  }
}