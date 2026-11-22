import { Injectable } from '@angular/core';
import { NetworkService } from '../../services/network.service';
import { LoggerService } from '../../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService {
  private _lastConnectivityResult: boolean = false;
  private _lastConnectivityCheck: number = 0;
  private _connectivityCacheDuration: number = 30000; // 30 seconds
  private _isActivelyTesting: boolean = false;
  private _networkStateChangeDebounceTime = 3000; // 3 seconds
  private _networkDebounceTimer: any = null;
  private _lastReportedNetworkState: boolean | null = null;

  constructor(
    private networkService: NetworkService,
    private logger: LoggerService
  ) {}

  get lastConnectivityResult() { return this._lastConnectivityResult; }
  get lastConnectivityCheck() { return this._lastConnectivityCheck; }
  get connectivityCacheDuration() { return this._connectivityCacheDuration; }
  get isActivelyTesting() { return this._isActivelyTesting; }
  get networkStateChangeDebounceTime() { return this._networkStateChangeDebounceTime; }
  get connectionType() { return this.networkService.connectionType; }

  /**
   * Performs a network check with various options.
   * @param options Configuration for the network check.
   * @returns Promise resolving to the connectivity result.
   */
  async checkNetwork(
    options: {
      source?: string;
      priority?: boolean;
      loadAudio?: boolean;
      showLoader?: boolean;
      timeout?: number;
    } = {}
  ): Promise<boolean> {
    const {
      source = 'general',
      priority = false,
      loadAudio = false,
      showLoader = false,
      timeout = 10000,
    } = options;

    this.logger.network(`Network check (${source}${priority ? ', priority' : ''})`);

    const now = Date.now();
    if (!priority && now - this._lastConnectivityCheck < this._connectivityCacheDuration) {
      this.logger.network(`Using cached connectivity result (${now - this._lastConnectivityCheck}ms old): ${this._lastConnectivityResult}`);
      return Promise.resolve(this._lastConnectivityResult);
    }

    if (this._isActivelyTesting && !priority) {
      this.logger.network(`Network check already in progress (${source}) - using cached state`);
      return Promise.resolve(this.networkService.isConnected);
    }

    if (this._skipNetworkCheck) { // This will be handled by the component or passed as a flag
      this.logger.network(`Network check skipped per configuration (${source})`);
      return Promise.resolve(true);
    }

    if (showLoader) {
      this.logger.network('Showing loader for network check');
      // Note: Loader management is handled by the component calling this service
    }

    this._isActivelyTesting = true;

    if (!this.networkService.isConnected) {
      this.logger.network(`Device reports disconnected (${source})`);
      this._lastConnectivityCheck = now;
      this._lastConnectivityResult = false;
      this._isActivelyTesting = false;
      return Promise.resolve(false);
    }

    let timeoutId: any = null;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => {
        if (this._isActivelyTesting) {
          this.logger.network(`Network check timed out (${source})`);
          this._lastConnectivityCheck = Date.now();
          this._lastConnectivityResult = false;
          resolve(false);
        }
      }, timeout);
    });

    const checkPromise = this.networkService.forceConnectivityCheck()
      .then((isConnected) => {
        this.logger.network(`Network check result (${source}): ${isConnected}`);
        this._lastConnectivityCheck = Date.now();
        this._lastConnectivityResult = isConnected;
        return isConnected;
      })
      .catch((error) => {
        this.logger.error(`Network check error (${source}):`, error);
        this._lastConnectivityCheck = Date.now();
        this._lastConnectivityResult = false;
        return false;
      });

    return Promise.race([checkPromise, timeoutPromise]).then((isConnected) => {
      if (timeoutId) clearTimeout(timeoutId);
      this._isActivelyTesting = false;
      this._lastConnectivityResult = isConnected;
      return isConnected;
    });
  }

  /**
   * Establishes a subscription to the network service and handles state changes with debouncing.
   * @param onStableChange Callback function executed when the network state stabilizes.
   */
  subscribeToNetwork(onStableChange: (isConnected: boolean) => void) {
    this.networkService.actualConnectivity$.subscribe((hasConnectivity) => {
      this.logger.network('Raw network state change detected:', hasConnectivity);

      if (this._networkDebounceTimer) {
        clearTimeout(this._networkDebounceTimer);
      }

      this._networkDebounceTimer = setTimeout(() => {
        if (this._lastReportedNetworkState !== hasConnectivity) {
          this.logger.network('Stable network change detected to:', hasConnectivity);
          this._lastReportedNetworkState = hasConnectivity;

          onStableChange(hasConnectivity);
        }
      }, this._networkStateChangeDebounceTime);
    });
  }

  private _skipNetworkCheck = false;
  public setSkipNetworkCheck(value: boolean) {
    this._skipNetworkCheck = value;
  }
}
