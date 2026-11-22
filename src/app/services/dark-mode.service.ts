import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { LoggerService } from './logger.service';

export interface DarkModeState {
  globalDarkMode: boolean;
  readDarkMode: boolean;
  compareDarkMode: boolean;
  searchDarkMode: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DarkModeService implements OnDestroy {
  private readonly STORAGE_KEYS = {
    global: 'globalDarkMode',
    read: 'readDarkMode',
    compare: 'compareDarkMode',
    search: 'searchDarkMode',
  };

  private darkModeState = new BehaviorSubject<DarkModeState>({
    globalDarkMode: false,
    readDarkMode: false,
    compareDarkMode: false,
    searchDarkMode: false,
  });

  public darkModeState$ = this.darkModeState.asObservable();

  /** Ref to the matchMedia event listener so it can be removed in ngOnDestroy */
  private mediaQueryListenerRef: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(
    private logger: LoggerService,
    private platform: Platform
  ) {
    this.initializeDarkMode();
  }

  /**
   * Initialize dark mode from localStorage or system preference
   */
  private initializeDarkMode(): void {
    const state: DarkModeState = {
      globalDarkMode: this.getStoredValue(this.STORAGE_KEYS.global),
      readDarkMode: this.getStoredValue(this.STORAGE_KEYS.read),
      compareDarkMode: this.getStoredValue(this.STORAGE_KEYS.compare),
      searchDarkMode: this.getStoredValue(this.STORAGE_KEYS.search),
    };

    // If no global preference is set, check system preference
    if (localStorage.getItem(this.STORAGE_KEYS.global) === null) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      state.globalDarkMode = prefersDark;
      this.setStoredValue(this.STORAGE_KEYS.global, prefersDark);
    }

    this.darkModeState.next(state);
    this.applyGlobalDarkMode(state.globalDarkMode);

    // Listen for system preference changes
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListenerRef = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't explicitly set a preference
      if (localStorage.getItem(this.STORAGE_KEYS.global) === null) {
        this.toggleGlobalDarkMode(e.matches);
      }
    };
    mediaQueryList.addEventListener('change', this.mediaQueryListenerRef);
  }

  /**
   * Get stored dark mode value
   */
  private getStoredValue(key: string): boolean {
    const value = localStorage.getItem(key);
    return value === '1';
  }

  /**
   * Set stored dark mode value
   */
  private setStoredValue(key: string, value: boolean): void {
    localStorage.setItem(key, value ? '1' : '0');
  }

  /**
   * Get current dark mode state
   */
  public getCurrentState(): DarkModeState {
    return this.darkModeState.getValue();
  }

  /**
   * Toggle global dark mode
   * When enabled, automatically disables all individual page dark modes
   */
  public toggleGlobalDarkMode(forceValue?: boolean): void {
    const currentState = this.darkModeState.getValue();
    const newValue =
      forceValue !== undefined ? forceValue : !currentState.globalDarkMode;

    this.setStoredValue(this.STORAGE_KEYS.global, newValue);

    // When global dark mode is turned ON, turn OFF all individual modes
    const newState = {
      ...currentState,
      globalDarkMode: newValue,
      readDarkMode: newValue ? false : currentState.readDarkMode,
      compareDarkMode: newValue ? false : currentState.compareDarkMode,
      searchDarkMode: newValue ? false : currentState.searchDarkMode,
    };

    // Update storage for individual modes if global is turned on
    if (newValue) {
      this.setStoredValue(this.STORAGE_KEYS.read, false);
      this.setStoredValue(this.STORAGE_KEYS.compare, false);
      this.setStoredValue(this.STORAGE_KEYS.search, false);
    }

    this.darkModeState.next(newState);
    this.applyGlobalDarkMode(newValue);
    this.updateStatusBar();
  }

  /**
   * Toggle read page dark mode
   * When enabled, automatically disables global dark mode
   */
  public toggleReadDarkMode(forceValue?: boolean): void {
    const currentState = this.darkModeState.getValue();
    const newValue =
      forceValue !== undefined ? forceValue : !currentState.readDarkMode;

    this.setStoredValue(this.STORAGE_KEYS.read, newValue);

    // When individual mode is turned ON, turn OFF global mode
    const newState = {
      ...currentState,
      readDarkMode: newValue,
      globalDarkMode: newValue ? false : currentState.globalDarkMode,
    };

    // Update storage for global mode if individual is turned on
    if (newValue) {
      this.setStoredValue(this.STORAGE_KEYS.global, false);
      this.applyGlobalDarkMode(false);
    }

    this.darkModeState.next(newState);
    this.updateStatusBar();
  }

  /**
   * Toggle compare page dark mode
   * When enabled, automatically disables global dark mode
   */
  public toggleCompareDarkMode(forceValue?: boolean): void {
    const currentState = this.darkModeState.getValue();
    const newValue =
      forceValue !== undefined ? forceValue : !currentState.compareDarkMode;

    this.setStoredValue(this.STORAGE_KEYS.compare, newValue);

    // When individual mode is turned ON, turn OFF global mode
    const newState = {
      ...currentState,
      compareDarkMode: newValue,
      globalDarkMode: newValue ? false : currentState.globalDarkMode,
    };

    // Update storage for global mode if individual is turned on
    if (newValue) {
      this.setStoredValue(this.STORAGE_KEYS.global, false);
      this.applyGlobalDarkMode(false);
    }

    this.darkModeState.next(newState);
    this.updateStatusBar();
  }

  /**
   * Toggle search page dark mode
   * When enabled, automatically disables global dark mode
   */
  public toggleSearchDarkMode(forceValue?: boolean): void {
    const currentState = this.darkModeState.getValue();
    const newValue =
      forceValue !== undefined ? forceValue : !currentState.searchDarkMode;

    this.setStoredValue(this.STORAGE_KEYS.search, newValue);

    // When individual mode is turned ON, turn OFF global mode
    const newState = {
      ...currentState,
      searchDarkMode: newValue,
      globalDarkMode: newValue ? false : currentState.globalDarkMode,
    };

    // Update storage for global mode if individual is turned on
    if (newValue) {
      this.setStoredValue(this.STORAGE_KEYS.global, false);
      this.applyGlobalDarkMode(false);
    }

    this.darkModeState.next(newState);
    this.updateStatusBar();
  }

  /**
   * Apply global dark mode to body element
   */
  private applyGlobalDarkMode(isDark: boolean): void {
    const bodyElement = document.body;
    if (isDark) {
      bodyElement.classList.add('dark-theme');
      this.logger.log('Dark theme class ADDED to body');
      this.logger.log('Body classes:', bodyElement.className);
    } else {
      bodyElement.classList.remove('dark-theme');
      this.logger.log('Dark theme class REMOVED from body');
      this.logger.log('Body classes:', bodyElement.className);
    }

    // Force styles to re-apply
    bodyElement.style.backgroundColor = isDark ? '#1a1a1a' : '#f4ecdd';

    // Update theme-color meta tag for Android address bar
    this.updateThemeColorMeta(isDark);

    // Log current computed styles
    const computedStyle = window.getComputedStyle(bodyElement);
    this.logger.log('Body background-color:', computedStyle.backgroundColor);
  }

  /**
   * Update theme-color meta tag for Android address bar
   */
  private updateThemeColorMeta(isDark: boolean): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1a1a1a' : '#FFFFFF');
    }
  }

  /**
   * Check if dark mode is active for current context
   */
  public isDarkModeActive(page?: 'read' | 'compare' | 'search'): boolean {
    const state = this.getCurrentState();

    if (page === 'read') {
      return state.readDarkMode || state.globalDarkMode;
    } else if (page === 'compare') {
      return state.compareDarkMode || state.globalDarkMode;
    } else if (page === 'search') {
      return state.searchDarkMode || state.globalDarkMode;
    }

    return state.globalDarkMode;
  }

  /**
   * Update StatusBar based on current dark mode state
   */
  public async updateStatusBar(currentPage?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await this.platform.ready();

      let isDark = false;
      const state = this.getCurrentState();

      // Determine if dark mode should be active based on current page
      if (currentPage === 'read' || currentPage === 'READ') {
        isDark = state.readDarkMode || state.globalDarkMode;
      } else if (currentPage === 'compare' || currentPage === 'COMPARE') {
        isDark = state.compareDarkMode || state.globalDarkMode;
      } else if (currentPage === 'search' || currentPage === 'SEARCH') {
        isDark = state.searchDarkMode || state.globalDarkMode;
      } else {
        isDark = state.globalDarkMode;
      }

      const barColor = isDark ? '#1a1a1a' : '#FFFFFF';

      // Keep status and navigation bar foreground in sync with the active theme.
      await SystemBars.setStyle({
        style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      });

      // Update system bar protection overlays using the edge-to-edge plugin.
      await this.updateNavigationBar(barColor);

      this.logger.log(
        `StatusBar & NavigationBar updated for ${currentPage || 'global'
        } - Dark: ${isDark}, Color: ${barColor}`
      );
    } catch (error) {
      this.logger.error('Error updating StatusBar:', error);
    }
  }

  /**
   * Update Navigation Bar (Android bottom bar) color using EdgeToEdge plugin
   */
  private async updateNavigationBar(color: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const { EdgeToEdge } = await import(
        '@capawesome/capacitor-android-edge-to-edge-support'
      );

      // Prefer dedicated APIs on newer plugin versions.
      if (typeof EdgeToEdge.setNavigationBarColor === 'function') {
        await EdgeToEdge.setNavigationBarColor({ color });
      }

      if (typeof EdgeToEdge.setStatusBarColor === 'function') {
        await EdgeToEdge.setStatusBarColor({ color });
      }

      // Backward compatibility for older plugin versions.
      if (typeof EdgeToEdge.setBackgroundColor === 'function') {
        await EdgeToEdge.setBackgroundColor({ color });
      }

      this.logger.log(`EdgeToEdge system bar overlays updated: ${color}`);
    } catch (error) {
      this.logger.error('Error updating Navigation Bar with EdgeToEdge:', error);
    }
  }

  /**
   * Apply page-specific dark mode class
   */
  public applyPageDarkMode(
    page: 'read' | 'compare' | 'search',
    selector: string
  ): void {
    const isDark = this.isDarkModeActive(page);
    const element = document.querySelector(selector);

    if (element) {
      if (isDark) {
        element.classList.add('dark-mode');
      } else {
        element.classList.remove('dark-mode');
      }
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQueryListenerRef) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryListenerRef);
    }
  }
}
