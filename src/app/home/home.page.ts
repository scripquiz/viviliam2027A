import { CommonModule } from '@angular/common';
import { ViewEncapsulation, ChangeDetectionStrategy, inject } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import {
  FormsModule,
} from '@angular/forms';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { DailyBibleVerseComponent } from '../components/daily-bible-verse/daily-bible-verse.component';
import { DailyBibleQuoteComponent } from '../components/daily-bible-quote/daily-bible-quote.component';
import { IonContent, Platform, IonicModule } from '@ionic/angular';
import { IonLoaderService } from '../ion-loader.service';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { App } from '@capacitor/app';
import { WakeLockService } from '../services/wake-lock.service';
import { Browser } from '@capacitor/browser';
import { LoggerService } from '../services/logger.service';
import { DarkModeService } from '../services/dark-mode.service';
import { AudioFocusService } from '../services/audio-focus.service';
import { AudioPlaybackService } from '../core/services/audio-playback.service';
import { ConnectivityService } from '../core/services/connectivity.service';
import { AudioCacheService } from '../core/audio-cache.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    DailyBibleVerseComponent,
    DailyBibleQuoteComponent
  ]
})
export class HomePage {
  public authservice: AuthserviceProvider | undefined;

  // Use any type to handle Angular's template reference on native Android
  // The element is accessed via querySelector when needed, not directly from ViewChild
  @ViewChild('audio', { static: true }) audio: any;

  // Helper to get actual HTMLMediaElement using querySelector - more reliable on native platforms
  private getAudioElement(): HTMLMediaElement | null {
    // Try ViewChild reference first (for web/compatibility)
    if (this.audio && typeof this.audio.play === 'function') {
      return this.audio as HTMLMediaElement;
    }
    // Fallback to DOM querySelector for native platform compatibility - always works on Capacitor WebView
    const audioEl = document.querySelector('audio') as HTMLMediaElement;
    if (audioEl && typeof audioEl.play === 'function') {
      return audioEl as HTMLMediaElement;
    }
    return null;
  }

  // Get raw audio element from DOM for direct access - bypasses Angular's proxy issues on native Android
  private getRawAudioElement(): HTMLMediaElement | null {
    const el = document.querySelector('audio') as HTMLMediaElement;
    if (el && typeof el.play === 'function' && typeof el.pause === 'function') {
      return el;
    }
    return null;
  }
  public networkSubscription: any;

  // Network quality states: excellent, good, fair, poor
  public connectionQuality: string = 'unknown';
  public audioLoadInProgress: boolean = false;
  public darkModeSubscription: any;

  public slideOpts = {
    initialSlide: 0,
    speed: 300,
    effect: 'flip',
    autoplay: { delay: 5000 },
    allowTouchMove: false,
  };
  public APIMessage: any = '';
  public database: DatabaseConnection;
  public unread: any = 0;
  public todayTabSelected: any = 'today';
  public notificationsTabSelected: any = '';
  public tabRowitemSelected: any = '0';
  public orientation: any;
  public notificationsHomeCount: any;

  public selectedAudioSource: any = '';
  public playAllText: any = 'Play All';
  public notificationUpdateIndex: any = 0;
  public appversionText: any = '';
  public resumeListener: any;
  public pauseListener: any;


  public showNetworkOrAPIErrorMessage: any = 0;
  public todayAudioFiles: any[] = [];
  public isAudioLoading: boolean = true;
  public audioLoadError: boolean = false;
  public errorStateTimer: any = null;
  public stableErrorDetected: boolean = false;
  public get isServerError(): boolean {
    const authservice = inject(AuthserviceProvider);
    return this.APIMessage === (authservice?.serverDownMessage || '');
  }
  public segmentSelected: string = '0';
  public isDarkMode: boolean = false;
  public audioProgressIntervalId: any = null;

