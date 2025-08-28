import { fetch } from '@tauri-apps/plugin-http';

// Test service using Tauri's native HTTP client
class TauriHttpService {
  private baseURL = 'https://fcamanager-backend.onrender.com/api';

  async testConnection(): Promise<{success: boolean, details: string}> {
    try {
      console.log('Testing connection with Tauri HTTP...');
      
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        connectTimeout: 30000,
      });

      const text = await response.text();
      
      return {
        success: response.ok,
        details: `Status: ${response.status}, Response: ${text}`
      };
    } catch (error) {
      return {
        success: false,
        details: `Tauri HTTP Error: ${error}`
      };
    }
  }

}

export default new TauriHttpService();