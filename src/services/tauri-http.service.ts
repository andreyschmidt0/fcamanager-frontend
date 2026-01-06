import { fetch } from '@tauri-apps/plugin-http';

// Test service using Tauri's native HTTP client
class TauriHttpService {
  private primaryURL = 'https://fcaranked.fly.dev/api';
  private fallbackURL = 'http://localhost:3000/api';

  async testConnection(): Promise<{success: boolean, details: string}> {
    // Try primary URL first
    try {
      
      const response = await fetch(`${this.primaryURL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        connectTimeout: 10000,
      });

      const text = await response.text();
      
      return {
        success: response.ok,
        details: `Primary URL - Status: ${response.status}, Response: ${text}`
      };
    } catch (primaryError) {
      
      // Try fallback URL
      try {
        const response = await fetch(`${this.fallbackURL.replace('/api', '')}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          connectTimeout: 10000,
        });

        const text = await response.text();
        
        return {
          success: response.ok,
          details: `Fallback URL - Status: ${response.status}, Response: ${text}`
        };
      } catch (fallbackError) {
        return {
          success: false,
          details: `Both URLs failed. Primary: ${primaryError}, Fallback: ${fallbackError}`
        };
      }
    }
  }

}

export default new TauriHttpService();