import { Injectable, inject } from '@angular/core';
import { Device } from '@capacitor/device';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

/**
 * Interface describing device info from Capacitor Device plugin
 */
export interface DeviceInfo {
    identifier?: string;
    platform: string;
    model: string;
    osVersion: string;
    isVirtual: boolean;
    manufacturer: string;
    [key: string]: any;
}

/**
 * A service that provides device information using Capacitor's Device plugin.
 * This replaces the functionality of cordova-plugin-device.
 */
@Injectable({
    providedIn: 'root'
})
export class DeviceService {
    /** Cached device info to avoid repeated Device.getInfo() calls */
    private _cachedDeviceInfo: DeviceInfo | null = null;

    private _deviceInfo = new BehaviorSubject<DeviceInfo | null>(null);
    public deviceInfo$: Observable<DeviceInfo | null> = this._deviceInfo.asObservable();

    private _deviceId = new BehaviorSubject<{ identifier: string } | null>(null);
    public deviceId$: Observable<{ identifier: string } | null> = this._deviceId.asObservable();

    private logger = inject(LoggerService);

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            // Get device information and cache it
            const info = await Device.getInfo();
            this._cachedDeviceInfo = info;
            this._deviceInfo.next(info);

            // Get device ID
            const id = await Device.getId();
            this._deviceId.next(id);

            this.logger.log('Device info initialized', info);
        } catch (error) {
            this.logger.error('Error initializing device information:', error);
        }
    }

    /**
     * Refresh cached device info
     */
    private async refreshCache() {
        try {
            const info = await Device.getInfo();
            this._cachedDeviceInfo = info;
            this._deviceInfo.next(info);
        } catch (error) {
            this.logger.error('Error refreshing device info:', error);
        }
    }

    /**
     * Get cached device info, refresh if null or force refresh requested
     */
    private async getCachedInfo(forceRefresh?: boolean): Promise<DeviceInfo> {
        if (forceRefresh || !this._cachedDeviceInfo) {
            await this.refreshCache();
        }
        return this._cachedDeviceInfo!;
    }

    /**
     * Get device information synchronously (if already loaded)
     */
    get deviceInfo(): DeviceInfo | null {
        return this._deviceInfo.getValue();
    }

    /**
     * Get device ID synchronously (if already loaded)
     */
    get deviceId(): { identifier: string } | null {
        return this._deviceId.getValue();
    }

    /**
     * Get the device's unique identifier
     * (replacement for Device.uuid in Cordova)
     */
    async getUUID(): Promise<string> {
        const id = await Device.getId();
        return id.identifier ?? ''; // Changed from id.uuid to id.identifier which is the correct property
    }

    /**
     * Get the device platform
     * (replacement for Device.platform in Cordova)
     */
    async getPlatform(): Promise<string> {
        const info = await this.getCachedInfo();
        return info.platform;
    }

    /**
     * Get the device model
     * (replacement for Device.model in Cordova)
     */
    async getModel(): Promise<string> {
        const info = await this.getCachedInfo();
        return info.model;
    }

    /**
     * Get the operating system version
     * (replacement for Device.version in Cordova)
     */
    async getOsVersion(): Promise<string> {
        const info = await this.getCachedInfo();
        return info.osVersion;
    }

    /**
     * Check if the app is running on a real device or emulator
     * (replacement for Device.isVirtual in Cordova)
     */
    async isVirtual(): Promise<boolean> {
        const info = await this.getCachedInfo();
        return info.isVirtual;
    }

    /**
     * Get the manufacturer of the device
     * (replacement for Device.manufacturer in Cordova)
     */
    async getManufacturer(): Promise<string> {
        const info = await this.getCachedInfo();
        return info.manufacturer;
    }

    /**
     * Get battery info from the device
     * (new in Capacitor Device plugin, not available in Cordova)
     */
    async getBatteryInfo() {
        return await Device.getBatteryInfo();
    }

    /**
     * Get device language code
     * (new in Capacitor Device plugin, not available in Cordova)
     */
    async getLanguageCode(): Promise<string> {
        const result = await Device.getLanguageCode();
        return result.value ?? '';
    }
}