// src/lib/apiClient.ts

export class AuthManager {
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  }

  static setDeviceId(deviceId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('deviceId', deviceId);
    }
  }

  static getDeviceId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deviceId');
    }
    return null;
  }

  static clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('deviceId');
      // Clear cookie for middleware too
      document.cookie = 'x-device-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    }
  }

  static getHeaders(includeDeviceId = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (includeDeviceId) {
      const deviceId = this.getDeviceId();
      if (deviceId) {
        headers['x-device-id'] = deviceId;
      }
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}

export class APIClient {
  static getAuthHeaders(): Record<string, string> {
    const token = AuthManager.getToken();
    const deviceId = AuthManager.getDeviceId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }

    return headers;
  }

  static async request(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getAuthHeaders();

    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> || {})
      },
      credentials: 'include'
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
      AuthManager.clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/az/admin/login';
      }
    }

    return response;
  }

  static async get(url: string): Promise<Response> {
    return this.request(url, { method: 'GET' });
  }

  static async post(url: string, body: any): Promise<Response> {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static async patch(url: string, body: any): Promise<Response> {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static async delete(url: string): Promise<Response> {
    return this.request(url, { method: 'DELETE' });
  }
}
