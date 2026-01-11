
export interface ErrorLog {
  timestamp: Date;
  error: string;
  details: string;
  type: 'connection' | 'api' | 'auth' | 'general' | 'updater' | 'performance' | 'ui';
  stack?: string;
  url?: string;
  method?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  component?: string;
  action?: string;
  duration?: number;
  memoryUsage?: number;
  networkStatus?: string;
}

export interface UpdaterLog {
  timestamp: Date;
  event: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
  version?: string;
  progress?: number;
  downloadSpeed?: number;
  fileSize?: number;
  checksum?: string;
  installPath?: string;
  rollbackAvailable?: boolean;
  serverResponse?: any;
}

export interface SystemInfo {
  timestamp: Date;
  appVersion: string;
  platform: string;
  userAgent: string;
  screenResolution: string;
  memoryUsage: number;
  onlineStatus: boolean;
  language: string;
  timezone: string;
  connectionType?: string;
}

export interface PerformanceMetrics {
  timestamp: Date;
  componentName: string;
  renderTime: number;
  memoryDelta: number;
  networkRequests: number;
  apiResponseTimes: { [endpoint: string]: number };
}

export class ErrorCapture {
  private static instance: ErrorCapture;
  private errors: ErrorLog[] = [];
  private maxErrors = 100;
  private listeners: ((errors: ErrorLog[]) => void)[] = [];

  static getInstance(): ErrorCapture {
    if (!ErrorCapture.instance) {
      ErrorCapture.instance = new ErrorCapture();
    }
    return ErrorCapture.instance;
  }

  addError(error: Partial<ErrorLog>) {
    const sessionId = this.getSessionId();
    const memoryUsage = this.getMemoryUsage();
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    
    const newError: ErrorLog = {
      timestamp: new Date(),
      error: error.error || 'Unknown error',
      details: error.details || '',
      type: error.type || 'general',
      severity: error.severity || 'medium',
      stack: error.stack,
      url: error.url,
      method: error.method,
      userAgent: navigator.userAgent,
      sessionId,
      userId: error.userId,
      component: error.component,
      action: error.action,
      duration: error.duration,
      memoryUsage,
      networkStatus
    };

    this.errors.unshift(newError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    this.notifyListeners();
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('debug-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('debug-session-id', sessionId);
    }
    return sessionId;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  subscribe(listener: (errors: ErrorLog[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getErrors()));
  }
}

export class UpdaterDebug {
  private static instance: UpdaterDebug;
  private logs: UpdaterLog[] = [];
  private maxLogs = 50;
  private listeners: ((logs: UpdaterLog[]) => void)[] = [];

  static getInstance(): UpdaterDebug {
    if (!UpdaterDebug.instance) {
      UpdaterDebug.instance = new UpdaterDebug();
    }
    return UpdaterDebug.instance;
  }

  addLog(log: Partial<UpdaterLog>) {
    const newLog: UpdaterLog = {
      timestamp: new Date(),
      event: log.event || 'Unknown event',
      details: log.details || '',
      type: log.type || 'info',
      version: log.version,
      progress: log.progress,
      downloadSpeed: log.downloadSpeed,
      fileSize: log.fileSize,
      checksum: log.checksum,
      installPath: log.installPath,
      rollbackAvailable: log.rollbackAvailable,
      serverResponse: log.serverResponse
    };

    this.logs.unshift(newLog);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notifyListeners();
  }

  getLogs(): UpdaterLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: UpdaterLog[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getLogs()));
  }
}

export class SystemInfoCollector {
  private static instance: SystemInfoCollector;
  private systemInfo: SystemInfo | null = null;

  static getInstance(): SystemInfoCollector {
    if (!SystemInfoCollector.instance) {
      SystemInfoCollector.instance = new SystemInfoCollector();
    }
    return SystemInfoCollector.instance;
  }

  async collectSystemInfo(): Promise<SystemInfo> {
    const appVersion = await this.getAppVersion();
    
    this.systemInfo = {
      timestamp: new Date(),
      appVersion,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      memoryUsage: this.getMemoryUsage(),
      onlineStatus: navigator.onLine,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connectionType: this.getConnectionType()
    };

    return this.systemInfo;
  }

  private async getAppVersion(): Promise<string> {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      return await getVersion();
    } catch {
      return 'Unknown';
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || connection.type : 'unknown';
  }

  getSystemInfo(): SystemInfo | null {
    return this.systemInfo;
  }
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 50;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  trackComponentRender(componentName: string, renderTime: number) {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      componentName,
      renderTime,
      memoryDelta: this.getMemoryUsage(),
      networkRequests: performance.getEntriesByType('navigation').length,
      apiResponseTimes: this.getApiResponseTimes()
    };

    this.metrics.unshift(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  private getApiResponseTimes(): { [endpoint: string]: number } {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const apiTimes: { [endpoint: string]: number } = {};
    
    entries.forEach(entry => {
      if (entry.name.includes('/api/')) {
        const url = new URL(entry.name);
        apiTimes[url.pathname] = entry.duration;
      }
    });

    return apiTimes;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Setup error interception focused only on current API - singleton pattern
let errorInterceptionSetup = false;
let originalConsoleError: typeof console.error;

export const setupErrorInterception = () => {
  if (errorInterceptionSetup) return;
  
  const errorCapture = ErrorCapture.getInstance();
  
  // Store original console.error
  originalConsoleError = console.error;
  
  // Intercept console.error for connection errors
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Erro de conexão com o servidor') || 
        message.includes('Network Error') ||
        message.includes('Connection failed') ||
        message.includes('Tauri HTTP')) {
      errorCapture.addError({
        error: 'Tauri API Connection Error',
        details: message,
        type: 'connection'
      });
    }
    originalConsoleError.apply(console, args);
  };
  
  errorInterceptionSetup = true;
};

export const cleanupErrorInterception = () => {
  if (!errorInterceptionSetup) return;
  
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
  
  errorInterceptionSetup = false;
};
