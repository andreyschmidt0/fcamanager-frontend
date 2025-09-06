import React, { useState, useEffect, useRef } from 'react';
import tauriHttpService from '../../services/tauri-http.service';
import apiService from '../../services/api-tauri.service';

interface ErrorLog {
  timestamp: Date;
  error: string;
  details: string;
  type: 'connection' | 'api' | 'auth' | 'general' | 'updater';
  stack?: string;
  url?: string;
  method?: string;
}

interface UpdaterLog {
  timestamp: Date;
  event: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
  version?: string;
  progress?: number;
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
    const newError: ErrorLog = {
      timestamp: new Date(),
      error: error.error || 'Unknown error',
      details: error.details || '',
      type: error.type || 'general',
      stack: error.stack,
      url: error.url,
      method: error.method
    };

    this.errors.unshift(newError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    this.notifyListeners();
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
      progress: log.progress
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
  const [activeTab, setActiveTab] = useState<'errors' | 'updater'>('errors');
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [updaterLogs, setUpdaterLogs] = useState<UpdaterLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [testResults, setTestResults] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const errorCapture = ErrorCapture.getInstance();
  const updaterDebug = UpdaterDebug.getInstance();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupErrorInterception();
    const unsubscribeErrors = errorCapture.subscribe(setErrors);
    const unsubscribeUpdater = updaterDebug.subscribe(setUpdaterLogs);
    
    setErrors(errorCapture.getErrors());
    setUpdaterLogs(updaterDebug.getLogs());

    // Buscar versão do app
    import('@tauri-apps/api/app').then(({ getVersion }) => {
      getVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'));
    }).catch(() => setAppVersion('N/A'));

    return () => {
      unsubscribeErrors();
      unsubscribeUpdater();
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
    if (filter === 'all') return true;
    return error.type === filter;
  });

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'connection': return 'text-red-400';
      case 'api': return 'text-orange-400';
      case 'auth': return 'text-yellow-400';
      default: return 'text-gray-400';
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
              <option value="all">All Errors</option>
              <option value="connection">Connection</option>
              <option value="api">API</option>
              <option value="auth">Auth</option>
              <option value="general">General</option>
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
                      <span className="text-gray-300">{error.error}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">
                        {error.timestamp.toLocaleTimeString()}
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
                    {error.url && (
                      <p className="mt-1">
                        <span className="text-gray-500">URL:</span> {error.method} {error.url}
                      </p>
                    )}
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
                        {log.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${log.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 mt-1">{log.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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

export { ErrorCapture, UpdaterDebug };
export default DebugModal;