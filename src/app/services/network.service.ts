import { Injectable, OnDestroy } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
    providedIn: 'root'
})
export class NetworkService {
    private _connected = new BehaviorSubject<boolean>(true);
    private _connectionType = new BehaviorSubject<string>('unknown');
    private _actualConnectivity = new BehaviorSubject<boolean>(true);
    private _connectionQuality = new BehaviorSubject<string>('unknown');
    private _is5G = new BehaviorSubject<boolean>(false);
    private _isWiFi6 = new BehaviorSubject<boolean>(false);

    public connected$: Observable<boolean> = this._connected.asObservable();
    public disconnected$: Observable<boolean> = this._connected.asObservable().pipe(
        map(connected => !connected)
    );
    public connectionType$: Observable<string> = this._connectionType.asObservable();
    public actualConnectivity$: Observable<boolean> = this._actualConnectivity.asObservable();
    public connectionQuality$: Observable<string> = this._connectionQuality.asObservable();
    public is5G$: Observable<boolean> = this._is5G.asObservable();
    public isWiFi6$: Observable<boolean> = this._isWiFi6.asObservable();

    // Track if we've already performed a deep connectivity check
    private hasVerifiedConnection = false;
    private connectivityCheckUrl = 'https://www.google.com/generate_204';

    // Flag to track if we're currently performing a check
    private isCheckingConnectivity = false;
    // Track last verification time to avoid excessive checks
    private lastVerificationTime = 0;
    // Whether to immediately initialize with connectivity check (default false)
    private immediateCheck = false;
    // Track setTimeout IDs for cleanup
    private readonly timeoutIds: Set<number> = new Set();
    // Store Capacitor listener refs for cleanup
    private networkStatusListenerRef: any = null;

    constructor(private readonly logger: LoggerService) {
        // Initialize with basic check, detailed check will come after UI shows
        this.initialize();
    }

    private async initialize() {
        try {
            this.logger.network('Initializing');

            // Start with optimistic assumption to allow app to load
            // We'll verify and update this later
            this._connected.next(true);
            this._actualConnectivity.next(true);

            // Get initial network status without blocking UI
            this.getNetworkStatus().then(status => {
                this.logger.network('Initial status -',
                    'Connected:', status.connected,
                    'Type:', status.connectionType);

                // Update connection status but don't affect UI yet
                this._connected.next(status.connected);
                this._connectionType.next(status.connectionType);

                // Check if this might be 5G/WiFi6
                this.checkSpecialNetworkTypes(status.connectionType);

                // Verify connectivity shortly after startup without blocking the UI
                const initTimeoutId = setTimeout(() => {
                    if (status.connected) {
                        this.verifyConnectivity(true);
                    } else {
                        this._actualConnectivity.next(false);
                        this._connectionQuality.next('none');
                    }
                }, 2000); // Wait 2 seconds for UI to appear
                this.timeoutIds.add(initTimeoutId);
            });

            const ref = await Network.addListener('networkStatusChange', (status: any) => {
                this.logger.network('Status changed -',
                    'Connected:', status.connected,
                    'Type:', status.connectionType);

                this._connected.next(status.connected);
                this._connectionType.next(status.connectionType);

                // Check if this might be 5G/WiFi6
                this.checkSpecialNetworkTypes(status.connectionType);

                // When network state changes, verify actual connectivity
                if (status.connected) {
                    // Don't block UI on network change - verify in background
                    const changeTimeoutId = setTimeout(() => this.verifyConnectivity(), 500);
                    this.timeoutIds.add(changeTimeoutId);
                } else {
                    this._actualConnectivity.next(false);
                    this._connectionQuality.next('none');
                }
            });
            this.networkStatusListenerRef = ref;
        } catch (error) {
            this.logger.error('Initialization error:', error);
            // If initialization fails, assume we're online to allow app to function
            // The verification will update status when it completes
            this._actualConnectivity.next(true);
            this._connected.next(true);
        }
    }

    /**
     * Check for 5G, WiFi 6, and other modern network types
     */
    private checkSpecialNetworkTypes(connectionType: string): void {
        const connectionTypeLower = connectionType.toLowerCase();

        // Check for 5G
        const potential5GStrings = ['5g', 'cellular+5g', '5g nsa', '5g sa'];
        const is5G = potential5GStrings.some(type =>
            connectionTypeLower.includes(type)
        );
        this._is5G.next(is5G);

        // Check for WiFi 6 (802.11ax)
        const potentialWiFi6Strings = ['wifi6', 'wifi 6', '802.11ax', 'ax'];
        const isWiFi6 = potentialWiFi6Strings.some(type =>
            connectionTypeLower.includes(type)
        );
        this._isWiFi6.next(isWiFi6);

        // Log detection results for debugging
        if (is5G || isWiFi6) {
            this.logger.network('Special network detected -',
                is5G ? '5G' : '',
                isWiFi6 ? 'WiFi 6' : '');
        }
    }

    /**
     * Returns the current network connection status synchronously
     */
    get isConnected(): boolean {
        return this._connected.getValue();
    }

    /**
     * Returns whether we have actual internet connectivity
     */
    get hasInternetConnectivity(): boolean {
        return this._actualConnectivity.getValue();
    }

    /**
     * Returns the current network connection type synchronously (wifi, cellular, none, etc.)
     */
    get connectionType(): string {
        return this._connectionType.getValue();
    }

