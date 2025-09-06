import React, { useState, useEffect, useRef } from 'react';
import tauriHttpService from '../../services/tauri-http.service';
import apiService from '../../services/api-tauri.service';

interface ErrorLog {
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

interface UpdaterLog {
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

interface SystemInfo {
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

interface PerformanceMetrics {
  timestamp: Date;
  componentName: string;
  renderTime: number;
  memoryDelta: number;
  networkRequests: number;
  apiResponseTimes: { [endpoint: string]: number };
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

class ErrorCapture {
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

class UpdaterDebug {
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

class SystemInfoCollector {
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

class PerformanceTracker {
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

const setupErrorInterception = () => {
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

const cleanupErrorInterception = () => {
  if (!errorInterceptionSetup) return;
  
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
  
  errorInterceptionSetup = false;
};

const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'updater' | 'system' | 'performance'>('errors');
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [updaterLogs, setUpdaterLogs] = useState<UpdaterLog[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [testResults, setTestResults] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const errorCapture = ErrorCapture.getInstance();
  const updaterDebug = UpdaterDebug.getInstance();
  const systemInfoCollector = SystemInfoCollector.getInstance();
  const performanceTracker = PerformanceTracker.getInstance();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupErrorInterception();
    const unsubscribeErrors = errorCapture.subscribe(setErrors);
    const unsubscribeUpdater = updaterDebug.subscribe(setUpdaterLogs);
    
    setErrors(errorCapture.getErrors());
    setUpdaterLogs(updaterDebug.getLogs());
    setPerformanceMetrics(performanceTracker.getMetrics());

    // Collect system information
    systemInfoCollector.collectSystemInfo().then(setSystemInfo);

    // Buscar versão do app
    import('@tauri-apps/api/app').then(({ getVersion }) => {
      getVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'));
    }).catch(() => setAppVersion('N/A'));

    // Track performance metrics every 5 seconds
    const performanceInterval = setInterval(() => {
      setPerformanceMetrics(performanceTracker.getMetrics());
    }, 5000);

    return () => {
      unsubscribeErrors();
      unsubscribeUpdater();
      clearInterval(performanceInterval);
      // Note: We don't cleanup error interception here as it's global
      // and may be used by other components
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const filteredErrors = errors.filter(error => {
    const typeMatch = filter === 'all' || error.type === filter;
    const severityMatch = severityFilter === 'all' || error.severity === severityFilter;
    return typeMatch && severityMatch;
  });

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'connection': return 'text-red-400';
      case 'api': return 'text-orange-400';
      case 'auth': return 'text-yellow-400';
      case 'performance': return 'text-purple-400';
      case 'ui': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const exportErrors = () => {
    const data = JSON.stringify(errors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-errors-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const runConnectionTests = async () => {
    setTesting(true);
    setTestResults('Running Tauri API connection tests...\n\n');
    
    // Test 1: Current API Service Test
    setTestResults(prev => prev + '=== TAURI API SERVICE TEST ===\n');
    try {
      const apiResult = await apiService.testConnection();
      setTestResults(prev => prev + `API Service Result: ${apiResult ? 'SUCCESS' : 'FAILED'}\n\n`);
    } catch (error) {
      setTestResults(prev => prev + `API Service Error: ${error}\n\n`);
    }

    // Test 2: Direct Tauri HTTP Test  
    setTestResults(prev => prev + '=== DIRECT TAURI HTTP TEST ===\n');
    try {
      const tauriResult = await tauriHttpService.testConnection();
      setTestResults(prev => prev + `Tauri HTTP Result: ${tauriResult.success ? 'SUCCESS' : 'FAILED'}\n`);
      setTestResults(prev => prev + `Details: ${tauriResult.details}\n\n`);
    } catch (error) {
      setTestResults(prev => prev + `Tauri HTTP Error: ${error}\n\n`);
    }

    setTestResults(prev => prev + '=== TESTS COMPLETED ===\n');
    setTesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-gray-900 border border-gray-700 rounded-lg w-5/6 h-5/6 flex flex-col text-white font-mono text-sm"
      >
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Debug Console</h2>
              {appVersion && (
                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                  v{appVersion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="connection">Connection</option>
                <option value="api">API</option>
                <option value="auth">Auth</option>
                <option value="performance">Performance</option>
                <option value="ui">UI</option>
                <option value="general">General</option>
              </select>
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            <button 
              onClick={runConnectionTests}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              {testing ? 'Testing...' : 'Test Connections'}
            </button>
            <button 
              onClick={exportErrors}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Export
            </button>
            <button 
              onClick={() => errorCapture.clearErrors()}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Clear
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
            >
              
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1 text-sm rounded-t ${
                activeTab === 'errors' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Errors ({errors.length})
            </button>
            <button
              onClick={() => setActiveTab('updater')}
              className={`px-3 py-1 text-sm rounded-t ${
                activeTab === 'updater' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Updater ({updaterLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1 text-sm rounded-t ${
                activeTab === 'system' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              System Info
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1 text-sm rounded-t ${
                activeTab === 'performance' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Performance ({performanceMetrics.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Test Results Section - sempre visível */}
          {testResults && (
            <div className="mb-6 bg-gray-800 border border-gray-700 rounded p-4">
              <h3 className="text-green-400 font-semibold mb-2">Connection Test Results:</h3>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-gray-900 p-3 rounded overflow-x-auto">
                {testResults}
              </pre>
              <button 
                onClick={() => copyToClipboard(testResults)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-xs"
              >
                Copy Test Results
              </button>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <>
              {filteredErrors.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No Tauri API errors captured yet.</p>
              <p className="text-sm mt-2">Tauri HTTP connection errors and API failures will appear here.</p>
              <p className="text-sm mt-2">Use the "Test Connections" button to diagnose Tauri API issues.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((error, index) => (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getErrorTypeColor(error.type)}`}>
                        [{error.type.toUpperCase()}]
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className="text-gray-300">{error.error}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">
                        {error.timestamp.toLocaleString()}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-xs mb-2">
                    <p>{error.details}</p>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      {error.url && (
                        <div>
                          <span className="text-gray-500">URL:</span> {error.method} {error.url}
                        </div>
                      )}
                      {error.component && (
                        <div>
                          <span className="text-gray-500">Component:</span> {error.component}
                        </div>
                      )}
                      {error.action && (
                        <div>
                          <span className="text-gray-500">Action:</span> {error.action}
                        </div>
                      )}
                      {error.duration && (
                        <div>
                          <span className="text-gray-500">Duration:</span> {error.duration}ms
                        </div>
                      )}
                      {error.memoryUsage && error.memoryUsage > 0 && (
                        <div>
                          <span className="text-gray-500">Memory:</span> {error.memoryUsage.toFixed(1)}MB
                        </div>
                      )}
                      {error.networkStatus && (
                        <div>
                          <span className="text-gray-500">Network:</span> {error.networkStatus}
                        </div>
                      )}
                      {error.sessionId && (
                        <div>
                          <span className="text-gray-500">Session:</span> {error.sessionId.slice(-8)}
                        </div>
                      )}
                      {error.userId && (
                        <div>
                          <span className="text-gray-500">User:</span> {error.userId}
                        </div>
                      )}
                    </div>
                  </div>

                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-400 text-xs">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-900 p-2 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {/* Updater Tab */}
          {activeTab === 'updater' && (
            <>
              {updaterLogs.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No updater events captured yet.</p>
                  <p className="text-sm mt-2">Update checks, downloads, and installation events will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updaterLogs.map((log, index) => (
                    <div key={index} className="bg-gray-800 border border-gray-700 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}>
                            [{log.type.toUpperCase()}]
                          </span>
                          <span className="text-gray-300">{log.event}</span>
                          {log.version && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                              v{log.version}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-gray-400 text-xs mb-2">
                        <p>{log.details}</p>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          {log.downloadSpeed && (
                            <div>
                              <span className="text-gray-500">Speed:</span> {(log.downloadSpeed / 1024).toFixed(1)} KB/s
                            </div>
                          )}
                          {log.fileSize && (
                            <div>
                              <span className="text-gray-500">Size:</span> {(log.fileSize / 1024 / 1024).toFixed(1)} MB
                            </div>
                          )}
                          {log.checksum && (
                            <div>
                              <span className="text-gray-500">Checksum:</span> {log.checksum.slice(0, 8)}...
                            </div>
                          )}
                          {log.installPath && (
                            <div>
                              <span className="text-gray-500">Path:</span> {log.installPath}
                            </div>
                          )}
                          {log.rollbackAvailable !== undefined && (
                            <div>
                              <span className="text-gray-500">Rollback:</span> {log.rollbackAvailable ? 'Available' : 'Not available'}
                            </div>
                          )}
                        </div>

                        {log.progress !== undefined && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="text-gray-300">{log.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${log.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {log.serverResponse && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-400 text-xs">
                              Server Response
                            </summary>
                            <pre className="mt-2 text-xs text-gray-600 bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.serverResponse, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {systemInfo ? (
                <>
                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-green-400 font-semibold mb-3">System Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-500">App Version:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.appVersion}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Platform:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.platform}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Screen Resolution:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.screenResolution}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Language:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.language}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Timezone:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.timezone}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-500">Memory Usage:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.memoryUsage.toFixed(1)} MB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Online Status:</span>
                          <span className={`ml-2 ${systemInfo.onlineStatus ? 'text-green-400' : 'text-red-400'}`}>
                            {systemInfo.onlineStatus ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Connection Type:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.connectionType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="text-gray-300 ml-2">{systemInfo.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-blue-400 font-semibold mb-3">User Agent</h3>
                    <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto break-all">
                      {systemInfo.userAgent}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => systemInfoCollector.collectSystemInfo().then(setSystemInfo)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                    >
                      Refresh System Info
                    </button>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(systemInfo, null, 2))}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm"
                    >
                      Copy System Info
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <p>Loading system information...</p>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {performanceMetrics.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No performance metrics available yet.</p>
                  <p className="text-sm mt-2">Component render times and API response metrics will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-purple-400 font-semibold mb-3">Performance Overview</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {performanceMetrics.length > 0 ? performanceMetrics[0].memoryDelta.toFixed(1) : '0'}MB
                        </div>
                        <div className="text-gray-500">Current Memory</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {performanceMetrics.reduce((avg, metric) => avg + metric.renderTime, 0) / performanceMetrics.length || 0}ms
                        </div>
                        <div className="text-gray-500">Avg Render Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {performanceMetrics.reduce((total, metric) => total + Object.keys(metric.apiResponseTimes).length, 0)}
                        </div>
                        <div className="text-gray-500">API Calls</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {performanceMetrics.map((metric, index) => (
                      <div key={index} className="bg-gray-800 border border-gray-700 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-purple-400">
                              {metric.componentName}
                            </span>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                              {metric.renderTime.toFixed(2)}ms
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {metric.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="text-gray-400 text-xs mb-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="text-gray-500">Memory:</span> {metric.memoryDelta.toFixed(1)}MB
                            </div>
                            <div>
                              <span className="text-gray-500">Network Requests:</span> {metric.networkRequests}
                            </div>
                            <div>
                              <span className="text-gray-500">API Responses:</span> {Object.keys(metric.apiResponseTimes).length}
                            </div>
                          </div>
                          
                          {Object.keys(metric.apiResponseTimes).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-gray-500 hover:text-gray-400 text-xs">
                                API Response Times
                              </summary>
                              <div className="mt-2 space-y-1">
                                {Object.entries(metric.apiResponseTimes).map(([endpoint, time]) => (
                                  <div key={endpoint} className="flex justify-between">
                                    <span className="text-gray-600">{endpoint}</span>
                                    <span className="text-gray-400">{time.toFixed(2)}ms</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => performanceTracker.clearMetrics()}
                      className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                    >
                      Clear Metrics
                    </button>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(performanceMetrics, null, 2))}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm"
                    >
                      Copy Metrics
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
          Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+D</kbd> to toggle " <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
    </div>
  );
};

export { ErrorCapture, UpdaterDebug, SystemInfoCollector, PerformanceTracker };
export default DebugModal;