  // ✅ FIX ISSUE #4: (Using window-based event for cross-service audio URL updates)
  constructor(
    public connectivityService: ConnectivityService,

    private wakeLockService: WakeLockService,
    private screenorientation: ScreenOrientationService,
    private ionLoaderService: IonLoaderService,
    private platform: Platform,
    private databaseService: DatabaseService,
    private logger: LoggerService,
    private darkModeService: DarkModeService,
    private audioFocusService: AudioFocusService,
    private audioPlaybackService: AudioPlaybackService,
    private audioCacheService: AudioCacheService
  ) {
    // Initialize authservice using inject() for proper Angular DI
    this.authservice = inject(AuthserviceProvider);
    this.errorStateTimer = null;
    this.stableErrorDetected = false;

    this.getAppVersionInfo();

    this.audioFocusService.registerOwner('home', () => {
      this.stopHomeAudioPlayback();
    });

    // Subscribe to dark mode changes
    this.darkModeSubscription = this.darkModeService.darkModeState$.subscribe(
      (state) => {
        this.isDarkMode = state.globalDarkMode;
      }
    );

    this.platform
      .ready()
      .then(() => {
        fetch('https://api.viviliam.com/assets/voiceover/audio_bibles.json')
          .then((res) => res.json())
          .then((json) => {
            this.authservice.audio_bibles = json[0].bibleids;
          })
          .catch((error) => {
            this.logger.error('Failed to load audio bibles:', error);
          });
        // Load audio immediately after platform is ready, if tab is active
        setTimeout(() => {
          if (this.tabRowitemSelected === '0') {
            this.loadAudioDirectly();
          }
        }, 500);

        this.resumeListener = this.platform.resume.subscribe(() => {
          this.notificationUpdateIndex = 0;
          this.logger.network('App resumed - checking active connectivity');
          this.connectivityService.checkNetwork({ loadAudio: true }).then((isConnected) => {

            if (isConnected) {
              this.logger.network(
                'Active connectivity test passed - loading content'
              );
              this.setStableErrorState(false, '');
              if (!this.audioPlaybackService.audioPlaying) {
                if (this.audioLoadError) {
                  this.loadAudioDirectly();
                }
              }
            } else {
              this.logger.network(
                'Active connectivity test failed - setting error state'
              );
              const noNetMessage = this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.';
              this.setStableErrorState(true, noNetMessage);
            }
          });
          if (this.screenorientation.type == 'landscape-primary') {
            this.orientation = 'landscape';
            this.authservice.orientation = this.orientation;
          } else {
            this.orientation = 'portrait';
            this.authservice.orientation = this.orientation;
          }
        });
        this.pauseListener = this.platform.pause.subscribe(() => {});
        this.orientation = this.authservice.orientation;
        this.screenorientation.onChange().subscribe(() => {
          this.logger.log(
            'Orientation changed to ' + this.screenorientation.type
          );
          if (
            this.screenorientation.type == 'landscape-primary' ||
            this.screenorientation.type === 'landscape-secondary'
          ) {
            this.orientation = 'landscape';
            this.authservice.orientation = this.orientation;
          } else {
            this.orientation = 'portrait';
            this.authservice.orientation = this.orientation;
          }
        });
        this.databaseService
          .create({
            name: 'viviliam.db',
            location: 'default',
          })
          .then((db: DatabaseConnection) => {
            this.database = db;
            this.audioProgressIntervalId = setInterval(() => {
              if (this.audioPlaybackService.audioPlaying && typeof this.audioPlaybackService.currentAudioIndex === 'number') {
                const activeAudioArray = this.todayAudioFiles;
                if (
                  activeAudioArray &&
                  activeAudioArray.length > 0 &&
                  this.audioPlaybackService.currentAudioIndex < activeAudioArray.length
                ) {
                  // Fix #1: Removed unreliable time-based threshold check (duration - 0.5)
                  // The native 'ended' event listener is the primary signal for audio completion
                  // Polling now only handles progress tracking, not endpoint detection
                  activeAudioArray[this.audioPlaybackService.currentAudioIndex].ctime = parseInt(
                    this.getRawAudioElement()?.currentTime.toString()
                  );
                  activeAudioArray[this.audioPlaybackService.currentAudioIndex].ctimeintime =
                    this.audioCacheService.convertHMS(
                      parseInt(
                        this.getRawAudioElement()?.currentTime.toString()
                      )
                    );
                    activeAudioArray[this.audioPlaybackService.currentAudioIndex].durationintime =
                      this.audioCacheService.convertHMS(
                        parseInt(
                          activeAudioArray[this.audioPlaybackService.currentAudioIndex].duration
                        ) -
                          parseInt(
                          this.getRawAudioElement()?.currentTime.toString()
                          )
                      );
                }
              }
            }, 1000);
          })
          .catch((error) => {
            this.logger.error('Database creation error:', error);
            this.setStableErrorState(true, 'Database error');
          });
      })
      .catch((error) => {
        this.logger.error('Platform ready error:', error);
      });
  }
  handleLoadingError(message) {
    this.logger.error('Audio loading error:', message);
    this.isAudioLoading = false;
    this.audioLoadError = true;
    this.audioLoadInProgress = false;

    const isNoNet = this.connectivityService.connectionType === 'none' ||
                     this.connectivityService.connectionType === 'unknown';

    const errorMsg = isNoNet
      ? (this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.')
      : (this.authservice?.serverDownMessage || 'Service temporarily not available. Please try again later.');

    this.setStableErrorState(true, errorMsg);
    this.logger.log(isNoNet ? 'Falling back to database audio loading' : 'Setting server error flag for audio loading');
  }
  playAllAudiosDirect() {
    // Validate that we have audio files to play
    if (!this.todayAudioFiles || this.todayAudioFiles.length === 0) {
      this.logger.warn('No audio files available for Play All');
      return;
    }

    // Get the actual audio element using querySelector - works reliably on native Android
    const audioElement = this.getRawAudioElement();

    if (!audioElement) {
      this.logger.error('Cannot play audio: audio element not available');
      return;
    }

    if (this.audioPlaybackService.playAll) {
      this.audioPlaybackService.setPlayAll(false);
      this.audioPlaybackService.setAudioPlaying(false);
      this.playAllText = 'Play All';
      this.audioPlaybackService.stopAllAudioDirect(audioElement, this.todayAudioFiles);
    } else {
      this.audioPlaybackService.setPlayAll(true);
      this.audioPlaybackService.setCurrentAudioIndex(0);
      this.audioPlaybackService.setRepeatPlayedCountAll(0);
      this.audioPlaybackService.playAllAudiosDirect(audioElement, this.todayAudioFiles);
      this.playAllText = 'Stop Playing';

      // Handle wake lock properly - await and log result without suppressing errors
      this.wakeLockService.keepAwake()
        .then(() => {
          this.logger.log('Wake lock acquired for play-all mode in home.page');
        })
        .catch(error => {
          this.logger.error('Error acquiring wake lock in playAllAudiosDirect:', error);
        });
    }
  }

  stopAllAudioDirect() {
    // Properly await the stop operation and handle any errors
    const audioElement = this.getRawAudioElement();
    if (!audioElement) {
      this.logger.warn('stopAllAudioDirect: audio element not available');
      return;
    }
    this.audioPlaybackService.stopAllAudioDirect(audioElement, this.todayAudioFiles)
      .then(() => {
        this.audioPlaybackService.setPlayAll(false);
        this.playAllText = 'Play All';
        this.logger.log('Stop All Audio completed');
      })
      .catch(error => {
        this.logger.error('Error stopping all audio:', error);
        // Don't block UI on error - just log it
        this.audioPlaybackService.setPlayAll(false);
        this.playAllText = 'Play All';
      });
  }

  playAudioDirect(idx: number) {
    // Ensure audio is paused before starting new track
    this.stopHomeAudioPlayback();

    // Start playing the specific track using position-based title mapping
    const displayName = ['Psalms', 'Proverbs', 'Song'][idx] || 'Unknown';

    // Get the actual audio element using querySelector - works reliably on native Android
    const audioElement = this.getRawAudioElement();

    if (!audioElement) {
      this.logger.error('Cannot play specific track: audio element not available');
      return;
    }

    // Start playing the specific track
    this.audioPlaybackService.startAudioDirect(
      idx,
      audioElement,
      this.todayAudioFiles
    );
  }

  stopAudioDirect(idx: number) {
    // Validate that we have audio files and valid index
    if (!this.todayAudioFiles || !Array.isArray(this.todayAudioFiles) || idx >= this.todayAudioFiles.length) {
      return;
    }

    // Ensure audio is paused before updating track state
    this.stopHomeAudioPlayback();

    // CRITICAL: Actually stop the audio element and update track state via service
    const audioElement = this.getRawAudioElement();
    if (audioElement && typeof audioElement.pause === 'function') {
      audioElement.pause();
    } else {
      this.logger.warn('stopAudioDirect: audio element not available for pausing');
    }

    // Update individual track state to reflect UI
    this.todayAudioFiles[idx].state = 'pause';
    this.todayAudioFiles[idx].repeat_state = 0;
    this.todayAudioFiles[idx].repeat_played_count = 0;
    this.audioPlaybackService.audioPlaying = false;
    this.audioPlaybackService.playAll = false;

    if (idx === this.audioPlaybackService.currentAudioIndex) {
      this.audioPlaybackService.currentAudioIndex = -1;
    }
  }

  private clearPerItemRepeatStates(exceptIndex: number = -1) {
    if (!Array.isArray(this.todayAudioFiles)) {
      return;
    }

    for (let idx = 0; idx < this.todayAudioFiles.length; idx++) {
      if (idx !== exceptIndex) {
        this.todayAudioFiles[idx].repeat_state = 0;
      }
      this.todayAudioFiles[idx].repeat_played_count = 0;
    }
  }

  setRepeatStateDirect(i, repeat_state) {
    this.audioPlaybackService.setRepeatStateDirect(i, repeat_state, this.audio, this.todayAudioFiles);
  }

  private stopHomeAudioPlayback(): void {
    if (typeof this.audioPlaybackService.currentAudioIndex === 'number') {
      this.audioPlaybackService.stopAudioDirect(this.audioPlaybackService.currentAudioIndex, this.audio, this.todayAudioFiles);
    }
  }

  async openURLWeb(url: string) {
    try {
      await Browser.open({
        url: url,
        toolbarColor: '#c94b18',
        presentationStyle: 'popover',
      });
    } catch (error) {
      this.logger.error('Error opening URL:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open the page. Please check your connection.'
      );
    }
  }
  ngAfterViewInit() {
    this.logger.log('Audio Debug Info:');
    this.logger.log('isAudioLoading:', this.isAudioLoading);
    this.logger.log('audioLoadError:', this.audioLoadError);
    this.logger.log('todayAudioFiles length:', this.todayAudioFiles.length);
    this.logger.log('todayAudioFiles:', this.todayAudioFiles);
    this.logger.log('segmentSelected:', this.segmentSelected);
    this.logger.log('tabRowitemSelected:', this.tabRowitemSelected);
  }
  ionViewWillEnter() {
    // Menu disabled by default in this app

    setTimeout(() => {
      const rowTabElement = document.querySelector(
        '.row-tab-home'
      ) as HTMLElement;
      if (rowTabElement) {
        rowTabElement.style.position = 'fixed';
        rowTabElement.style.zIndex = '999';
        rowTabElement.style.top = '56px';
        rowTabElement.style.backgroundColor = '#fff';
      }
    }, 100);
    this.setupNetworkListeners();
  }

  ionViewWillLeave() {
    this.stopHomeAudioPlayback();
    this.audioFocusService.releaseFocus('home');

    // Release wake lock when leaving the page - await properly
    if (this.wakeLockService.isActive()) {
      this.wakeLockService.allowSleepAgain()
        .then(() => this.logger.log('Wake lock released on page leave'))
        .catch(error => {
          this.logger.error('Error releasing wake lock on page leave:', error);
        });
    }
  }

  ionViewDidEnter() {
    if (this.isTodayTabActive()) {
      this.loadAudioDirectly();
    }

    this.connectivityService.checkNetwork({ loadAudio: true }).then((isConnected) => {
      if (isConnected) {
        this.logger.network(
          'Active internet connection confirmed - initializing page'
        );
        // Only clear stale cache when network is available — don't delete it before the load so tryLoadFromCache() can still find it on failure
        if (this.todayAudioFiles && this.todayAudioFiles.length === 0) {
          localStorage.removeItem('todayAudioCache');
          localStorage.removeItem('todayAudioCacheDate');
          this.logger.log('Cleared audio cache - will fetch fresh data from API');

          if (this.isTodayTabActive()) {
            this.loadAudioDirectly();
          }
        }
      }
    });
    this.authservice.currentPage = 'HOME';
    var slideIndex = this.authservice.promoslide;
    this.slideOpts = {
      initialSlide: slideIndex,
      speed: 300,
      effect: 'flip',
      autoplay: { delay: 5000 },
      allowTouchMove: false,
    };
    this.authservice.promoslide++;
    if (this.authservice.promoslide == 4) this.authservice.promoslide = 0;
    this.authservice.showsign = 1;
    this.notificationUpdateIndex = 0;
    this.authservice.currentPage = 'HOME';
    this.logger.log('View did enter');
    this.segmentSelected = this.tabRowitemSelected.toString();
  }
  segmentChanged(event) {
    this.segmentSelected = event.detail.value;
    this.selectRowTaIte(parseInt(this.segmentSelected).toString());
  }
  async selectRowTaIte(tabitem: any) {
    this.tabRowitemSelected = tabitem;
    this.segmentSelected = tabitem.toString();
    if (tabitem.toString() === '0') {
      this.todayTabSelected = 'today';
      this.notificationsTabSelected = '';
      this.connectivityService.checkNetwork({ loadAudio: true }).then((isConnected) => {
        if (isConnected) {
          this.loadAudioDirectly();
        }
      });
    } else if (tabitem.toString() === '1') {
      this.unread = 0;
      this.notificationsTabSelected = 'notifications';
      this.todayTabSelected = '';
      this.showNetworkOrAPIErrorMessage = 0;
      if (this.connectivityService.lastConnectivityResult) {
        this.logger.log('Misc tab selected - ensuring content visibility');
      }
    } else if (tabitem.toString() === '2') {
      this.notificationsTabSelected = '';
      this.todayTabSelected = '';
      this.showNetworkOrAPIErrorMessage = 0;
    }
  }
  ngOnDestroy() {
    this.audioFocusService.releaseFocus('home');
    this.audioFocusService.unregisterOwner('home');

    // ✅ FIX ISSUE #4: Clean up audio URL change listener
    if ((window as any).__VIVILIAM_AUDIO_URL_CHANGED) {
      delete (window as any).__VIVILIAM_AUDIO_URL_CHANGED;
    }

    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
    if (this.resumeListener) {
      this.resumeListener.unsubscribe();
    }
    if (this.pauseListener) {
      this.pauseListener.unsubscribe();
    }
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
    if (this.audioProgressIntervalId) {
      clearInterval(this.audioProgressIntervalId);
      this.audioProgressIntervalId = null;
    }

    // ✅ FIX ISSUE #4: Clean up audio element on destroy - safely handle missing methods
    if (this.audio) {
      const audioEl = this.audio as HTMLAudioElement;
      if (audioEl && typeof audioEl.pause === 'function') {
        audioEl.pause();
      }
      // Use try-catch for event listener cleanup in case method returns undefined
      try {
        audioEl.removeEventListener('ended', () => {});
      } catch (e) {
        // Ignore errors from event listener cleanup - element may be destroyed
      }
      this.logger.log('Audio element cleaned up in ngOnDestroy');
    }
  }
  // Template binding for repeat state all
  get repeat_state_all(): string {
    return String(this.audioPlaybackService.repeatStateAll);
  }

  setRepeatStateAll() {
    const currentState = Number(this.audioPlaybackService.repeatStateAll) || 0;

    // Handle wrap-around: after mode 3, reset to 0 (off)
    if (currentState >= 3) {
      this.audioPlaybackService.repeatStateAll = 0;
      this.logger.log('Repeat all turned off');
    } else {
      // Increment repeat count, cycling between 1, 2, 3
      this.audioPlaybackService.repeatStateAll = currentState + 1;
      this.logger.log(`Repeat all set to ${this.audioPlaybackService.repeatStateAll}`);
    }

    this.audioPlaybackService.repeatPlayedCountAll = 0;

    // Enforce exclusive repeat selection: repeat-all clears per-item repeats.
    this.clearPerItemRepeatStates();
  }
  init_loadNotifications(flag) {
    if (flag == 1) this.ionLoaderService.simpleLoader('Please wait...');

    const isNoNet = this.connectivityService.connectionType === 'none' ||
                     this.connectivityService.connectionType === 'unknown';

    if (isNoNet) {
      this.APIMessage = this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.';
      this.showNetworkOrAPIErrorMessage = 1;
    } else {
    }

    this.ionLoaderService.dismissLoader();
  }
      async onChangePlayTimeDirect(idx: number, obj: any) {
    if (!this.audioPlaybackService.playAll && this.audioPlaybackService.audioPlaying && typeof this.audioPlaybackService.currentAudioIndex === 'number') {
      if (idx != this.audioPlaybackService.currentAudioIndex) {
        this.todayAudioFiles[idx].ctime = obj.currentTarget.value;
        this.todayAudioFiles[idx].ctimeintime = this.audioCacheService.convertHMS(
          obj.currentTarget.value
        );
        this.todayAudioFiles[idx].durationintime = this.audioCacheService.convertHMS(
          parseInt(this.todayAudioFiles[idx].duration) -
            parseInt(obj.currentTarget.value)
        );
        // Use raw audio element from querySelector - works reliably on native Android
        const audioElement = this.getRawAudioElement();
        if (!audioElement) {
          this.logger.warn('onChangePlayTimeDirect: cannot seek without valid audio element');
          return;
        }
        this.audioPlaybackService.startAudioDirect(idx, audioElement, this.todayAudioFiles);
      } else {
        // ✅ FIX ISSUE #7: Use raw audio element for direct property access
        const audioEl = this.getRawAudioElement();
        if (!audioEl) {
          this.logger.warn('onChangePlayTimeDirect: cannot seek - invalid audio element');
          return;
        }
        audioEl.currentTime = obj.currentTarget.value;
        try {
          await audioEl.play();
        } catch (error: any) {
          this.logger.error('Error resuming audio after seek:', error);
        }
      }
    }
  }
  async openExternalURLDirectly(url: string, title: string, urlplace?: string) {
    if (url != '') {
      if (this.connectivityService.connectionType === 'none' || this.connectivityService.connectionType === 'unknown') {
        this.authservice?.showAlert('', '', this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.');
        return;
      }
      this.ionLoaderService.simpleLoader('Opening...');
      try {
        await Browser.open({
          url: url,
          toolbarColor: '#c94b18',
          presentationStyle: 'popover',
        });
        setTimeout(() => {
          this.ionLoaderService.dismissLoader();
        }, 1000);
      } catch (error) {
        this.ionLoaderService.dismissLoader();
        this.logger.error('Error opening URL:', error);
        this.authservice?.showAlert(
          'Error',
          '',
          'Failed to open the page. Please check your connection.'
        );
      }
    }
  }
  setStableErrorState(isError: boolean, message: string) {
    if (this.errorStateTimer) {
      clearTimeout(this.errorStateTimer);
      this.errorStateTimer = null;
    }
    if (isError) {
      const isServerErr =
        this.connectivityService.lastConnectivityResult &&
        message !== this.authservice?.noNetWorkMessage;
      if (isServerErr || message === this.authservice?.noNetWorkMessage) {
        this.APIMessage = message;
      }
      this.showNetworkOrAPIErrorMessage = 1;
      this.stableErrorDetected = false;
      this.errorStateTimer = setTimeout(() => {
        this.logger.log(
          'Error state stabilized - showing error message:',
          this.APIMessage
        );
        this.stableErrorDetected = true;
      }, 3000);
    } else {
      this.showNetworkOrAPIErrorMessage = 0;
      this.stableErrorDetected = false;
      this.APIMessage = '';
    }
  }
  async getAppVersionInfo() {
    try {
      const info = await App.getInfo();
      this.appversionText = info.version;
      this.logger.log('App version retrieved from Capacitor:', info.version);
    } catch (err) {
      this.logger.error('Error getting app version:', err);
      this.appversionText = '4.8.9';
    }
  }
  setupNetworkListeners() {
    this.logger.network('Setting up network listeners in HomePage');

    // Single network subscription with debouncing
    this.networkSubscription = this.connectivityService.subscribeToNetwork((isConnected) => {
        this.logger.network(
          'Stable network change detected to:',
          isConnected
        );

        if (isConnected) {
          this.logger.network('Stable network connectivity established');
          // Reset error state when network returns
          this.setStableErrorState(false, '');

          // Load audio if needed
          if (this.isTodayTabActive() && (this.audioLoadError || !this.todayAudioFiles?.length)) {
            this.logger.network('Network restored - loading audio content');
            this.loadAudioDirectly();
          }

          // Reload notifications after a delay
          setTimeout(() => {
            this.init_loadNotifications(0);
          }, 1000);
        } else {
          this.logger.network('Stable network connectivity lost');
          if (this.isTodayTabActive()) {
            this.setStableErrorState(
              true,
              this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.'
            );
          }

          // Try loading from cache if on audio tab (await not needed in non-async context)
          if (this.isTodayTabActive()) {
            this.isAudioLoading = false;
            this.audioLoadError = true;
            this.tryLoadFromCache();
          }
        }
      });
  }

  private isTodayTabActive(): boolean {
    return this.tabRowitemSelected === '0';
  }


  async tryLoadFromCache(): Promise<boolean> {
    this.logger.log('Attempting to load audio from cache...');

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // First, try to load from filesystem cache using AudioCacheService
    this.logger.log('Checking Capacitor filesystem cache...');
    const todayKey = `audio_${dateStr}`;
    const cachedAudio = await this.audioCacheService.getFromCache(todayKey);

    if (cachedAudio) {
      this.logger.log('Found audio from Capacitor filesystem cache');

      // Use actual data from localStorage that was saved with API response
      const cachedData = JSON.parse(localStorage.getItem('todayAudioCache') || '{}');
      const rawAudioData = cachedData.content?.audio || [];

      // Reconstruct audio data from cached files using per-item URLs from original API response
      const todayAudioFiles: any[] = [];
      for (let i = 0; i < this.authservice.audio_bibles?.length || 0; i++) {
        let type = 'bible';
        let title = 'Psalms';
        let url = '';

        // Use per-item data from original API if available, otherwise use cached URL
        if (rawAudioData[i]) {
          const item = rawAudioData[i];
          title = ['Psalms', 'Proverbs', 'Song'][i] || 'Unknown';
          type = ['Psalms', 'Proverbs', 'Song'][i] as string;
          url = item.url || cachedAudio.url;
        } else {
          // Fall back to single cached URL for all items (older cache format)
          title = ['Psalms', 'Proverbs', 'Song'][i] || 'Unknown';
          type = ['Psalms', 'Proverbs', 'Song'][i] as string;
          url = cachedAudio.url;
        }

        todayAudioFiles.push({
          id: `${type}_${dateStr}_${i}`,
          type: type,
          subtitle: title + ' - Today',
          url: url,
          duration: rawAudioData[i]?.duration || 0,
          durationintime: rawAudioData[i] ? this.audioCacheService.convertHMS(rawAudioData[i].duration) : '0:00',
          state: 'pause',
          ctime: 0,
          ctimeintime: '0:00',
          repeat_state: 0,
          repeat_played_count: 0,
        });
      }

      this.todayAudioFiles = todayAudioFiles;
      this.notificationsHomeCount = this.todayAudioFiles.length;

      // ✅ FIX ISSUE #4: Set audio source binding for cache-loaded data
      if (this.audioPlaybackService.audioPlaying && typeof this.audioPlaybackService.currentAudioIndex === 'number' && this.audioPlaybackService.currentAudioIndex < this.todayAudioFiles.length) {
        this.selectedAudioSource = this.todayAudioFiles[this.audioPlaybackService.currentAudioIndex].url;
      } else {
        this.selectedAudioSource = '';
      }

      // ✅ FIX: Use error=false since cache load was successful (offline mode)
      this.isAudioLoading = false;
      this.audioLoadError = false;
      this.setStableErrorState(
        false,
        'Using cached data from filesystem - no internet connection'
      );
      return true;
    } else {
      this.logger.log('No audio found in Capacitor cache, checking localStorage fallback...');

      // Fall back to localStorage-based cache for backward compatibility
      const cachedRaw = localStorage.getItem('todayAudioCache');
      if (!cachedRaw) {
        this.logger.log('No cached audio data found in localStorage either');
        return false;
      }
      let cacheEntry: any;
      try {
        cacheEntry = JSON.parse(cachedRaw);
      } catch (error) {
        this.logger.error('Cache data is corrupted, clearing it:', error);
        localStorage.removeItem('todayAudioCache');
        localStorage.removeItem('todayAudioCacheDate');
        return false;
      }
      if (!cacheEntry || typeof cacheEntry !== 'object') {
        this.logger.log('Invalid cache entry format, clearing');
        localStorage.removeItem('todayAudioCache');
        localStorage.removeItem('todayAudioCacheDate');
        return false;
      }
      const cachedDate = cacheEntry.cacheDate || '';
      if (cachedDate !== dateStr) {
        this.logger.log(`Cache date '${cachedDate}' doesn't match today '${dateStr}'`);
        return false;
      }
      const data = cacheEntry.content;
      if (!data || typeof data !== 'object') {
        this.logger.log('Cache content is invalid, clearing');
        localStorage.removeItem('todayAudioCache');
        localStorage.removeItem('todayAudioCacheDate');
        return false;
      }
      try {
        this.logger.log('Found valid cached audio data for today in localStorage');
        if (data.audio && Array.isArray(data.audio)) {
          // ✅ Convert raw cache data to the expected array format for UI with correct titles
          const todayAudioFiles: any[] = [];
          for (let i = 0; i < data.audio.length; i++) {
            // ✅ FIX ISSUE #2: Use position-based title mapping for consistency (no " - Today" suffix)
            const audioItem = data.audio[i];
            const displayName = ['Psalms', 'Proverbs', 'Song'][i] || (audioItem?.type || 'Unknown');

            todayAudioFiles.push({
              id: `${displayName.toLowerCase()}_${dateStr}_${i}`,
              type: displayName,
              subtitle: displayName,  // Show only title without " - Today" suffix
              url: audioItem?.url || '',
              duration: audioItem?.duration || 0,
              durationintime: audioItem ? this.audioCacheService.convertHMS(audioItem.duration) : '0:00',
              state: 'pause',
              ctime: 0,
              ctimeintime: '0:00',
              repeat_state: 0,
              repeat_played_count: 0,
            });
          }
          this.todayAudioFiles = todayAudioFiles;
          this.notificationsHomeCount = this.todayAudioFiles.length;

          // ✅ FIX ISSUE #4: Set audio source binding for localStorage cache-loaded data
          if (this.audioPlaybackService.audioPlaying && typeof this.audioPlaybackService.currentAudioIndex === 'number' && this.audioPlaybackService.currentAudioIndex < this.todayAudioFiles.length) {
            this.selectedAudioSource = this.todayAudioFiles[this.audioPlaybackService.currentAudioIndex].url;
          } else {
            this.selectedAudioSource = '';
          }

          // ✅ CRITICAL FIX: Reset loading flags when cache loads successfully
          this.isAudioLoading = false;
          this.audioLoadError = false;
          this.audioCacheService.processData(data);
          this.setStableErrorState(
            true,
            'Using cached data from localStorage - no internet connection'
          );
          return true;
        } else {
          this.logger.log('Cache has no valid audio array, discarding');
          localStorage.removeItem('todayAudioCache');
          localStorage.removeItem('todayAudioCacheDate');
          return false;
        }
      } catch (error) {
        this.logger.error('Error loading from cache:', error);
        localStorage.removeItem('todayAudioCache');
        localStorage.removeItem('todayAudioCacheDate');
        return false;
      }
    }
  }
  loadAudioDirectly() {
    // Skip if audio already loaded
    if (this.audioLoadInProgress) {
      this.logger.log(
        'Audio load already in progress - skipping duplicate request'
      );
      return;
    }

    if (this.todayAudioFiles && this.todayAudioFiles.length > 0) {
      this.logger.log('Audio already loaded - skipping reload');
      return;
    }

    // Set initial states
    this.audioLoadInProgress = true;
    this.isAudioLoading = true;
    this.audioLoadError = false;
    this.logger.log('Starting audio loading process...');

    // Set timeout for loading
    const audioLoadTimeout = setTimeout(() => {
      if (this.isAudioLoading) {
        this.logger.log('Audio loading timed out');
        this.isAudioLoading = false;
        this.audioLoadError = true;
        this.audioLoadInProgress = false;
        // Try cache before showing server error to avoid misleading "server down" on slow connections
        if (!this.tryLoadFromCache()) {
          const serverDownMessage = this.authservice?.serverDownMessage || 'Service temporarily not available. Please try again later.';
          this.setStableErrorState(true, serverDownMessage);
        }
      }
    }, 15000);

    // Prepare date for API request
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const apiUrl = `https://api.viviliam.com/api/audio?date=${dateStr}`;

    // Note: Using fetch instead of HTTP client for compatibility
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data: any) => {
        clearTimeout(audioLoadTimeout);
        this.audioLoadInProgress = false;
        // ✅ CRITICAL FIX: Reset loading flags on success
        this.isAudioLoading = false;
        this.audioLoadError = false;

        // Debug: Log raw API response structure
        this.logger.log('Raw API Response:', data);
        this.logger.log('API Response.audio array:', data.audio);

        // Check first item URL if available
        if (data.audio && data.audio.length > 0) {
          this.logger.log('First audio item URL:', data.audio[0].url);
        }

        const cacheEntry = { content: data, cacheDate: dateStr };
        localStorage.setItem('todayAudioCache', JSON.stringify(cacheEntry));

        // ✅ Convert raw API data to the expected array format for UI with correct titles
        const todayAudioFiles: any[] = [];
        if (data.audio && Array.isArray(data.audio)) {
          for (let i = 0; i < Math.min(Math.max(data.audio.length, this.authservice.audio_bibles?.length || 0), 3); i++) {
            // ✅ FIX ISSUE #2: Use position-based title mapping for consistency (no " - Today" suffix)
            const item = data.audio[i];
            const displayName = ['Psalms', 'Proverbs', 'Song'][i] || (item?.type || 'Unknown');

            todayAudioFiles.push({
              id: `${displayName.toLowerCase()}_${dateStr}_${i}`,
              type: displayName,
              subtitle: displayName,  // Show only title without " - Today" suffix
              url: item?.url || '',
              duration: item?.duration || 0,
              durationintime: item ? this.audioCacheService.convertHMS(item.duration) : '0:00',
              state: 'pause',
              ctime: 0,
              ctimeintime: '0:00',
              repeat_state: 0,
              repeat_played_count: 0,
            });
          }
        }
        this.todayAudioFiles = todayAudioFiles;
        this.notificationsHomeCount = this.todayAudioFiles.length;

        // ✅ FIX ISSUE #4: Set audio source binding for template reference
        if (this.audioPlaybackService.audioPlaying && typeof this.audioPlaybackService.currentAudioIndex === 'number' && this.audioPlaybackService.currentAudioIndex < this.todayAudioFiles.length) {
          this.selectedAudioSource = this.todayAudioFiles[this.audioPlaybackService.currentAudioIndex].url;
        } else {
          this.selectedAudioSource = '';
        }

        this.setStableErrorState(false, '');
      })
      .catch((error) => {
        clearTimeout(audioLoadTimeout);
        this.logger.error('HTTP error:', error);
        this.logger.error('Failed to load audio from API');

        // Try loading from cache if available; fall back to error if cache also fails
        if (!this.tryLoadFromCache()) {
          const isNoNet = this.connectivityService.connectionType === 'none' ||
                          this.connectivityService.connectionType === 'unknown';
          const errorMsg = isNoNet
            ? (this.authservice?.noNetWorkMessage || 'No internet connection. Please connect your device to the internet and try again.')
            : (this.authservice?.serverDownMessage || 'Service temporarily not available. Please try again later.');
          this.handleLoadingError(errorMsg);
        }
      });
  }

}