    /**
     * Returns the estimated connection quality
     */
    get connectionQuality(): string {
        return this._connectionQuality.getValue();
    }

    /**
     * Returns whether the connection might be 5G
     */
    get is5G(): boolean {
        return this._is5G.getValue();
    }

    /**
     * Returns whether the connection might be WiFi 6
     */
    get isWiFi6(): boolean {
        return this._isWiFi6.getValue();
    }

    /**
     * Gets the current detailed network status asynchronously
     * @returns Promise with network status object containing connected state and connection type
     */
    async getNetworkStatus(): Promise<{ connected: boolean, connectionType: string }> {
        try {
            return await Network.getStatus();
        } catch (error) {
            this.logger.error('Error getting network status:', error);
            return { connected: true, connectionType: 'unknown' }; // Default to connected to allow app to load
        }
    }

    /**
     * Force a connectivity check regardless of recent checks
     */
    public async forceConnectivityCheck(): Promise<boolean> {
        return this.verifyConnectivity(true);
    }

    /**
     * Verifies if there is actual internet connectivity, not just network connection
     * @param forceCheck If true, bypasses throttling and does immediate check
     * @returns Promise resolving to true if internet is working
     */
    async verifyConnectivity(forceCheck = false): Promise<boolean> {
        // Avoid multiple simultaneous checks
        if (this.isCheckingConnectivity && !forceCheck) {
            this.logger.network('Connectivity check already in progress');
            return this._actualConnectivity.getValue();
        }

        // Throttle checks unless forced
        const now = Date.now();
        if (!forceCheck && now - this.lastVerificationTime < 5000) {
            this.logger.network('Skipping connectivity check - too recent');
            return this._actualConnectivity.getValue();
        }

        // Even if Network plugin says disconnected, still verify
        // This helps with 5G/WiFi6 issues where device may be confused
        // But set a flag for later use
        const deviceReportsConnected = this._connected.getValue();

        this.isCheckingConnectivity = true;
        this.lastVerificationTime = now;
        this.logger.network('Verifying connectivity...');

        return new Promise<boolean>((resolve) => {
            let successfulPing = false;
            let completedRequests = 0;

            const controller = new AbortController();
            const requestTimeoutId = setTimeout(() => controller.abort(), 2500);
            const startTime = Date.now();

            fetch(this.connectivityCheckUrl, {
                method: 'GET',
                cache: 'no-store',
                mode: 'no-cors',
                signal: controller.signal,
                credentials: 'omit'
            })
                .then(() => {
                    clearTimeout(requestTimeoutId);

                    const responseTime = Date.now() - startTime;
                    this.logger.network(`Connectivity probe succeeded in ${responseTime}ms`);
                    this.estimateConnectionQuality(responseTime);

                    this._actualConnectivity.next(true);
                    this.hasVerifiedConnection = true;
                    this.isCheckingConnectivity = false;
                    resolve(true);
                })
                .catch(error => {
                    clearTimeout(requestTimeoutId);
                    this.logger.network(`Connectivity probe failed: ${error.name || error}`);
                    this._actualConnectivity.next(false);
                    this.updateConnectionQuality('poor');
                    this.isCheckingConnectivity = false;
                    resolve(false);
                });
        });
    }

    /**
     * Estimate connection quality based on response time and connection type
     */
    private estimateConnectionQuality(responseTime: number) {
        const connectionType = this._connectionType.getValue();
        let quality = 'unknown';

        if (connectionType === 'wifi') {
            if (this.isWiFi6) {
                // WiFi 6 should be very fast
                if (responseTime < 50) quality = 'excellent';
                else if (responseTime < 150) quality = 'good';
                else if (responseTime < 500) quality = 'fair';
                else quality = 'poor';
            } else {
                // Standard WiFi
                if (responseTime < 150) quality = 'excellent';
                else if (responseTime < 500) quality = 'good';
                else if (responseTime < 1000) quality = 'fair';
                else quality = 'poor';
            }
        } else if (connectionType === 'cellular') {
            // Adapt thresholds based on whether it might be 5G
            if (this.is5G) {
                // 5G should be much faster
                if (responseTime < 100) quality = 'excellent';
                else if (responseTime < 300) quality = 'good';
                else if (responseTime < 800) quality = 'fair';
                else quality = 'poor';
            } else {
                // Standard cellular thresholds
                if (responseTime < 300) quality = 'excellent';
                else if (responseTime < 800) quality = 'good';
                else if (responseTime < 2000) quality = 'fair';
                else quality = 'poor';
            }
        } else {
            if (responseTime < 200) quality = 'excellent';
            else if (responseTime < 500) quality = 'good';
            else if (responseTime < 1500) quality = 'fair';
            else quality = 'poor';
        }

        this.logger.network(`Connection quality: ${quality} (${responseTime}ms)`);
        this.updateConnectionQuality(quality);
    }

    private updateConnectionQuality(quality: string) {
        this._connectionQuality.next(quality);
    }

    ngOnDestroy(): void {
        // Clear all tracked timeouts
        for (const id of this.timeoutIds) {
            clearTimeout(id);
        }
        this.timeoutIds.clear();

        // Remove Capacitor network listener
        if (this.networkStatusListenerRef) {
            Network.removeAllListeners();
        }
    }
}