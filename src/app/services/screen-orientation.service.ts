import { Injectable, OnDestroy, inject } from '@angular/core';
import { ScreenOrientation as CapacitorScreenOrientation } from '@capacitor/screen-orientation';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { Platform } from '@ionic/angular';
import { LoggerService } from './logger.service';

/**
 * Service that provides screen orientation functionality using Capacitor's ScreenOrientation plugin
 * This service replaces the Cordova screen-orientation plugin with the Capacitor alternative
 */
@Injectable({
    providedIn: 'root'
})
export class ScreenOrientationService implements OnDestroy {
    private _orientation = new BehaviorSubject<OrientationType>('portrait' as OrientationType);
    public orientation$ = this._orientation.asObservable();

    private logger = inject(LoggerService);
    private orientationListenerRef: any = null;

    constructor(private platform: Platform) {
        this.initialize();
    }

    /**
     * Initialize the service and set up event listeners
     */
    private async initialize(): Promise<void> {
        // Wait for the platform to be ready
        await this.platform.ready();

        try {
            // Get current orientation using the correct method name (orientation instead of getOrientation)
            const orientation = await CapacitorScreenOrientation.orientation();
            this._orientation.next(orientation.type);

            // Listen for orientation changes - correct event name is 'screenOrientationChange', not 'orientationChange'
            const ref = await CapacitorScreenOrientation.addListener('screenOrientationChange', (event: any) => {
                this._orientation.next(event.type);
                this.logger.log('Orientation changed to:', event.type);
            });
            this.orientationListenerRef = ref;
        } catch (error) {
            this.logger.error('Error initializing ScreenOrientationService:', error);
        }
    }

    /**
     * Get the current screen orientation
     * @returns Observable that emits current orientation
     */
    getCurrentOrientation(): Observable<OrientationType> {
        // Update to use the correct method name
        return from(CapacitorScreenOrientation.orientation().then(res => res.type as OrientationType));
    }

    ngOnDestroy() {
        if (this.orientationListenerRef) {
            this.orientationListenerRef();
        }
    }

    /**
     * Get the current orientation type
     * @returns The current orientation type string
     */
    get type(): string {
        return this._orientation.getValue();
    }

    /**
     * Lock the screen orientation
     * @param orientation The orientation to lock to
     * @returns Promise that resolves when the orientation is locked
     */
    lock(orientation: OrientationType): Promise<void> {
        return CapacitorScreenOrientation.lock({ orientation });
    }

    /**
     * Unlock the screen orientation
     * @returns Promise that resolves when the orientation is unlocked
     */
    unlock(): Promise<void> {
        return CapacitorScreenOrientation.unlock();
    }

    /**
     * Creates an observable that emits when orientation changes
     * @returns Observable that emits on orientation change
     */
    onChange(): Observable<OrientationType> {
        return this.orientation$;
    }
}

/**
 * Orientation types supported by the Capacitor Screen Orientation plugin
 */
export type OrientationType =
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'portrait'
    | 'landscape';