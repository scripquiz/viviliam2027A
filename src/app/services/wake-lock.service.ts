import { Injectable, OnDestroy, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { LoggerService } from './logger.service';

/**
 * Service that provides screen wake lock functionality using the modern Web Wake Lock API
 * with automatic recovery and fallbacks for older browsers and devices.
 * 
 * This service replaces the Cordova Insomnia plugin with a modern approach.
 */
@Injectable({
    providedIn: 'root'
})
export class WakeLockService implements OnDestroy {
    private wakeLock: any = null;
    private isWakeLockSupported: boolean = false;
    private visibilityChangeListener: any = null;
    private keepAwakeActive: boolean = false;
    private retryTimeoutId: any = null;
    private inactivityTimeoutId: any = null;
    private maxTimeoutId: any = null;
    private maxRetries: number = 3;
    private currentRetries: number = 0;
    private maxTimeoutMinutes: number = 30;
    private inactivityTimeoutSeconds: number = 300; // 5 minutes of inactivity
    private appStateSubscriptions: (() => void)[] = [];
    private logger = inject(LoggerService);

    constructor(private platform: Platform) {
        // Check if Wake Lock API is supported
        this.isWakeLockSupported = 'wakeLock' in navigator;
        this.logger.log(`Wake Lock API supported: ${this.isWakeLockSupported}`);

        // Set up visibility change listener to reacquire wake lock when page becomes visible again
        this.setupVisibilityChangeListener();

        // Handle app state changes (background/foreground) on mobile
        this.setupAppStateListeners();
    }

    /**
     * Acquires a wake lock to prevent the device screen from turning off
     * Uses the modern Web Wake Lock API with fallbacks for older devices
     */
    async keepAwake(): Promise<void> {
        // If already active, skip re-acquisition and just reset inactivity timeout
        if (this.keepAwakeActive) {
            this.logger.log('Wake lock already active, resetting inactivity timeout');
            this.resetInactivityTimeout();
            return Promise.resolve();
        }

        // Set flag to track active state
        this.keepAwakeActive = true;

        // Reset retry counter
        this.currentRetries = 0;

        // Setup inactivity timeout
        this.resetInactivityTimeout();

        // Setup max timeout (30 minutes)
        this.setupMaxTimeout();

        try {
            // Release any existing wake lock first
            await this.releaseWakeLock();

            if (this.isWakeLockSupported && document.visibilityState === 'visible') {
                // Use the modern Web Wake Lock API
                this.wakeLock = await (navigator as any).wakeLock.request('screen');

                this.logger.log('Wake Lock acquired successfully');

                // Add a listener to reacquire the wake lock if it's released
                this.wakeLock.addEventListener('release', () => {
                    this.logger.log('Wake Lock released by system');

                    // Only try to reacquire if we're still in "keep awake" mode
                    if (this.keepAwakeActive) {
                        this.retryAcquireWakeLock();
                    }
                });

                return Promise.resolve();
            } else {
                // Fallback for devices without Wake Lock API support
                return this.useFallbackWakeLock();
            }
        } catch (err) {
            this.logger.error('Error acquiring wake lock:', err);

            // Try fallback methods
            return this.useFallbackWakeLock();
        }
    }

    /**
     * Releases the wake lock to allow the device screen to turn off
     */
    async allowSleepAgain(): Promise<void> {
        // Update active state flag
        this.keepAwakeActive = false;

        // Clear all timers
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
            this.retryTimeoutId = null;
        }

        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
            this.inactivityTimeoutId = null;
        }

        if (this.maxTimeoutId) {
            clearTimeout(this.maxTimeoutId);
            this.maxTimeoutId = null;
        }

        try {
            await this.releaseWakeLock();
            return Promise.resolve();
        } catch (err) {
            this.logger.error('Error releasing wake lock:', err);
            return Promise.reject(err);
        }
    }

    /**
     * Setup listeners for document visibility changes (e.g. when user switches tabs)
     */
    private setupVisibilityChangeListener(): void {
        // Remove any existing listener
        if (this.visibilityChangeListener) {
            document.removeEventListener('visibilitychange', this.visibilityChangeListener);
        }

        // Create new listener
        this.visibilityChangeListener = async () => {
            if (document.visibilityState === 'visible' && this.keepAwakeActive) {
                this.logger.log('Document became visible, reacquiring wake lock');
                await this.retryAcquireWakeLock();
            }
        };

        // Add the listener
        document.addEventListener('visibilitychange', this.visibilityChangeListener);
    }

    /**
     * Setup listeners for app state changes (mobile specific)
     */
    private setupAppStateListeners(): void {
        // React to app resuming from background
        this.appStateSubscriptions.push(() => {
            const sub = this.platform.resume.subscribe(async () => {
                if (this.keepAwakeActive) {
                    this.logger.log('App resumed from background, reacquiring wake lock');
                    await this.keepAwake();
                }
            });
            return sub.unsubscribe.bind(sub);
        });

        // React to app pausing/going to background
        this.appStateSubscriptions.push(() => {
            const sub = this.platform.pause.subscribe(async () => {
                if (this.keepAwakeActive) {
                    this.logger.log('App going to background — skipping wake lock release during active playback');
                    // Don't release wake lock during active audio playback.
                    // The inactivity timeout and max timeout will handle cleanup when playback ends.
                }
            });
            return sub.unsubscribe.bind(sub);
        });
    }

    /**
     * Release existing wake lock using the appropriate method
     */
    private async releaseWakeLock(): Promise<void> {
        // Modern Wake Lock API
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.logger.log('Wake Lock released');
            } catch (err) {
                this.logger.warn('Error releasing wake lock:', err);
            } finally {
                this.wakeLock = null;
            }
        }

        // NoSleep.js fallback
        if ((window as any).noSleepInstance) {
            try {
                (window as any).noSleepInstance.disable();
                (window as any).noSleepInstance = null;
            } catch (err) {
                this.logger.error('Error disabling NoSleep:', err);
            }
        }

        // Video element fallback
        const videoElement = document.getElementById('wakeLockVideo') as HTMLVideoElement;
        if (videoElement) {
            try {
                videoElement.pause();
                videoElement.remove();
            } catch (err) {
                this.logger.error('Error removing video element:', err);
            }
        }
    }

    /**
     * Retry acquiring wake lock with exponential backoff
     */
    private async retryAcquireWakeLock(): Promise<void> {
        // Clear any existing retry timeout
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }

        // Only retry if we're still in "keep awake" mode and haven't exceeded max retries
        if (!this.keepAwakeActive) {
            return;
        }

        if (this.currentRetries >= this.maxRetries) {
            this.logger.warn(`Failed to reacquire wake lock after ${this.maxRetries} attempts, falling back to alternative method`);
            return this.useFallbackWakeLock();
        }

        // Calculate delay with exponential backoff (500ms, 1000ms, 2000ms, etc.)
        const delay = Math.min(Math.pow(2, this.currentRetries) * 500, 4000); // Cap at 4 seconds
        this.currentRetries++;

        this.logger.log(`Attempting to reacquire wake lock in ${delay}ms (attempt ${this.currentRetries} of ${this.maxRetries})`);

        // Set timeout for retry
        this.retryTimeoutId = setTimeout(async () => {
            try {
                if (this.isWakeLockSupported && document.visibilityState === 'visible') {
                    this.wakeLock = await (navigator as any).wakeLock.request('screen');
                    this.logger.log('Successfully reacquired wake lock');

                    // Reset retry counter on success
                    this.currentRetries = 0;
                } else {
                    // Fall back to alternative method if Wake Lock API isn't available
                    await this.useFallbackWakeLock();
                }
            } catch (err) {
                this.logger.error('Error while retrying to acquire wake lock:', err);

                // Try again with increased delay (only if under max retries)
                if (this.currentRetries < this.maxRetries) {
                    this.retryAcquireWakeLock();
                } else {
                    this.logger.warn('Max retries reached, using fallback');
                    await this.useFallbackWakeLock();
                }
            }
        }, delay);
    }

    /**
     * Use fallback methods to keep the screen awake
     */
    private async useFallbackWakeLock(): Promise<void> {
        this.logger.log('Using fallback wake lock methods');

        // Try platform specific native features if we're running as a Capacitor app
        if (Capacitor.isNativePlatform()) {
            try {
                // If a native plugin is available, we could use it here
                // For example: @capacitor/keep-awake or custom native implementation
                this.logger.log('Native platform detected - consider using @capacitor/keep-awake plugin');
            } catch (err) {
                this.logger.error('Native fallback error:', err);
            }
        }

        // Try using NoSleep.js if available
        if ((window as any).NoSleep) {
            try {
                (window as any).noSleepInstance = new (window as any).NoSleep();
                (window as any).noSleepInstance.enable();
                this.logger.log('NoSleep.js fallback activated');
                return Promise.resolve();
            } catch (err) {
                this.logger.error('NoSleep fallback error:', err);
            }
        }

        // Last resort: use a video element hack (not recommended for production)
        try {
            this.createVideoElement();
            this.logger.log('Video element fallback activated');
            return Promise.resolve();
        } catch (err) {
            this.logger.error('Video fallback error:', err);
            return Promise.reject(err);
        }
    }

    /**
     * Creates a hidden video element playing a silent video to keep the screen on
     * This is a universal fallback for devices without Wake Lock API
     */
    private createVideoElement(): void {
        // Check if we already have a wake lock video element
        const existingVideo = document.getElementById('wakeLockVideo');
        if (existingVideo) return;

        // Create a hidden video element that plays silently
        const video = document.createElement('video');
        video.id = 'wakeLockVideo';
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.muted = true;

        // Style to ensure it's invisible but still active
        video.style.position = 'absolute';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-1000';

        // Create a silent video source with a data URI (1x1 pixel video)
        const source = document.createElement('source');
        source.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAxNtZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBmZDJjOGY4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTAgb3Blbl9nb3A9MCB3ZWlnaHRwPTAga2V5aW50PWluZmluaXRlIGtleWludF9taW49Mjkgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAOZYiEAD//8m+P5OXfBeLGOfKE3xkODsRYvYcnSHkP2b4wGsKsXu03ZEti0ZFQ0dUV/CWZBt5be0u4XNlJGQkRnK9nzYAAAKZBmiRsQn/+tRsAAAACQZpCPEIP5SgGdwVk3zNIJGT1ABcQRlV80dYXkiNM8V5cdNMVKJqHyOZUdZmRar9PFzXWiSkfn97JcVztX3HzmZObG+VfuftavTqKsGp3GvXs6KgDldnste9/QDl3PK09q5NgE0ABwMUAEAAAB21BmmZJ4Q8mUwIb//6nhAAAAwAAAwAAPC/t9uTQCjL75GQiEMsBLbvGMR419XKcQkk4/8dC3Jy+0AYXqHFVQC2byIEl9QFdQKQQ9d3wDR8IVJOqqcGU6t9M3tH+MYkA8DXnGcgJRRmxd6gAZ6YAAdhU7EAAAAKYQZqISeEPJlMCG//+p4QAAAAMAAADTy1OKwseB5IDnrmBDED+BHqvYF+R4GV7HW6bejfWCVwICrLljO8YxHJqrK0AEQ7yfv3MG/xv6lvAqn1XrFXR6c+5Ltl5SyTg6+QZDiKdUgBJDIryjrS+13xhZG0LAKYAMkgAUAAAEhEGap0nhDyZTAhv//qeEAAAAwAAAwfm1VdaFhYAxEvkgdnfMYHAArZOF3LwLA18/cOhoFJ5GoHZLAZDkBvGlbzjnID9pFdPjc9MBFC+v4SLjkJgHBdJFH/e7zt7P/aDs32qvIwB0Ib3ZPdeWWOQJBlR8Z/d6Sw/hKzf2RsDP2hfeFRn7JE0AOBigAEE+rmRSooi49Kog+IV5JW5TJlAr01xQD5ZJbEXq1xQJ0KjE9vHPInp4AAACpEGayUnhDyZTAhv//qeEAAADAAADAG+7Zv/YVWgFIUW3YyBpbAHRT/jPrpdwl3fWTsQMdEzhylbyOquWksj+dP49DrO7sp8dtEAiyXF5JjOPc8Uuudy23oRFEIeYL3LQzVnOF1j4xxcp/wNz5fITm5bGe3YrnDWZ2+MTBdEQjb7TrvWRXchUYtZNuIcgSMJ0TozqcUAGujMAL1QlPfSOc6AIBBhewqPAAAAI/QZrrSeEPJlMCG//+p4QAAADAAADDHW7n3sklukLsZhbsOGxVqMQuGpPDMRbYVabfAB2HAcYB9STtBw4Rc8fc30mFYlcoy3+wlcZnHG3v8fH3DimEeQ/SIytQLVjbn9qisuvGC6Yf2tVlLXF9tPx9nxXrfMAyGw/MmsxD14xfnO9914Pt+HRByD6iBWrns2/hmQ8xFQIinIJwUQAABf0YAAACGEGbDEnhDyZTAhv//qeEAAA5sc3deAgbZpoPGGmQzalHsWXhQInlxU4vQhFFJbuPP3YJg4HvpWwEEbsf2/v2a5ya0Tz3/3ETQKKf/OUzVGr6xgsY/lzCoKNIjGUaiV36HkIrWfI8v2YC34jcw/X0Dp8/BX62TlGEAAAAGtBm1BJ4Q8mUwIX//+jLAIwE5OfQAAcmADPMFDpVZCZ7x0/9g2tdl61TccgbQ2gsw7W9gt1XMoEvMsAfy+uFmZp4ZnTaD6UdhOe2RH8Z9iyHa0QeBrpEwL3bCDRt3LWQuREY4m/5pGKk4qGkwA11zwABdAAAAwUGbcUnhDyZTAhf//oywTcuY2qYAu+NZ2G7m4DfCRzVkMII7MeS6pJiT7R6yZaTbSYO1nHXYSGGhoBa0IKR/TkSq8nLcV73n5LpVUXwmYWx434tmCZqQGXdeEAMmwYnR8BiS//UoXB407c4k8KGYRwDmQXWevpkGkAXJmtFIJ2AiZdxQ2axYxhoPo0A7EVGHWYAAAAZdBm5VJ4Q8mUwIX//6MsB7siYBdkAAL8AAAAwAA1RJEgQnazpNwKJUHBZgBQCqluiHn86xu75TvVkwUL1aFvfCsyz4isROzqBVhI/gB0g1TfaNS9CgQY9S+nWY6/e2UCe6nqCEWj0DnYKAAAABMQZ+zRRE8K/8AAAMAAAMAAAMAS8AMDIJAAAADwGf0WpCfwAAAAMAAAAMAA0wACDA0gAAACABn9NqQn8AAAADAAAAwJ382MAwAHgAAAAMAAADAAAcEAQ4AAAAFAGf0WpCfwAAAAMAAAAMAANMAAhwIcAAAAQwBn9NqQn8AAAADAAAAwADTA==';
        source.type = 'video/mp4';

        video.appendChild(source);
        document.body.appendChild(video);

        // Try to play the video with multiple attempts and error handling
        const attemptPlay = (retries = 3) => {
            video.play()
                .then(() => {
                    this.logger.log('Wake lock video playing successfully');
                })
                .catch(error => {
                    this.logger.error('Failed to play wake lock video:', error);

                    // Retry with user interaction trigger if available
                    if (retries > 0) {
                        this.logger.log(`Retrying video play, ${retries} attempts left`);

                        // Add a click event listener to try again on user interaction
                        const retryOnInteraction = () => {
                            document.removeEventListener('click', retryOnInteraction);
                            document.removeEventListener('touchstart', retryOnInteraction);
                            attemptPlay(retries - 1);
                        };

                        document.addEventListener('click', retryOnInteraction, { once: true });
                        document.addEventListener('touchstart', retryOnInteraction, { once: true });
                    }
                });
        };

        // Start first attempt
        attemptPlay();
    }

    /**
     * Clean up resources when service is destroyed
     */
    ngOnDestroy(): void {
        // Unsubscribe from platform state listeners
        for (const unsubscribe of this.appStateSubscriptions) {
            unsubscribe();
        }
        this.appStateSubscriptions = [];

        // Clear any pending retry attempts
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }

        // Clear inactivity timeout
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
        }

        // Clear max timeout
        if (this.maxTimeoutId) {
            clearTimeout(this.maxTimeoutId);
        }

        // Remove visibility change listener
        if (this.visibilityChangeListener) {
            document.removeEventListener('visibilitychange', this.visibilityChangeListener);
        }

        // Release any active wake locks
        this.releaseWakeLock();
    }

    /**
     * Reset the inactivity timeout - called on user activity
     */
    private resetInactivityTimeout(): void {
        // Clear existing timeout
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
        }

        // Set new timeout
        this.inactivityTimeoutId = setTimeout(() => {
            this.logger.log(`Wake lock auto-released after ${this.inactivityTimeoutSeconds} seconds of inactivity`);
            this.allowSleepAgain();
        }, this.inactivityTimeoutSeconds * 1000);
    }

    /**
     * Setup maximum timeout for wake lock (30 minutes)
     */
    private setupMaxTimeout(): void {
        // Clear existing timeout
        if (this.maxTimeoutId) {
            clearTimeout(this.maxTimeoutId);
        }

        // Set max timeout
        this.maxTimeoutId = setTimeout(() => {
            this.logger.log(`Wake lock auto-released after ${this.maxTimeoutMinutes} minutes maximum hold time`);
            this.allowSleepAgain();
        }, this.maxTimeoutMinutes * 60 * 1000);
    }

    /**
     * Public method to reset inactivity - call this on user interactions or audio events
     */
    public resetActivity(): void {
        if (this.keepAwakeActive) {
            this.resetInactivityTimeout();
        }
    }

    /**
     * Check if wake lock is currently active
     */
    public isActive(): boolean {
        return this.keepAwakeActive;
    }
}