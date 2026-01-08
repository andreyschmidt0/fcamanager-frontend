import { fetch } from '@tauri-apps/plugin-http';

// Test service using Tauri's native HTTP client

class TauriHttpService {

  private get apiURL() {
    return import.meta.env.VITE_API_URL || 'https://fca-backend.fly.dev/api';
  }

  async testConnection(): Promise<{success: boolean, details: string}> {
    const url = this.apiURL;
    if (!url && import.meta.env.DEV) {
      console.warn('VITE_API_URL não definida no .env');
    }

    try {
      const response = await fetch(`${url.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        connectTimeout: 10000,
      });
      const text = await response.text();

      

      return {

        success: response.ok,

        details: `URL: ${url} - Status: ${response.status}, Response: ${text}`

      };

    } catch (error) {

      return {

        success: false,

        details: `Falha na conexão com ${url}: ${error}`

      };

    }

  }

}

export default new TauriHttpService();