import { Platform, NativeModules } from 'react-native';

/**
 * Attempt to extract the Metro bundler host from the bundle URL.
 * e.g., 'http://10.10.187.171:8081/index.bundle' -> '10.10.187.171'
 *       'http://localhost:8081/index.bundle'    -> 'localhost'
 */
export const getDevServerHost = (): string | null => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {
    // Ignore in production or unsupported environments
  }
  return null;
};

/**
 * Return candidate API base URLs ordered by likelihood.
 * 1. Metro bundler host (dynamically matching how the app reached Metro)
 * 2. Localhost / 127.0.0.1 (works with USB debugging via 'adb reverse tcp:5000 tcp:5000')
 * 3. Machine Wi-Fi LAN IP (works over same Wi-Fi network)
 * 4. 10.0.2.2 (works in standard Android Emulator)
 */
export const getCandidateApiUrls = (): string[] => {
  const candidates: string[] = [];
  const devHost = getDevServerHost();

  if (devHost) {
    candidates.push(`http://${devHost}:5000/api`);
  }

  // USB reverse / localhost
  candidates.push('http://localhost:5000/api');
  candidates.push('http://127.0.0.1:5000/api');

  // Development computer LAN IP
  candidates.push('http://10.10.187.171:5000/api');

  // Android emulator loopback alias
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:5000/api');
  }

  // Deduplicate
  return Array.from(new Set(candidates));
};

const getInitialBaseUrl = (): string => {
  const devHost = getDevServerHost();
  if (devHost) {
    return `http://${devHost}:5000/api`;
  }

  if (Platform.OS === 'android') {
    // Default to localhost so 'adb reverse tcp:5000 tcp:5000' works out of the box
    return 'http://localhost:5000/api';
  }

  return 'http://localhost:5000/api';
};

class ApiClient {
  private baseUrl: string = getInitialBaseUrl();
  private token: string | null = null;
  private isCustomUrlSet: boolean = false;
  private detectionPromise: Promise<string | null> | null = null;

  constructor() {
    // Proactively probe candidate hosts in the background on startup
    this.autoDetectWorkingHost();
  }

  public setBaseUrl(url: string, isManual = true) {
    this.baseUrl = url.replace(/\/+$/, '');
    if (isManual) {
      this.isCustomUrlSet = true;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  /**
   * Quick health check on a given endpoint
   */
  public async checkHealth(
    targetUrl: string = this.baseUrl,
    timeoutMs = 2500
  ): Promise<{ ok: boolean; latency?: number; message?: string }> {
    const start = Date.now();
    const cleanUrl = targetUrl.replace(/\/+$/, '');
    const healthUrl = `${cleanUrl}/health`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latency = Date.now() - start;

      if (res.ok) {
        return { ok: true, latency };
      }
      return { ok: false, message: `Server HTTP error ${res.status}` };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { ok: false, message: `Timed out after ${timeoutMs}ms` };
      }
      return { ok: false, message: err.message || 'Connection failed' };
    }
  }

  /**
   * Probe all candidate URLs in parallel and use the first one that responds
   */
  public async autoDetectWorkingHost(): Promise<string | null> {
    if (this.isCustomUrlSet) {
      return this.baseUrl;
    }

    if (this.detectionPromise) {
      return this.detectionPromise;
    }

    const candidates = getCandidateApiUrls();
    this.detectionPromise = (async () => {
      // Test candidates in parallel
      const probes = candidates.map(async (candidate) => {
        const result = await this.checkHealth(candidate, 2500);
        if (result.ok) {
          return candidate;
        }
        throw new Error('Unreachable');
      });

      try {
        const workingUrl = await Promise.any(probes);
        if (!this.isCustomUrlSet) {
          this.baseUrl = workingUrl;
        }
        return workingUrl;
      } catch {
        return null;
      } finally {
        this.detectionPromise = null;
      }
    })();

    return this.detectionPromise;
  }

  public async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? 9000;
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: controller.signal,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error: ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Handle request timeout
      if (err.name === 'AbortError') {
        // Attempt quick background re-detection if default URL was unreachable
        this.autoDetectWorkingHost();
        throw new Error(
          `Request timed out after ${Math.round(timeoutMs / 1000)}s connecting to ${this.baseUrl}. ` +
          `Please check that the backend is running and 'adb reverse tcp:5000 tcp:5000' is executed.`
        );
      }

      // Handle unreachable network
      if (err.message && err.message.includes('Network request failed')) {
        this.autoDetectWorkingHost();
        throw new Error(
          `Unable to reach backend server at ${this.baseUrl}.\n\n` +
          `• For USB Debugging: Run 'adb reverse tcp:5000 tcp:5000' in terminal\n` +
          `• For Wi-Fi: Connect PC & phone to same Wi-Fi (URL: http://10.10.187.171:5000/api)\n` +
          `• For Emulator: Use http://10.0.2.2:5000/api`
        );
      }

      throw err;
    }
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  public put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
