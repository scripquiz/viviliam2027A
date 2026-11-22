import { HttpClient } from '@angular/common/http';
import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { IonContent, Platform } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { IonLoaderService } from '../ion-loader.service';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { App } from '@capacitor/app';
import { WakeLockService } from '../services/wake-lock.service';
import { NetworkService } from '../services/network.service';
import { Browser } from '@capacitor/browser';
import { LoggerService } from '../services/logger.service';
import { DarkModeService } from '../services/dark-mode.service';
import { AudioFocusService } from '../services/audio-focus.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AudioCacheService } from '../core/audio-cache.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class HomePage {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('audioPlayer') audio: any;
  private lastConnectivityResult: boolean = false;
  private lastConnectivityCheck: number = 0;
  private connectivityCacheDuration: number = 30000; // 30 seconds
  public networkSubscription: any;
  private networkStateChangeDebounceTime = 3000; // 3 seconds
  private networkDebounceTimer: any = null;
  private audioProgressIntervalId: any = null;
  private lastReportedNetworkState: boolean | null = null;

  // Network quality states: excellent, good, fair, poor
  public connectionQuality: string = 'unknown';

  public slideOpts = {
    initialSlide: 0,
    speed: 300,
    effect: 'flip',
    autoplay: { delay: 5000 },
    allowTouchMove: false,
  };
  public APIMessage: any = '';
  public todayDate: any = '';
  public database: DatabaseConnection;
  public unread: any = 0;
  public todayTabSelected: any = 'today';
  public notificationsTabSelected: any = '';
  public tabRowitemSelected: any = '0';
  public orientation: any;
  public isNetworkAvailable: any = 0;
  public notificationsHomeCount: any;
  public selectedAudioSource: any = '';
  public currentAudioIndex: any = 0;
  public audioPlaying: any;
  public playAll: any = false;
  public playAllText: any = 'Play All';
  public notificationUpdateIndex: any = 0;
  public appversionText: any = '';
  public resumeListener: any;
  public pauseListener: any;
  public repeat_state_all: any = 0;
  public repeat_played_count_all: any = 0;
  public showNetworkOrAPIErrorMessage: any = 0;
  public todayAudioFiles: any[] = [];
  public isAudioLoading: boolean = true;
  public audioLoadError: boolean = false;
  public hasInternetConnection: boolean = true;
  public errorStateTimer: any = null;
  public stableErrorDetected: boolean = false;
  private isActivelyTesting: boolean = false;
  private _skipNetworkCheck: boolean = false;
  private audioLoadInProgress: boolean = false;
  public get isServerError(): boolean {
    return this.APIMessage === this.authservice.serverDownMessage;
  }
  public segmentSelected: string = '0';
  public isDarkMode: boolean = false;
  private darkModeSubscription: any;
  constructor(
    private http: HttpClient,
    public network: NetworkService,
    private wakeLockService: WakeLockService,
    private screenorientation: ScreenOrientationService,
    private ionLoaderService: IonLoaderService,
    public menuCtrl: MenuController,
    private authservice: AuthserviceProvider,
    private platform: Platform,
    private databaseService: DatabaseService,
    private logger: LoggerService,
    private darkModeService: DarkModeService,
    private audioFocusService: AudioFocusService,
    private audioCacheService: AudioCacheService
  ) {
    this.errorStateTimer = null;
    this.stableErrorDetected = false;
    this.todayDate = Date.now();
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
        this.resumeListener = this.platform.resume.subscribe(() => {
          this.notificationUpdateIndex = 0;
          this.logger.network('App resumed - checking active connectivity');
          this.testActiveConnectivity().then((isConnected) => {
            if (isConnected) {
              this.logger.network(
                'Active connectivity test passed - loading content'
              );
              this.setStableErrorState(false, '');
              if (!this.audioPlaying) {
                if (this.audioLoadError) {
                  this.loadAudioDirectly();
                }
              }
            } else {
              this.logger.network(
                'Active connectivity test failed - setting error state'
              );
              this.setStableErrorState(true, this.authservice.noNetWorkMessage);
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
              if (this.audioPlaying) {
                const activeAudioArray = this.todayAudioFiles;
                if (
                  activeAudioArray &&
                  activeAudioArray.length > 0 &&
                  this.currentAudioIndex < activeAudioArray.length
                ) {
                  // Fix #1: Removed unreliable time-based threshold check (duration - 0.5)
                  // The native 'ended' event listener is the primary signal for audio completion
                  // Polling now only handles progress tracking, not endpoint detection
                    activeAudioArray[this.currentAudioIndex].ctime = parseInt(
                      this.audio.nativeElement.currentTime.toString()
                    );
                    activeAudioArray[this.currentAudioIndex].ctimeintime =
                      this.convertHMS(
                        parseInt(
                          this.audio.nativeElement.currentTime.toString()
                        )
                      );
                    activeAudioArray[this.currentAudioIndex].durationintime =
                      this.convertHMS(
                        parseInt(
                          activeAudioArray[this.currentAudioIndex].duration
                        ) -
                          parseInt(
                            this.audio.nativeElement.currentTime.toString()
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
    const connectionType = this.network.connectionType;
    if (connectionType !== 'none' && connectionType !== 'unknown') {
      this.setStableErrorState(true, this.authservice.serverDownMessage);
      this.logger.log('Setting server error flag for audio loading');
    } else {
      this.setStableErrorState(true, this.authservice.noNetWorkMessage);
    }
    this.logger.log('Falling back to database audio loading');
  }
  playAllAudiosDirect() {
    if (this.playAll) {
      this.playAll = false;
      this.audio.nativeElement.pause();
      this.audioPlaying = false;
      this.playAllText = 'Play All';
      this.stopAllAudioDirect();
      // Wake lock is released in stopAllAudioDirect
    } else {
      for (var i = 0; i < this.todayAudioFiles.length; i++) {
        this.todayAudioFiles[i].repeat_state = 0;
        this.todayAudioFiles[i].repeat_played_count = 0;
        this.todayAudioFiles[i].state = 'pause';
        this.todayAudioFiles[i].ctime = 0;
        this.todayAudioFiles[i].ctimeintime = '0:00';
        this.todayAudioFiles[i].durationintime = this.convertHMS(
          parseInt(this.todayAudioFiles[i].duration)
        );
      }
      this.playAll = true;
      this.currentAudioIndex = 0;
      this.repeat_played_count_all = 0;
      this.startAudioDirect(0);
      this.playAllText = 'Stop Playing';
      this.wakeLockService.keepAwake().then(
        () => {},
        () => this.logger.log('error keeping device awake')
      );
    }
  }
  stopAllAudioDirect() {
    for (var i = 0; i < this.todayAudioFiles.length; i++) {
      this.todayAudioFiles[i].repeat_state = 0;
      this.todayAudioFiles[i].repeat_played_count = 0;
      this.todayAudioFiles[i].state = 'pause';
      this.todayAudioFiles[i].ctime = 0;
      this.todayAudioFiles[i].ctimeintime = '0:00';
      this.todayAudioFiles[i].durationintime = this.convertHMS(
        this.todayAudioFiles[i].duration
      );
    }
    this.playAll = false;
    this.currentAudioIndex = 0;
    this.playAllText = 'Play All';
    this.audio.nativeElement.pause();
    this.audioPlaying = false;
    this.audioFocusService.releaseFocus('home');
    // Release wake lock when stopping all audio
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
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
    this.stopAudioDirect(this.currentAudioIndex);
    const currentRepeatState =
      Number(this.todayAudioFiles[i].repeat_state) || 0;
    const nextRepeatState =
      currentRepeatState >= 3 ? 0 : currentRepeatState + 1;

    // Only one repeat can be active at a time across daily audio.
    this.repeat_state_all = 0;
    this.repeat_played_count_all = 0;
    this.clearPerItemRepeatStates(i);
    this.todayAudioFiles[i].repeat_state = nextRepeatState;
  }

  private stopHomeAudioPlayback(): void {
    const audioElement = this.audio?.nativeElement;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    this.audioPlaying = false;
    this.playAll = false;
    this.playAllText = 'Play All';
    this.audioFocusService.releaseFocus('home');

    if (Array.isArray(this.todayAudioFiles)) {
      this.todayAudioFiles.forEach((item) => {
        item.state = 'pause';
      });
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
    this.menuCtrl.enable(false);
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

    // Release wake lock when leaving the page
    if (this.wakeLockService.isActive()) {
      this.wakeLockService
        .allowSleepAgain()
        .then(() => this.logger.log('Wake lock released on page leave'))
        .catch(() => this.logger.log('Wake lock release failed on page leave'));
    }
  }

  ionViewDidEnter() {
    if (this.isTodayTabActive()) {
      this.loadAudioDirectly();
    }

    this.testConnectionOnStartup().then((isConnected) => {
      this.logger.network(
        'Comprehensive connectivity check result:',
        isConnected
      );
      if (isConnected) {
        this.logger.network(
          'Active internet connection confirmed - initializing page'
        );
        // Clear stale localStorage cache when network is available to force fresh API fetch
        localStorage.removeItem('todayAudioCache');
        localStorage.removeItem('todayAudioCacheDate');
        this.logger.log('Cleared audio cache - will fetch fresh data from API');
        this.isNetworkAvailable = '1';
        this.hasInternetConnection = true;
        this.setStableErrorState(false, '');
        if (this.isTodayTabActive()) {
          this.loadAudioDirectly();
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
    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          this.logger.log('DB created');
          this.database = db;
        });
    });
    this.logger.log('View did enter');
    this.segmentSelected = this.tabRowitemSelected.toString();
  }
  segmentChanged(event) {
    this.segmentSelected = event.detail.value;
    this.selectRowTaIte(parseInt(this.segmentSelected).toString());
  }
  selectRowTaIte(tabitem) {
    this.tabRowitemSelected = tabitem;
    this.segmentSelected = tabitem.toString();
    if (tabitem.toString() === '0') {
      this.todayTabSelected = 'today';
      this.notificationsTabSelected = '';
      this.checkNetworkForAudio();
    } else if (tabitem.toString() === '1') {
      this.unread = 0;
      this.notificationsTabSelected = 'notifications';
      this.todayTabSelected = '';
      this.showNetworkOrAPIErrorMessage = 0;
      if (this.network && this.network.hasInternetConnectivity) {
        this.logger.log('Misc tab selected - ensuring content visibility');
      }
    } else if (tabitem.toString() === '2') {
      this.notificationsTabSelected = '';
      this.todayTabSelected = '';
      this.showNetworkOrAPIErrorMessage = 0;
    }
  }
  convertHMS(value) {
    const sec = parseInt(value, 10);
    var hours: any = Math.floor(sec / 3600);
    var minutes: any = Math.floor((sec - hours * 3600) / 60);
    var seconds: any = sec - hours * 3600 - minutes * 60;
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (minutes < 10) {
      minutes = minutes;
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    if (hours == '00') return minutes + ':' + seconds;
    else return hours + ':' + minutes + ':' + seconds;
  }
  ngOnDestroy() {
    this.audioFocusService.releaseFocus('home');
    this.audioFocusService.unregisterOwner('home');

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
  }
  padLeadingZeros(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }
  setRepeatStateAll() {
    this.repeat_state_all = (Number(this.repeat_state_all) || 0) + 1;
    if (this.repeat_state_all > 3) this.repeat_state_all = 0;
    this.repeat_played_count_all = 0;

    // Enforce exclusive repeat selection: repeat-all clears per-item repeats.
    this.clearPerItemRepeatStates();

    this.logger.log(`Repeat all set to ${this.repeat_state_all}`);
  }
  init_loadNotifications(flag) {
    if (flag == 1) this.ionLoaderService.simpleLoader('Please wait...');
    let type = this.network.connectionType;
    if (type == 'unknown' || type == 'none' || type == undefined) {
      this.isNetworkAvailable = 0;
      this.APIMessage = this.authservice.noNetWorkMessage;
      this.showNetworkOrAPIErrorMessage = 1;
    } else {
      this.isNetworkAvailable = '1';
    }
    this.ionLoaderService.dismissLoader();
  }
  playAudioDirect(idx, caption, state) {
    var tempdta;
    this.wakeLockService.keepAwake().then(
      () => (tempdta = ''),
      () => this.logger.error('error')
    );
    this.playAll = false;
    this.playAllText = 'Play All';
    this.startAudioDirect(idx);
    localStorage.setItem(
      `audio_played_${this.todayAudioFiles[idx].id}`,
      'true'
    );
  }
  async startAudioDirect(idx) {
    this.audioFocusService.requestFocus('home');

    this.currentAudioIndex = idx;
    for (var i = 0; i < this.todayAudioFiles.length; i++) {
      this.todayAudioFiles[i].state = 'pause';
    }
    this.todayAudioFiles[idx].state = 'play';
    this.wakeLockService
      .keepAwake()
      .then(() => this.logger.log('Wake lock acquired for audio playback'))
      .catch(() => this.logger.log('Wake lock acquisition failed'));
    const audioElement = this.audio?.nativeElement;
    if (!audioElement) {
      this.logger.error('Audio element is not available');
      return;
    }

    this.selectedAudioSource = this.todayAudioFiles[idx].url;
    audioElement.preload = 'auto';
    audioElement.src = this.todayAudioFiles[idx].url;
    audioElement.load();

    // Wait until the browser has buffered enough data to play without stopping.
    const canPlay = new Promise<void>((resolve) => {
      const onCanPlay = () => {
        audioElement.removeEventListener('canplaythrough', onCanPlay);
        resolve();
      };
      audioElement.addEventListener('canplaythrough', onCanPlay, { once: true });
    });

    // Fallback timeout so we don't block indefinitely if the event never fires.
    const readyTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, 2000)
    );

    await Promise.race([canPlay, readyTimeout]);

    // Also capture duration from metadata even if canplaythrough fires first.
    audioElement.onloadedmetadata = () => {
      const actualDuration = audioElement.duration;
      this.todayAudioFiles[idx].duration = actualDuration;
      this.todayAudioFiles[idx].durationintime = this.convertHMS(
        Math.floor(actualDuration)
      );
    };

    audioElement.currentTime = this.todayAudioFiles[idx].ctime;
    try {
      await audioElement.play();
    } catch (error: any) {
      this.logger.error('Error starting audio playback:', error);
    }
    this.audioPlaying = true;
    // Reset wake lock activity timer on audio play
    this.wakeLockService.resetActivity();
    audioElement.onended = () => {
      this.handleAudioEnded();
    };
  }
  async handleAudioEnded() {
    // Fix #2: Validate that playback actually completed before advancing track
    const audio = this.audio.nativeElement;
    const isBufferedComplete = audio.buffered && audio.buffered.length > 0;
    const bufferedEnd = isBufferedComplete ? audio.buffered.end(audio.buffered.length - 1) : null;
    const currentPos = audio.currentTime;

    // Only advance track if: buffer is complete OR we're at the end of natural content
    // (buffering ended naturally, not cut short by network issues)
    const shouldAdvance =
      !isBufferedComplete || // No buffered data - likely ended normally
      (bufferedEnd === currentPos && bufferedEnd < audio.duration); // Buffered to actual end

    if (!shouldAdvance) {
      this.logger.warn(
        'Audio ended but may not have completed playback fully. Buffer state: ' +
          `currentTime=${currentPos}, bufferedEnd=${bufferedEnd}, duration=${audio.duration}`
      );
      // Re-trigger playback from current position if buffering was incomplete
      try {
        await audio.play();
        this.logger.log('Replaying audio due to incomplete buffer');
      } catch (error: any) {
        this.logger.error('Error replaying audio:', error);
      }
      return; // Don't advance track
    }

    const activeAudioArray = this.todayAudioFiles;
    activeAudioArray[this.currentAudioIndex].ctime = 0;
    activeAudioArray[this.currentAudioIndex].ctimeintime = '0:00';
    activeAudioArray[this.currentAudioIndex].durationintime = this.convertHMS(
      parseInt(activeAudioArray[this.currentAudioIndex].duration)
    );
    if (this.playAll) {
      if (this.currentAudioIndex < activeAudioArray.length - 1) {
        this.logger.log(`Moving to next track: ${this.currentAudioIndex + 1}`);
        this.currentAudioIndex++;
        this.startAudioDirect(this.currentAudioIndex);
      } else {
        this.logger.log(
          `End of playlist reached. Repeat count: ${this.repeat_played_count_all}/${this.repeat_state_all}`
        );
        if (
          this.repeat_state_all > 0 &&
          this.repeat_played_count_all < this.repeat_state_all
        ) {
          this.repeat_played_count_all++;
          this.logger.log(`Starting repeat ${this.repeat_played_count_all}`);
          this.currentAudioIndex = 0;
          this.startAudioDirect(0);
        } else {
          this.stopAudioDirect(this.currentAudioIndex);
          this.playAll = false;
          this.playAllText = 'Play All';
          this.repeat_played_count_all = 0;
        }
      }
    } else if (activeAudioArray[this.currentAudioIndex].repeat_state > 0) {
      if (
        activeAudioArray[this.currentAudioIndex].repeat_played_count <
        activeAudioArray[this.currentAudioIndex].repeat_state
      ) {
        activeAudioArray[this.currentAudioIndex].repeat_played_count++;
        this.audio.nativeElement.currentTime = 0;
        try {
          await this.audio.nativeElement.play();
        } catch (error: any) {
          this.logger.error('Error replaying audio:', error);
        }
        // Re-acquire wake lock and reset inactivity timer for per-item repeat
        await this.wakeLockService.keepAwake();
        this.wakeLockService.resetActivity();
      } else {
        this.stopAudioDirect(this.currentAudioIndex);
        activeAudioArray[this.currentAudioIndex].repeat_state = 0;
        activeAudioArray[this.currentAudioIndex].repeat_played_count = 0;
      }
    } else {
      this.stopAudioDirect(this.currentAudioIndex);
    }
  }
  stopAudioDirect(idx) {
    this.todayAudioFiles[idx].state = 'pause';
    this.audio.nativeElement.pause();
    this.audioPlaying = false;
    this.playAll = false;
    this.playAllText = 'Play All';
    this.audioFocusService.releaseFocus('home');
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }
  async onChangePlayTimeDirect(idx, obj) {
    if (!this.playAll && this.audioPlaying) {
      if (idx != this.currentAudioIndex) {
        this.todayAudioFiles[idx].ctime = obj.currentTarget.value;
        this.todayAudioFiles[idx].ctimeintime = this.convertHMS(
          obj.currentTarget.value
        );
        this.todayAudioFiles[idx].durationintime = this.convertHMS(
          parseInt(this.todayAudioFiles[idx].duration) -
            parseInt(obj.currentTarget.value)
        );
        this.startAudioDirect(idx);
      } else {
        this.audio.nativeElement.currentTime = obj.currentTarget.value;
        try {
          await this.audio.nativeElement.play();
        } catch (error: any) {
          this.logger.error('Error resuming audio after seek:', error);
        }
      }
    }
  }
  async openExternalURLDirectly(url: string, title: string, urlplace?: string) {
    if (url != '') {
      const connectionType = this.network.connectionType;
      if (connectionType === 'none' || connectionType === 'unknown') {
        this.authservice.showAlert('', '', this.authservice.noNetWorkMessage);
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
        this.authservice.showAlert(
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
        this.network.hasInternetConnectivity &&
        message !== this.authservice.noNetWorkMessage;
      if (isServerErr || message === this.authservice.noNetWorkMessage) {
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

    // Initial connectivity state
    this.hasInternetConnection = this.network.isConnected;
    this.isNetworkAvailable = this.network.isConnected ? '1' : '0';
    this.lastReportedNetworkState = this.network.isConnected;

    // Single network subscription with debouncing
    this.networkSubscription = this.network.actualConnectivity$.subscribe(
      (hasConnectivity) => {
        this.logger.network(
          'Raw network state change detected:',
          hasConnectivity
        );

        // Don't respond to rapid fluctuations - use debouncing
        if (this.networkDebounceTimer) {
          clearTimeout(this.networkDebounceTimer);
        }

        this.networkDebounceTimer = setTimeout(() => {
          // Only process if the state is different from last reported state
          if (this.lastReportedNetworkState !== hasConnectivity) {
            this.logger.network(
              'Stable network change detected to:',
              hasConnectivity
            );
            this.lastReportedNetworkState = hasConnectivity;

            // Update network state properties
            this.hasInternetConnection = hasConnectivity;
            this.isNetworkAvailable = hasConnectivity ? '1' : '0';

            if (hasConnectivity) {
              this.logger.network('Stable network connectivity established');
              this.setStableErrorState(false, '');

              // Load audio if needed
              if (
                this.isTodayTabActive() &&
                (this.audioLoadError || !this.todayAudioFiles?.length)
              ) {
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
                  this.authservice.noNetWorkMessage
                );
              }

              // Try loading from cache if on audio tab
              if (this.isTodayTabActive()) {
                this.isAudioLoading = false;
                this.audioLoadError = true;
                this.tryLoadFromCache();
              }
            }
          }
        }, this.networkStateChangeDebounceTime);
      }
    );
  }

  private isTodayTabActive(): boolean {
    return this.tabRowitemSelected?.toString() === '0';
  }
  checkNetwork(
    options: {
      source?: string;
      priority?: boolean;
      loadAudio?: boolean;
      showLoader?: boolean;
      timeout?: number;
    } = {}
  ): Promise<boolean> {
    // Set defaults
    const {
      source = 'general',
      priority = false,
      loadAudio = false,
      showLoader = false,
      timeout = 10000,
    } = options;

    this.logger.network(
      `Network check (${source}${priority ? ', priority' : ''})`
    );

    // Check if we can use cached result
    const now = Date.now();
    if (
      !priority &&
      now - this.lastConnectivityCheck < this.connectivityCacheDuration
    ) {
      this.logger.network(
        `Using cached connectivity result (${
          now - this.lastConnectivityCheck
        }ms old): ${this.lastConnectivityResult}`
      );

      // Still trigger appropriate actions based on cached result
      if (loadAudio) {
        this.handleNetworkResult(this.lastConnectivityResult, loadAudio);
      }

      return Promise.resolve(this.lastConnectivityResult);
    }

    // Prevent multiple simultaneous checks
    if (this.isActivelyTesting && !priority) {
      this.logger.network(
        `Network check already in progress (${source}) - using cached state`
      );
      return Promise.resolve(this.network.isConnected);
    }

    // Skip if explicitly configured to do so (for testing)
    if (this._skipNetworkCheck) {
      this.logger.network(
        `Network check skipped per configuration (${source})`
      );
      return Promise.resolve(true);
    }

    // Show loader if requested
    if (showLoader) {
      this.ionLoaderService.simpleLoader('Checking connection...');
    }

    this.isActivelyTesting = true;

    // Basic check - if device reports no connection, don't bother with full check
    if (!this.network.isConnected) {
      this.logger.network(`Device reports disconnected (${source})`);
      this.handleNetworkResult(false, loadAudio);
      this.isActivelyTesting = false;
      if (showLoader) this.ionLoaderService.dismissLoader();

      // Update cached result
      this.lastConnectivityCheck = now;
      this.lastConnectivityResult = false;

      return Promise.resolve(false);
    }

    // Track timeout ID for proper cleanup
    let timeoutId: any = null;

    // Set up timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => {
        if (this.isActivelyTesting) {
          this.logger.network(`Network check timed out (${source})`);

          // Update cached result for timeouts
          this.lastConnectivityCheck = Date.now();
          this.lastConnectivityResult = false;

          resolve(false);
        }
      }, timeout);
    });

    // Perform actual connectivity check
    const checkPromise = this.network
      .forceConnectivityCheck()
      .then((isConnected) => {
        this.logger.network(`Network check result (${source}): ${isConnected}`);

        // Update cached result
        this.lastConnectivityCheck = Date.now();
        this.lastConnectivityResult = isConnected;

        return isConnected;
      })
      .catch((error) => {
        this.logger.error(`Network check error (${source}):`, error);

        // Update cached result for errors
        this.lastConnectivityCheck = Date.now();
        this.lastConnectivityResult = false;

        return false;
      });

    // Race between timeout and actual check
    return Promise.race([checkPromise, timeoutPromise]).then((isConnected) => {
      // Clear timeout if it was created
      if (timeoutId) clearTimeout(timeoutId);

      this.isActivelyTesting = false;
      if (showLoader) this.ionLoaderService.dismissLoader();
      this.handleNetworkResult(isConnected, loadAudio);
      return isConnected;
    });
  }

  testConnectionOnStartup(): Promise<boolean> {
    return this.checkNetwork({
      source: 'startup',
      priority: true,
    });
  }

  checkNetworkForAudio(): Promise<boolean> {
    return this.checkNetwork({
      source: 'audio',
      loadAudio: true,
    });
  }

  testActiveConnectivity(): Promise<boolean> {
    return this.checkNetwork({
      source: 'resume',
      priority: true,
    });
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

      // Reconstruct audio data from cached files
      const todayAudioFiles: any[] = [];
      for (let i = 0; i < this.authservice.audio_bibles?.length || 0; i++) {
        const type = ['bible', 'prayer', 'quote'][i] as string;
        // Use the cached audio file URL directly from filesystem
        todayAudioFiles.push({
          id: `${type}_${dateStr}_${i}`,
          type: type,
          subtitle: `${type} - Today`,
          url: cachedAudio.url,
          duration: 0, // Will be populated when audio metadata loads
          durationintime: '0:00',
          state: 'pause',
          ctime: 0,
          ctimeintime: '0:00',
          repeat_state: 0,
          repeat_played_count: 0,
        });
      }

      this.todayAudioFiles = todayAudioFiles;
      this.notificationsHomeCount = this.todayAudioFiles.length;
      this.isAudioLoading = false;
      this.audioLoadError = true;
      this.setStableErrorState(
        true,
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
          this.processNewAudioData(data, dateStr);
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
        this.setStableErrorState(true, this.authservice.serverDownMessage);
      }
    }, 15000);

    // Prepare date for API request
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const apiUrl = `https://api.viviliam.com/api/audio?date=${dateStr}`;

    // Make API request
    this.http.get(apiUrl).subscribe(
      (data: any) => {
        clearTimeout(audioLoadTimeout);
        this.audioLoadInProgress = false;
        this.logger.log('Received audio data from API');
        try {
          const cacheEntry = { content: data, cacheDate: dateStr };
          localStorage.setItem('todayAudioCache', JSON.stringify(cacheEntry));
          this.processNewAudioData(data, dateStr);
          this.setStableErrorState(false, '');
        } catch (error) {
          this.logger.error('Error processing API response:', error);
          this.isAudioLoading = false;
          this.audioLoadError = true;
          this.setStableErrorState(true, this.authservice.serverDownMessage);
        }
      },
      (error) => {
        clearTimeout(audioLoadTimeout);
        this.audioLoadInProgress = false;
        this.logger.error('HTTP error:', error);
        // Retry once for transient failures (short timeout to avoid long waits)
        let retried = false;
        const retry = () => {
          if (retried) {
            this.logger.log('Retry failed - falling back to cache');
            this.isAudioLoading = false;
            this.audioLoadError = true;
            this.setStableErrorState(true, this.authservice.serverDownMessage);
            this.tryLoadFromCache();
            return;
          }
          retried = true;
          this.logger.log('Retrying API request...');
          this.http.get(apiUrl).subscribe(
            (retryData: any) => {
              clearTimeout(audioLoadTimeout);
              this.audioLoadInProgress = false;
              this.logger.log('Retry succeeded - received audio data from API');
              try {
                const cacheEntry = { content: retryData, cacheDate: dateStr };
                localStorage.setItem('todayAudioCache', JSON.stringify(cacheEntry));
                this.processNewAudioData(retryData, dateStr);
                this.setStableErrorState(false, '');
              } catch (retryError) {
                this.logger.error('Error processing API response on retry:', retryError);
                this.isAudioLoading = false;
                this.audioLoadError = true;
                this.setStableErrorState(true, this.authservice.serverDownMessage);
              }
            },
            (retryError) => {
              clearTimeout(audioLoadTimeout);
              this.logger.error('Retry also failed:', retryError);
              retried = false; // prevent infinite loops
              retry(); // final fallback
            }
          );
        };
        retry();
      }
    );
  }
  processNewAudioData(data, dateStr) {
    this.logger.log(`Processing new API audio data for date: ${dateStr}`);
    try {
      const todaysAudio = [];
      if (data.audio && Array.isArray(data.audio)) {
        this.logger.log(`Found ${data.audio.length} audio items from new API`);
        data.audio.forEach((item, index) => {
          this.logger.log(`Processing ${item.type} audio for today`);
          // Skip items with invalid URLs to prevent silent playback failures
          const url = item.url || '';
          if (!url || typeof url !== 'string' || !url.trim()) {
            this.logger.warn(`Skipping audio item ${index} (${item.type}) - invalid URL`);
            return;
          }
          todaysAudio.push({
            id: item.type + '_' + dateStr + '_' + index,
            type: item.type,
            subtitle: item.type + ' - ' + item.formattedDuration,
            url: url,
            duration: parseInt(item.duration || '0'),
            durationintime:
              item.formattedDuration ||
              this.convertHMS(parseInt(item.duration || '0')),
            state: 'pause',
            ctime: 0,
            ctimeintime: '0:00',
            repeat_state: 0,
            repeat_played_count: 0,
          });
        });
        if (todaysAudio.length > 0) {
          this.todayAudioFiles = todaysAudio;
          this.notificationsHomeCount = this.todayAudioFiles.length;
          this.isAudioLoading = false;
          this.audioLoadError = false;
          this.logger.log(
            `Successfully loaded ${todaysAudio.length} audio files from new API`
          );
        } else {
          this.logger.log('No audio items found in API response');
          this.handleLoadingError('No audio found for today');
        }
      } else {
        this.logger.log('Invalid API response format');
        this.handleLoadingError('Invalid API response');
      }
    } catch (error) {
      this.logger.error('Error processing new API data:', error);
      this.handleLoadingError('API processing error');
    }
  }

  private handleNetworkResult(isConnected: boolean, loadAudio: boolean): void {
    // Update app state based on connectivity
    if (isConnected) {
      this.isNetworkAvailable = '1';
      this.hasInternetConnection = true;
      this.setStableErrorState(false, '');

      // Load audio if requested and needed
      if (loadAudio && (this.audioLoadError || !this.todayAudioFiles?.length)) {
        this.logger.network('Network available - loading audio content');
        this.loadAudioDirectly();
      }
    } else {
      this.isNetworkAvailable = '0';
      this.hasInternetConnection = false;
      this.APIMessage = this.authservice.noNetWorkMessage;
      this.setStableErrorState(true, this.authservice.noNetWorkMessage);

      // Try loading from cache if audio was requested
      if (loadAudio) {
        this.isAudioLoading = false;
        this.audioLoadError = true;
        this.tryLoadFromCache();
      }
    }
  }
}
