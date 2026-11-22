import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Service for managing console logging with environment-based control
 * Allows disabling logs in production while maintaining them in development
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  /**
   * Regular log message - equivalent to console.log
   */
  log(...args: any[]) {
    if (!environment.production || environment.enableLogs) {
      console.log(...args);
    }
  }
  
  /**
   * Error log message - equivalent to console.error
   * These are often kept even in production for critical errors
   */
  error(...args: any[]) {
    // Always log errors, even in production
    console.error(...args);
  }
  
  /**
   * Warning log message - equivalent to console.warn
   */
  warn(...args: any[]) {
    if (!environment.production || environment.enableLogs) {
      console.warn(...args);
    }
  }
  
  /**
   * Info log message - equivalent to console.info
   */
  info(...args: any[]) {
    if (!environment.production || environment.enableLogs) {
      console.info(...args);
    }
  }

  /**
   * Debug log message - never shown in production
   * For detailed debugging information
   */
  debug(...args: any[]) {
    if (!environment.production) {
      console.debug(...args);
    }
  }

  /**
   * Network log message - specific to network operations
   * Can be controlled separately from other logs
   */
  network(...args: any[]) {
    if (!environment.production || environment.enableNetworkLogs) {
      console.log('[Network]', ...args);
    }
  }
}