import {
  ViewEncapsulation,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController, IonContent } from '@ionic/angular';

import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { ShareService } from '../providers/share.service';

// Replace Cordova Clipboard with Capacitor Clipboard
import { Clipboard } from '@capacitor/clipboard';

import { MenuController } from '@ionic/angular';
// Replace Cordova ScreenOrientation with our Capacitor service
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { ViewportScroller } from '@angular/common';

import { AppComponent } from '../../app/app.component';

// Replace Insomnia with WakeLockService
import { WakeLockService } from '../services/wake-lock.service';
// Replace Cordova Network with NetworkService
import { NetworkService } from '../services/network.service';
// Replace Cordova Toast with Capacitor Toast
import { Toast } from '@capacitor/toast';
import { DarkModeService } from '../services/dark-mode.service';
import { Subscription } from 'rxjs';
import { AudioFocusService } from '../services/audio-focus.service';

@Component({
  selector: 'app-read',
  templateUrl: './read.page.html',
  styleUrls: ['./read.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ReadPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('audio') audio;
  @ViewChild('header') header: HTMLElement;
  public selectedBook: any = '.';
  public database: DatabaseConnection;
  public timeSpan: any;
  public voiceOverLength: number;
  public voiceOverState: number = 0;
  public voiceOverStarted: number = 0;
  public voiceOverReadingVerse: number = 0;
  public voice_over_current: any = '';
  public audioplaying: any = 'voiceover_notplaying';
  public showBottomNav: any = 'opacityshow'; //"opacityhide";
  public lastScrollTop: any = 0;
  public versData: any = '';
  public totalChapters: any;
  public totalBooks: any;
  public currentBook: any = 1;
  public currentChapter: any = 1;
  public showPrevNav: any = 'showfull';
  public showNextNav: any = 'showfull';
  public selectedVersion: any;
  public isDarkMode: boolean = false;
  public selection: boolean = false;
  public selectedTheme: any = '';
  public isAudioAvailable: any = 0;
  public isAudioPlaying: any = 0;
  public audioid: any;
  public isAudioDisplay: any = 0;
  public isBookLoaded: any = 0;
  public paragraphModeClass = 'normal';
  public textSizeCSS: any;
  public booktitlefont: any;
  public orientation: any;
  public readMode: any;

  public hideIfVerseMode: any = 'hideVerseNav';
  public prevflag: any = 'disabled';
  public nextflag: any = 'enabled';
  public pageloaded = 'no';
  public bookmarkicon = '';
  public popovermenu: any = 'read-popovermenu-hide';
  public font: any = '';
  public titlefont = '';
  public verseSpacing = '';
  public verseNumberSize = '';
  public resumeListener: any;
  public pauseListener: any;
  public selected_verse_notes: any;
  public selected_verse_notes_id: any;
  public show_notes_pop: any = 0;
  public is_audio_available: any = 0;
  public selected_bible_language: any;
  public online: any = true;
  public isAutoScroll: any = false;
  public isNavigated: any = false;
  public maximize_screen: any = 0;
  private suppressHeaderToggleUntil = 0;
  private progressInterval: any;
  private darkModeSubscription: Subscription;

  constructor(
    public darkModeService: DarkModeService,
    public renderer: Renderer2,
    public network: NetworkService,
    public wakeLock: WakeLockService,
    public scroller: ViewportScroller,
    public appComponent: AppComponent,
    public screenorientation: ScreenOrientationService,
    public menuCtrl: MenuController,
    public shareService: ShareService,
    public router: Router,
    public databaseService: DatabaseService,
    public platform: Platform,
    public authservice: AuthserviceProvider,
    public navctrl: NavController,
    private audioFocusService: AudioFocusService
  ) {
    // Note: Removed toast from constructor parameters since Capacitor plugins don't need DI

    console.log('Constructor calleing :' + authservice.timerState);
    this.selectedTheme = this.authservice.selectedTheme;
    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    this.audioFocusService.registerOwner('read', () => {
      this.stopReadAudioPlayback();
    });
    this.platform.ready().then(() => {
      // watch network for a disconnection
      this.network.disconnected$.subscribe(() => {
        console.log('network was disconnected :-(');
        this.appComponent.networkState = 0;
        this.appComponent.networkState = 0;
        this.online = false;
        if (this.isAudioPlaying == 1) {
          // Updated to use Capacitor Toast
          Toast.show({
            text: 'Network disconnected!, Audio may be interrupted',
            duration: 'short',
            position: 'center',
          });
        }
      });

      // watch network for a connection
      this.network.connected$.subscribe(() => {
        console.log('network connected!');
        this.appComponent.networkState = 1;
        this.online = true;
      });

      if (
        this.authservice.audio_bibles.indexOf(
          this.authservice.defaultBibleId
        ) !== -1
      ) {
        this.is_audio_available = 1;
      } else {
        this.is_audio_available = 0;
      }
      console.log('Is audio available :' + this.is_audio_available);
      this.resumeListener = this.platform.resume.subscribe(() => {
        console.log('**** RESUME STARTED****');
        this.selectedBook = this.authservice.selectedBook;
        if (this.screenorientation.type == 'landscape-primary') {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
          this.maximize_screen = 0;
        }
      });
      this.pauseListener = this.platform.pause.subscribe(() => {
        console.log('**** MINIMIZE STARTED****');
      });
    });
  }

  async checkAudioAvailability() {
    console.log('Checking audio availability for read page...');
    console.log('Current Bible ID:', this.authservice.defaultBibleId);
    console.log('Audio-enabled Bibles:', this.authservice.audio_bibles);

    // Check if current bible is one of the 4 audio-enabled bibles
    if (
      this.authservice.audio_bibles.indexOf(this.authservice.defaultBibleId) !==
      -1
    ) {
      console.log('✅ Current bible supports audio');

      // Construct MP3 audio URL with version folder
      const audioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;

      console.log('Testing MP3 audio URL:', audioUrl);

      try {
        // Test if MP3 file exists
        const response = await fetch(audioUrl, { method: 'HEAD' });

        if (response.ok) {
          console.log('✅ MP3 audio file exists and is accessible');
          this.isAudioAvailable = 1;
          this.isAudioDisplay = 1;
          this.is_audio_available = 1;
        } else {
          console.log(
            '❌ MP3 audio file not found (Status:',
            response.status,
            ')'
          );
          // Bible supports audio but this chapter might not have audio yet
          this.isAudioAvailable = 0;
          this.isAudioDisplay = 0;
        }
      } catch (error) {
        console.log('❌ Error checking MP3 audio availability:', error);
        // Bible supports audio, so show play button even if network check fails
        this.isAudioAvailable = 1;
        this.isAudioDisplay = 1;
      }
    } else {
      console.log('❌ Current bible does not support audio');
      console.log('Available audio bible IDs:', this.authservice.audio_bibles);
      this.isAudioAvailable = 0;
      this.isAudioDisplay = 0;
    }

    console.log('Final audio display flags:', {
      isAudioAvailable: this.isAudioAvailable,
      isAudioDisplay: this.isAudioDisplay,
      currentBibleId: this.authservice.defaultBibleId,
      supportsAudio:
        this.authservice.audio_bibles.indexOf(
          this.authservice.defaultBibleId
        ) !== -1,
    });
  }

  ionViewDidLeave() {
    this.appComponent.closeAudio();
    this.appComponent.hideAudioPanel();
    this.appComponent.hidedrawermenu();
    this.popovermenu = 'read-popovermenu-hide';
    this.show_notes_pop = '0';
    if (this.screenorientation.type == 'landscape-primary') {
      this.orientation = 'landscape';
      this.authservice.orientation = this.orientation;
    } else {
      this.orientation = 'portrait';
      this.authservice.orientation = this.orientation;
      this.maximize_screen = 0;
    }
    this.renderer.setStyle(this.header['el'], 'transition', 'none');
    this.renderer.setStyle(this.header['el'], 'top', '0px');
    document.getElementById('myTabBar').style.display = 'flex';

    // Reset compare page data flag so it reloads with current chapter when navigating to compare tab
    this.authservice.dataLoadedCompare = 0;
  }
  ionViewWillEnter() {
    console.log('View will enter');
    this.menuCtrl.enable(false);
    this.lastScrollTop = 0;
    this.isAutoScroll = true;
    this.suppressHeaderToggleUntil = Date.now() + 1500;
    this.renderer.setStyle(this.header['el'], 'transition', 'none');
    this.renderer.setStyle(this.header['el'], 'top', '0px');
    document.getElementById('myTabBar').style.display = 'flex';

    setTimeout(() => {
      this.isAutoScroll = false;
      this.renderer.setStyle(
        this.header['el'],
        'transition',
        'top 0.3s ease-out'
      );
    }, 300);
  }
  ngOnInit() {
    console.log('On Init');

    // Subscribe to dark mode state changes from service
    this.darkModeSubscription = this.darkModeService.darkModeState$.subscribe(
      (state) => {
        this.isDarkMode = state.readDarkMode || state.globalDarkMode;
        this.applyDarkMode();
      }
    );
  }

  ngOnDestroy() {
    this.audioFocusService.releaseFocus('read');
    this.audioFocusService.unregisterOwner('read');

    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }

  applyDarkMode() {
    this.darkModeService.applyPageDarkMode('read', 'app-read ion-content');
    // Also update status bar when on this page
    this.darkModeService.updateStatusBar('read');
  }

  openSettings() {
    this.appComponent.hidedrawermenu();
    this.authservice.backToPage = 'read';
    this.navctrl.navigateRoot('/settings');
  }
  openBookSelector() {
    this.appComponent.closeAudio();
    this.appComponent.hidedrawermenu();
    this.authservice.backToPage = 'read';
    this.navctrl.navigateRoot('/bookselector');
  }
  openSetBible() {
    this.appComponent.closeAudio();
    this.appComponent.hidedrawermenu();
    this.authservice.backToPage = 'read';
    this.navctrl.navigateRoot('/setdefaultbible');
  }
  async ionViewDidEnter() {
    this.isNavigated = false;
    this.online = this.network.isConnected;
    if (!this.online) {
      Toast.show({
        text: 'No network connection. Audio features may be unavailable.',
        duration: 'short',
        position: 'bottom',
      });
    }

    // Only start progress interval if it's not already running
    if (!this.progressInterval) {
      this.startProgressVoiceOver();
    }
    this.authservice.pageName = 'READ';
    this.authservice.showsign = 0;

    this.pageloaded = 'no';
    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    this.authservice.currentPage = 'READ';
    this.authservice.verseList;
    if (this.authservice.readMode == 'CHAPTER') {
      this.showBottomNav = 'opacityshowe';
    }

    await this.platform.ready();
    this.orientation = this.authservice.orientation;

    try {
      const db: DatabaseConnection = await this.databaseService.create({
        name: 'viviliam.db',
        location: 'default',
      });

      console.log('DB created');
      this.database = db;

      // ADD THIS: Load configuration values from database
      await this.loadConfigFromDatabase();

      this.showNextNav = 'showfull';
      this.showPrevNav = 'showopacity';
      console.log('Vers data: ');

      // Enhanced audio initialization with metadata preloading
      if (this.is_audio_available == 1 && this.online) {
        try {
          await this.appComponent.wakeLockService.keepAwake();
          console.log('Wake lock acquired successfully');
        } catch (err) {
          console.log('Error initializing wake lock:', err);
        }

        // Enhanced audio setup with metadata preloading
        if (this.appComponent.audio && this.appComponent.audio.nativeElement) {
          this.appComponent.audio.nativeElement.preload = 'metadata'; // Changed from "auto" to "metadata"
          console.log('Audio element configured for metadata preloading');

          // Prepare the audio URL
          const audioBaseUrl = 'https://api.viviliam.com/assets/voiceover/';
          this.appComponent.audioState = 'NOTSTARTED';
          this.appComponent.audioid =
            audioBaseUrl +
            this.authservice.defaultBibleId +
            '_' +
            this.authservice.defaultBibleVersionText +
            '/' +
            this.authservice.defaultBibleId +
            '_' +
            this.authservice.defaultBookNumber +
            '_' +
            this.authservice.defaultChapterNumber +
            '.mp3';

          // Set the source and load metadata to get duration
          this.appComponent.audio.nativeElement.src = this.appComponent.audioid;

          // Add event listener to capture duration when metadata loads
          const metadataLoadHandler = () => {
            const duration = this.appComponent.audio.nativeElement.duration;
            if (duration && !isNaN(duration) && isFinite(duration)) {
              // Set the duration in your app component
              this.appComponent.audioMaxLength = duration;
              this.appComponent.audioMaxLengthDummy = duration;
              this.appComponent.audioDuration = this.convertHMS(
                Math.floor(duration)
              );
              console.log(
                'Audio duration loaded on app start:',
                duration,
                'formatted:',
                this.appComponent.audioDuration
              );

              // Also load the timespan data for audio synchronization
              this.loadAudioTimespan();
            } else {
              console.log(
                'Duration not available yet, will retry when audio starts'
              );
            }
          };

          // Remove any existing event listeners to prevent duplicates
          this.appComponent.audio.nativeElement.removeEventListener(
            'loadedmetadata',
            metadataLoadHandler
          );

          // Add the event listener
          this.appComponent.audio.nativeElement.addEventListener(
            'loadedmetadata',
            metadataLoadHandler,
            { once: true }
          );

          // Load the metadata
          this.appComponent.audio.nativeElement.load();

          // Add audio ended event handler for reliable navigation
          const audioEndedHandler = () => {
            console.log('Audio ended event triggered - initiating navigation');
            if (this.appComponent.isAudioPlaying == 1) {
              // Handle repeat logic first
              if (this.appComponent.repeat_state != 0) {
                const repeatLimit = Number(this.appComponent.repeat_state) || 0;
                if (this.appComponent.repeat_played_count < repeatLimit) {
                  // Repeat the current chapter
                  console.log(
                    'Repeating chapter:',
                    this.appComponent.repeat_played_count + 1,
                    'of',
                    repeatLimit
                  );
                  this.appComponent.repeat_played_count++;
                  this.appComponent.audio.nativeElement.currentTime = 0;
                  this.appComponent.audioCurrentTimeSeconds = 0;
                  this.appComponent.audioCurrentTime = '0:00';
                  this.appComponent.audio.nativeElement.play();
                  return; // Don't navigate, just repeat
                } else {
                  // Completed all repeats
                  console.log('Repeat completed, stopping playback');
                  this.appComponent.repeat_state = 0;
                  this.appComponent.repeat_played_count = 0;
                  this.appComponent.timer_selected = 'Off';
                  this.appComponent.PauseAudio();
                  this.appComponent.resetAudioState();
                  return; // Don't navigate
                }
              }

              // No repeat - proceed with normal chapter navigation
              this.appComponent.audioState = 'NOTSTARTED';
              this.appComponent.audio.nativeElement.currentTime = 0;
              this.appComponent.audioid = '';
              this.appComponent.audioCurrentTimeSeconds = 0;
              this.appComponent.audioDuration = '';
              this.appComponent.audioCurrentTime = '0:00';
              this.voiceOverStarted = 0;
              this.voiceOverState = 0;
              this.appComponent.chapterPlayed =
                this.appComponent.chapterPlayed + 1;

              if (
                this.appComponent.timer_selected != 'Off' &&
                Number(this.appComponent.timer_selected_option) > 0 &&
                Number(this.appComponent.timer_counter_check) > 0 &&
                this.appComponent.chapterPlayed >=
                  this.appComponent.timer_counter_check
              ) {
                const completedChapters = this.appComponent.timer_counter_check;
                this.appComponent.navigateToNextVers = 0;
                this.appComponent.PauseAudio();
                this.appComponent.resetAudioState();
                void Toast.show({
                  text: `Completed ${completedChapters} chapter${
                    completedChapters > 1 ? 's' : ''
                  }`,
                  duration: 'short',
                  position: 'bottom',
                });
              } else {
                this.appComponent.navigateToNextVers = 1;
              }
            }
          };

          // Remove any existing ended event listener
          this.appComponent.audio.nativeElement.removeEventListener(
            'ended',
            audioEndedHandler
          );

          // Add the ended event listener
          this.appComponent.audio.nativeElement.addEventListener(
            'ended',
            audioEndedHandler
          );

          console.log(
            'Audio URL prepared and metadata loading initiated:',
            this.appComponent.audioid
          );
        }
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      Toast.show({
        text: 'Error loading data. Please restart the app.',
        duration: 'long',
        position: 'center',
      });
    }

    if (this.authservice.dataLoaded == 0) {
      this.selectedBook = '.';
      this.selectedVersion = '...';
      this.loadData();
    } else {
      this.totalChapters = this.authservice.totalChapters;
      this.totalBooks = this.authservice.totalBooks;
      this.selectedBook = this.authservice.selectedBook;
      this.selectedVersion = this.authservice.selectedVersion;
    }

    if (this.screenorientation.type == 'landscape-primary') {
      this.orientation = 'landscape';
      this.authservice.orientation = this.orientation;
    } else {
      this.orientation = 'portrait';
      this.authservice.orientation = this.orientation;
      this.maximize_screen = 0;
    }

    if (
      !this.appComponent.readaloud_selected ||
      this.appComponent.readaloud_selected === ''
    ) {
      if (this.authservice.TextHighlightShow == 1)
        this.appComponent.readaloud_selected = 'Highlight';
      else this.appComponent.readaloud_selected = 'Voice Only';
    }

    // Debug logging
    console.log('=== SETTINGS DEBUG ===');
    console.log('BSIRedLettersShow:', this.authservice.BSIRedLettersShow);
    console.log('BSINumberShow:', this.authservice.BSINumberShow);
    console.log('TextHighlightShow:', this.authservice.TextHighlightShow);
    console.log('Default Bible ID:', this.authservice.defaultBibleId);
    console.log(
      'TextHighlightShow type:',
      typeof this.authservice.TextHighlightShow
    );
    console.log(
      'Comparison result (TextHighlightShow == "1"):',
      this.authservice.TextHighlightShow == '1'
    );
    console.log(
      'Comparison result (TextHighlightShow == 1):',
      this.authservice.TextHighlightShow == 1
    );

    console.log('=== AUDIO BIBLES DEBUG ===');
    console.log('Total Bibles: 6');
    console.log('Audio-enabled Bible IDs:', this.authservice.audio_bibles);
    console.log('Current Bible ID:', this.authservice.defaultBibleId);
    console.log(
      'Current Bible supports audio:',
      this.authservice.audio_bibles.indexOf(this.authservice.defaultBibleId) !==
        -1
    );
    console.log('========================');
  }

  // ADD THIS NEW METHOD:
  private async loadConfigFromDatabase(): Promise<void> {
    try {
      const data = await this.database.executeSql('select * from config', []);

      for (var i = 0; i < data.rows.length; i++) {
        const configItem = data.rows.item(i);

        switch (configItem.id) {
          case 1:
            this.authservice.selectedTheme = configItem.value;
            break;
          case 4:
            this.authservice.paragraphMode = configItem.value;
            break;
          case 6:
            this.authservice.textSize = configItem.value;
            break;
          case 8:
            this.authservice.versenumberShow = configItem.value;
            break;
          case 9:
            this.authservice.verseNumberSize = configItem.value;
            break;
          case 10:
            this.authservice.lineSpacing = configItem.value;
            if (configItem.value == 'linespacing_1')
              this.authservice.lineSpacingText = '1x';
            else if (configItem.value == 'linespacing_2')
              this.authservice.lineSpacingText = '1.5x';
            else if (configItem.value == 'linespacing_3')
              this.authservice.lineSpacingText = '2x';
            break;
          case 11:
            this.authservice.dailyVerse = configItem.value;
            break;
          case 12:
            this.authservice.dailyQuiz = configItem.value;
            break;
          case 13:
            this.authservice.dailyQuote = configItem.value;
            break;
          case 14:
            this.authservice.verseSpacing = configItem.value;
            break;
          case 15:
            this.authservice.lastread_bible = configItem.value;
            break;
          case 16:
            this.authservice.lastread_book = configItem.value;
            break;
          case 17:
            this.authservice.lastread_chapter = configItem.value;
            break;
          case 18:
            this.authservice.lastread_versiontext = configItem.value;
            break;
          case 19:
            this.authservice.lastread_versescroll = configItem.value;
            break;
          case 20:
            this.authservice.lastread_versenumber = configItem.value;
            break;
          case 25:
            this.authservice.BSINumberShow = configItem.value;
            break;
          case 26:
            this.authservice.userId = configItem.value;
            break;
          case 27:
            this.authservice.userName = configItem.value;
            break;
          case 29:
            this.authservice.BSIRedLettersShow = configItem.value;
            break;
          case 30:
            this.authservice.CompareShowLabel = configItem.value;
            break;
          case 31:
            this.authservice.fullscreenMode = configItem.value;
            break;
          case 32:
            this.authservice.TextHighlightShow = configItem.value;
            break;
          case 33:
            this.authservice.readSpeed = configItem.value;
            this.appComponent.play_speed = configItem.value;
            break;
        }
      }

      // Set user status if user exists
      if (this.authservice.userId != '') {
        this.authservice.userSignedStatus = 1;
        this.authservice.userFirsletter = this.authservice.userName.charAt(0);
      }

      console.log('Configuration loaded from database');
      console.log(
        'BSIRedLettersShow after load:',
        this.authservice.BSIRedLettersShow
      );
      console.log('BSINumberShow after load:', this.authservice.BSINumberShow);
      console.log(
        'TextHighlightShow after load:',
        this.authservice.TextHighlightShow
      );
    } catch (error) {
      console.error('Error loading configuration from database:', error);
    }
  }

  // ...existing code...
  startProgressVoiceOver() {
    // Clear any existing interval first
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = setInterval(() => {
      this.isAutoScroll = false;
      if (this.appComponent.audioState == 'PLAYING') {
        this.selectedBook = this.authservice.selectedBook;
        if (this.appComponent.readaloud_selected == 'Highlight') {
          this.isAutoScroll = true;
          this.voiceOverState = 1;
          this.voiceOverLength = this.appComponent.audioMaxLength;

          // Always get fresh timeSpan data from appComponent
          const currentTimeSpan = this.appComponent.timeSpan;

          // CRITICAL: Verify timespan matches current chapter before using it
          if (
            this.appComponent.timeSpanBook !==
              this.authservice.defaultBookNumber ||
            this.appComponent.timeSpanChapter !==
              this.authservice.defaultChapterNumber
          ) {
            console.warn(
              'Timespan mismatch detected! TimeSpan is for Book',
              this.appComponent.timeSpanBook,
              'Chapter',
              this.appComponent.timeSpanChapter,
              'but current is Book',
              this.authservice.defaultBookNumber,
              'Chapter',
              this.authservice.defaultChapterNumber
            );
            // Don't highlight with wrong timespan data
            return;
          }

          // Fix 1: Check if timeSpan exists and has data
          if (currentTimeSpan && currentTimeSpan.length > 0) {
            // Fix 2: Use actual audio element's currentTime (in seconds)
            // NOT audioCurrentTimeSeconds which is a scaled/normalized value for the progress bar
            const currentAudioTime =
              this.appComponent.audio.nativeElement.currentTime;

            console.log('Current audio time:', currentAudioTime, 'seconds');

            // Fix 3: Find the current verse being played
            let currentVerseIndex = -1;
            for (var i = 0; i < currentTimeSpan.length; i++) {
              if (
                currentAudioTime >= currentTimeSpan[i].start &&
                currentAudioTime < currentTimeSpan[i].end
              ) {
                currentVerseIndex = i;
                break;
              }
            }

            // Fix 4: Clear all highlights first
            for (var j = 0; j < this.authservice.verseList.length; j++) {
              this.authservice.verseList[j].voiceover = 0;
            }

            // Fix 5: Set highlight for current verse if found
            if (currentVerseIndex >= 0) {
              const verseNumber = currentTimeSpan[currentVerseIndex].vnumber;

              // Fix 6: Find the correct verse in verseList by verse number
              for (let k = 0; k < this.authservice.verseList.length; k++) {
                if (this.authservice.verseList[k].vnumber == verseNumber) {
                  this.authservice.verseList[k].voiceover = 1;
                  this.voiceOverReadingVerse = verseNumber;

                  // Fix 7: Scroll to the highlighted verse
                  setTimeout(() => {
                    let element = document.getElementById(
                      'versenumber' + verseNumber
                    );
                    if (!element) {
                      element = document.getElementById('item' + verseNumber);
                    }
                    if (element) {
                      element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest',
                      });
                    }
                  }, 100);
                  break;
                }
              }
            }
          } else {
            console.log(
              'TimeSpan data not available for highlighting - Chapter:',
              this.authservice.defaultChapterNumber
            );
          }
        } else {
          this.voiceOverState = 0;
          this.isAutoScroll = false;
        }

        // Removed premature progress-based end detection (was triggering at 99.7%)
        // The native 'ended' event listener properly handles audio completion
        // (See ionViewDidEnter where audioEndedHandler is set up)
      } else if (this.appComponent.audioState == 'PAUSED') {
        // NEW: When paused, maintain the last highlighted verse
        this.isAutoScroll = false;
        // Don't clear highlights when paused - keep the last verse highlighted
        console.log(
          'Audio paused - maintaining highlight on verse:',
          this.voiceOverReadingVerse
        );
      } else {
        // Only clear highlights when audio is completely stopped (NOTSTARTED)
        this.isAutoScroll = false;
        if (this.appComponent.audioState == 'NOTSTARTED') {
          // Clear highlights only when audio is not started
          for (var j = 0; j < this.authservice.verseList.length; j++) {
            this.authservice.verseList[j].voiceover = 0;
          }
        }
      }

      // Handle navigation
      // Check if navigation flags are set AND not already navigating
      if (this.appComponent.navigateToNextVers == 1) {
        // Only proceed if not already in progress
        if (this.appComponent.navInprogress == 0) {
          this.appComponent.audio.nativeElement.currentTime = 0;
          this.appComponent.audioid = '';
          this.appComponent.audio.nativeElement.load();
          this.appComponent.audioCurrentTimeSeconds = 0;
          this.appComponent.audioDuration = '';
          this.appComponent.audioCurrentTime = '0:00';
          this.appComponent.navigateToNextVers = 0;
          this.appComponent.navInprogress = 1;
          this.gotoNextVers();
        } else {
          // Already navigating - just reset the flag
          this.appComponent.navigateToNextVers = 0;
        }
      }

      if (this.appComponent.navigateToPreviousVers == 1) {
        // Only proceed if not already in progress
        if (this.appComponent.navInprogress == 0) {
          this.appComponent.audio.nativeElement.currentTime = 0;
          this.appComponent.audioid = '';
          this.appComponent.audio.nativeElement.load();
          this.appComponent.audioCurrentTimeSeconds = 0;
          this.appComponent.audioDuration = '';
          this.appComponent.audioCurrentTime = '0:00';
          this.appComponent.navigateToPreviousVers = 0;
          this.appComponent.navInprogress = 1;
          this.gotoPrevVers();
        } else {
          // Already navigating - just reset the flag
          this.appComponent.navigateToPreviousVers = 0;
        }
      }
    }, 1000);
  }

  // Update the loadAudioTimespan method to return a promise
  private async loadAudioTimespan(): Promise<void> {
    try {
      console.log(`=== LOADING TIMESPAN ===`);
      console.log(
        `Bible: ${this.authservice.defaultBibleId}, Book: ${this.authservice.defaultBookNumber}, Chapter: ${this.authservice.defaultChapterNumber}`
      );

      const response = await fetch(
        `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.json`
      );

      if (response.ok) {
        const timespanData = await response.json();
        this.appComponent.timeSpan = timespanData;
        // Store which chapter this timespan is for
        this.appComponent.timeSpanChapter =
          this.authservice.defaultChapterNumber;
        this.appComponent.timeSpanBook = this.authservice.defaultBookNumber;
        console.log(
          '✓ Timespan loaded for Book',
          this.authservice.defaultBookNumber,
          'Chapter',
          this.authservice.defaultChapterNumber,
          '-',
          this.appComponent.timeSpan.length,
          'segments'
        );

        // Verify the timespan data is valid
        if (
          this.appComponent.timeSpan &&
          this.appComponent.timeSpan.length > 0
        ) {
          console.log('First timespan entry:', this.appComponent.timeSpan[0]);
          console.log(
            'Last timespan entry:',
            this.appComponent.timeSpan[this.appComponent.timeSpan.length - 1]
          );
        }
      } else {
        console.log(
          'No timespan data available for chapter',
          this.authservice.defaultChapterNumber
        );
        this.appComponent.timeSpan = [];
        this.appComponent.timeSpanChapter = null;
        this.appComponent.timeSpanBook = null;
      }
    } catch (error) {
      console.log(
        'Error loading timespan data for chapter',
        this.authservice.defaultChapterNumber,
        ':',
        error
      );
      this.appComponent.timeSpan = [];
    }
  }

  // Add this helper method for time conversion if not already present
  convertHMS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // Add this helper method for network quality checking
  async checkConnectionQuality() {
    // Simple network quality check
    const startTime = Date.now();
    let connectionQuality = 'unknown';

    try {
      // Try to fetch a small file to test connection speed
      const response = await fetch('https://api.viviliam.com/ping.json', {
        method: 'GET',
        cache: 'no-cache',
      });

      if (response.ok) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration < 300) {
          connectionQuality = 'good';
        } else if (duration < 1000) {
          connectionQuality = 'fair';
        } else {
          connectionQuality = 'poor';
        }

        console.log(`Connection quality: ${connectionQuality} (${duration}ms)`);

        // If connection is poor, warn the user
        if (connectionQuality === 'poor') {
          Toast.show({
            text: 'Your connection seems slow. Audio may buffer or pause.',
            duration: 'short',
            position: 'center',
          });
        }

        return connectionQuality;
      } else {
        return 'error';
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      return 'error';
    }
  }
  async loadData() {
    this.appComponent.setFonts();
    this.pageloaded = 'no';
    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    this.authservice.currentPage = 'READ';
    this.authservice.verseList = [];
    this.lastScrollTop = 0;
    console.log('View did enter');
    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;

      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (
          this.screenorientation.type.toUpperCase().indexOf('LANDSCAPE') != -1
        ) {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
          this.maximize_screen = 0;
          this.minimizeScreen();
        }
      });

      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then(async (db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          this.showNextNav = 'showfull';
          this.showPrevNav = 'showopacity';
          console.log('Vers data: ');
          if (this.authservice.appstartesstae == '0') {
            if (this.authservice.lastread_bible != '') {
              this.authservice.defaultBibleId = this.authservice.lastread_bible;
              this.authservice.defaultChapterNumber =
                this.authservice.lastread_chapter;
              this.authservice.defaultBookNumber =
                this.authservice.lastread_book;
              this.authservice.defaultBibleVersionText =
                this.authservice.lastread_versiontext;
            }
          }
          this.currentChapter = this.authservice.defaultChapterNumber;
          this.currentBook = this.authservice.defaultBookNumber;
          this.selectedVersion = this.authservice.defaultBibleVersionText;
          this.authservice.selectedVersion =
            this.authservice.defaultBibleVersionText;
          //this.setDefaultBibleInfo();
          // CRITICAL FIX: Wait for totalChapters and totalBooks to be set before loading verses
          await this.setTotalChapters();
          await this.setTotalBooks();
          this.getVers();
        });
    });
  }
  setDefaultBibleInfo() {
    var resultData;
    this.database
      .executeSql("SELECT * FROM bibles where defaultbible='1'", [])
      .then(
        (data) => {
          this.selectedVersion = data.rows.item(0).title;
          this.authservice.selectedVersion = data.rows.item(0).title;
          this.authservice.defaultBibleId = data.rows.item(0).id;
          this.authservice.defaultBibleVersionText = data.rows.item(0).title;
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );
  }

  async getVers() {
    console.log(
      'paragraph mode from getverse' + this.authservice.paragraphMode
    );

    // Store the current highlight preference at the beginning
    const currentHighlightSetting = this.appComponent.readaloud_selected;

    this.isBookLoaded = 0;
    this.selection = false;
    this.authservice.selection = false;
    this.authservice.verseList = [];
    var resultData;
    var qry;

    if (this.authservice.defaultBibleId == '5') {
      if (this.authservice.readMode.toUpperCase() == 'CHAPTER')
        qry =
          "SELECT a.*,ifnull(notes,'') notestext,c.language selectedlanguage, case c.language when 'Tamil' then fullname_tamil else fullname_english end bookname, case  c.language when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b, bibles c where a.bibleid = c.id and a.booknumber=b.bnumber and a.bibleid =" +
          this.authservice.defaultBibleId +
          ' and a.booknumber=' +
          this.authservice.defaultBookNumber +
          ' and a.cnumber=' +
          this.authservice.defaultChapterNumber +
          ' order by booknumber, cnumber, vnumber';
      else
        qry =
          "SELECT a.*,ifnull(notes,'') notestext,c.language selectedlanguage, case  c.language when 'Tamil' then fullname_tamil else fullname_english end bookname, case  c.language when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b, bibles c where a.bibleid = c.id and a.booknumber=b.bnumber and a.bibleid =" +
          this.authservice.defaultBibleId +
          ' and a.booknumber=' +
          this.authservice.defaultBookNumber +
          ' and a.cnumber=' +
          this.authservice.defaultChapterNumber +
          ' and a.vnumber=' +
          this.authservice.defaultVersNumber +
          ' order by booknumber, cnumber, vnumber';
    } else {
      if (this.authservice.readMode.toUpperCase() == 'CHAPTER')
        qry =
          "SELECT a.*, ifnull(notes,'') notestext,c.language selectedlanguage, case  c.language when 'Tamil' then fullname_tamil else fullname_english end bookname, case  c.language when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b, bibles c where a.bibleid = c.id and a.booknumber=b.bnumber and a.bibleid =" +
          this.authservice.defaultBibleId +
          ' and a.booknumber=' +
          this.authservice.defaultBookNumber +
          ' and a.cnumber=' +
          this.authservice.defaultChapterNumber +
          ' order by booknumber, cnumber, vnumber';
      else
        qry =
          "SELECT a.*, ifnull(notes,'') notestext,c.language selectedlanguage, case  c.language when 'Tamil' then fullname_tamil else fullname_english end bookname, case  c.language when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b, bibles c where a.bibleid = c.id and a.booknumber=b.bnumber and a.bibleid =" +
          this.authservice.defaultBibleId +
          ' and a.booknumber=' +
          this.authservice.defaultBookNumber +
          ' and a.cnumber=' +
          this.authservice.defaultChapterNumber +
          ' and a.vnumber=' +
          this.authservice.defaultVersNumber +
          ' order by booknumber, cnumber, vnumber';
    }

    console.log(qry);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        this.database.executeSql(qry, []).then(resolve, reject);
      });

      if (data.rows.length == 0) {
        console.error('===== NO VERSE DATA FOUND =====');
        console.error('Bible ID:', this.authservice.defaultBibleId);
        console.error('Book Number:', this.authservice.defaultBookNumber);
        console.error('Chapter Number:', this.authservice.defaultChapterNumber);
        console.error('Verse Number:', this.authservice.defaultVersNumber);
        console.error('Read Mode:', this.authservice.readMode);
        console.error('Query executed:', qry);
        console.error('================================');
        // Don't call gotoNextVers recursively - it causes chain navigation
        // Just show an error and stop
        this.authservice.showAlert(
          '',
          '',
          'Chapter data not available. Book: ' +
            this.authservice.defaultBookNumber +
            ', Chapter: ' +
            this.authservice.defaultChapterNumber
        );
        return;
      }

      this.selectedBook =
        data.rows.item(0).bookname + ' ' + data.rows.item(0).cnumber;
      this.authservice.selectedBook =
        data.rows.item(0).bookname + ' ' + data.rows.item(0).cnumber;
      this.authservice.defaultBookText = data.rows.item(0).fullbookname;
      this.authservice.selected_language_for_bookselector_read =
        data.rows.item(0).selectedlanguage;

      this.versData = '';
      this.authservice.defaultBibleId = data.rows.item(0).bibleid;
      this.authservice.defaultBibleLanguage =
        data.rows.item(0).selectedlanguage;
      var verseParagraph = '';

      // Process verses...
      for (var i = 0; i < data.rows.length; i++) {
        this.versData = '';

        if (this.authservice.defaultBibleLanguage == 'Tamil') {
          this.titlefont = 'font14';
          this.font = 'font16';
          this.booktitlefont = 'font11';
          this.authservice.globalfont = this.authservice.fontFamilyTamil;
        } else {
          this.titlefont = 'font16';
          this.font = 'font18';
          this.booktitlefont = 'font13';
          this.authservice.globalfont = this.authservice.fontFamilyEnglish;
        }

        var versetext = data.rows.item(i).vers;
        var vnumber = data.rows.item(i).vnumber;

        versetext = this.formatVerseText(versetext);

        if (this.authservice.paragraphMode == 0) {
          this.verseSpacing = this.authservice.verseSpacing;
          this.verseNumberSize = this.authservice.verseNumberSize;
          this.paragraphModeClass = 'normal';
          if (data.rows.item(i).vnumber == '0') {
            this.versData +=
              "<p class='vers  showtitle " +
              this.titlefont +
              ' ' +
              ' ' +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '</p>';
          } else if (vnumber.toString().indexOf('.') !== -1) {
            this.versData +=
              "<span class='vers  showthebrew " +
              this.font +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '</span>';
            data.rows.item(i).vnumber = '0';
          } else {
            this.versData += '<span>' + versetext + '</span>';
          }
          this.authservice.verseList.push({
            index: i,
            vid: data.rows.item(i).vid,
            verseData: this.versData,
            verse: data.rows.item(i).vers,
            bookname: data.rows.item(i).bookname,
            vnumber: data.rows.item(i).vnumber,
            isSelected: false,
            textHighlight: data.rows.item(i).textHighlight,
            bookMark: data.rows.item(i).bookMark,
            notes: data.rows.item(i).notestext,
            voiceover: '0',
          });
          this.isBookLoaded = 1;
        } else {
          this.verseSpacing = '';
          this.verseNumberSize = '';
          this.paragraphModeClass = 'paragraph';
          if (data.rows.item(i).vnumber == '0') {
            verseParagraph +=
              "<span class='versParagraph  showtitle " +
              this.titlefont +
              ' ' +
              ' ' +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '&nbsp;&nbsp;</span>';
          } else if (vnumber.toString().indexOf('.') !== -1) {
            verseParagraph +=
              "<span class='versParagraph  showthebrew " +
              this.font +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '&nbsp;&nbsp;</span>';
            vnumber = '';
          } else {
            if (this.authservice.versenumberShow == 1)
              verseParagraph +=
                "<span class='versParagraph " +
                this.authservice.lineSpacing +
                ' ' +
                this.font +
                ' ' +
                ' ' +
                ' vers_' +
                (i + 1) +
                "' id='" +
                data.rows.item(i).vnumber +
                "'><span class='versno " +
                this.authservice.verseNumberSize +
                " '>" +
                data.rows.item(i).vnumber +
                '</span>' +
                versetext +
                '&nbsp;&nbsp;</span>';
            else
              verseParagraph +=
                "<span class='versParagraph " +
                this.authservice.lineSpacing +
                ' ' +
                this.font +
                ' ' +
                ' ' +
                ' vers_' +
                (i + 1) +
                "' id='" +
                data.rows.item(i).vnumber +
                "'>" +
                versetext +
                '&nbsp;&nbsp;</span>';
          }
          if (i == data.rows.length - 1)
            this.authservice.verseList.push({
              index: i,
              vid: data.rows.item(i).vid,
              verseData: verseParagraph,
              verse: '',
              bookname: data.rows.item(i).bookname,
              vnumber: '',
              isSelected: false,
              textHighlight: data.rows.item(i).textHighlight,
              bookMark: data.rows.item(i).bookMark,
              notes: data.rows.item(i).notestext,
            });
          this.isBookLoaded = 1;
        }
      }

      this.readMode = this.authservice.readMode;
      if (this.authservice.readMode.toUpperCase() == 'CHAPTER') {
        this.hideIfVerseMode = 'hideVerseNav';
      } else {
        this.hideIfVerseMode = 'showVerseNav';
      }

      console.log('Set vers in' + this.currentChapter);
      // Only sync currentChapter if not navigating (to prevent race conditions)
      // During navigation, currentChapter is already correctly set by navigation functions
      if (!this.isNavigated) {
        this.currentChapter = this.authservice.defaultChapterNumber;
      }
      this.currentBook = this.authservice.defaultBookNumber;

      if (this.currentChapter == 1 && this.currentBook == 1)
        this.showPrevNav = 'showopacity';
      else this.showPrevNav = 'showfull';

      if (
        this.currentBook == this.totalChapters &&
        this.currentBook == this.totalBooks
      )
        this.showNextNav = 'showopacity';
      else this.showNextNav = 'showofull';

      // Update last read
      this.appComponent.navInprogress = 0;
      // Reset isNavigated after a short delay to allow current navigation to complete
      // but prepare for next navigation to sync currentChapter properly
      setTimeout(() => {
        this.isNavigated = false;
      }, 100);
      console.log('Navigation completed');
      this.authservice.lastread_bible = this.authservice.defaultBibleId;
      this.authservice.lastread_book = this.authservice.defaultBookNumber;
      this.authservice.lastread_chapter = this.authservice.defaultChapterNumber;
      this.authservice.lastread_versiontext =
        this.authservice.defaultBibleVersionText;

      // Update database
      var qry: any =
        "update config set value='" +
        this.authservice.lastread_bible +
        "' where id = 15;";
      var qry2 =
        "update config set value='" +
        this.authservice.lastread_book +
        "' where id = 16;";
      var qry3 =
        "update config set value='" +
        this.authservice.lastread_chapter +
        "' where id = 17;";
      var qry4 =
        "update config set value='" +
        this.authservice.lastread_versiontext +
        "' where id = 18;";

      await this.database.executeSql(qry, []);
      await this.database.executeSql(qry2, []);
      await this.database.executeSql(qry3, []);
      await this.database.executeSql(qry4, []);

      // CRITICAL FIX: Load timespan data immediately after verses are loaded
      if (this.is_audio_available == 1 && this.online) {
        console.log('=== ABOUT TO LOAD TIMESPAN IN GETVERS ===');
        console.log('defaultBibleId:', this.authservice.defaultBibleId);
        console.log('defaultBookNumber:', this.authservice.defaultBookNumber);
        console.log(
          'defaultChapterNumber:',
          this.authservice.defaultChapterNumber
        );
        console.log(
          'defaultBibleVersionText:',
          this.authservice.defaultBibleVersionText
        );
        await this.loadAudioTimespan();
        console.log(
          'Timespan loaded for chapter',
          this.authservice.defaultChapterNumber,
          '- Length:',
          this.appComponent.timeSpan?.length || 0
        );
      }

      // Restore highlight preference after all processing
      if (currentHighlightSetting) {
        this.appComponent.readaloud_selected = currentHighlightSetting;
        console.log('Highlight setting restored to:', currentHighlightSetting);
      }

      // Handle audio restart if needed
      if (this.appComponent.isAudioPlaying == 1) {
        console.log('Restarting audio for new chapter');
        this.appComponent.audioState = 'NOTSTARTED';
        this.appComponent.audio.nativeElement.currentTime = 0;
        this.appComponent.audioid = '';
        this.appComponent.StartAudio(1);
      }

      // Call scrollTo after everything is loaded
      this.scrollTo();
    } catch (error) {
      console.error('Error in getVers:', error);
    }

    this.authservice.dataLoaded = 1;
  }
  formatVerseText(versetext) {
    if (
      this.authservice.defaultBibleId == 3 &&
      this.authservice.BSIRedLettersShow == '1' // Keep as string comparison
    ) {
      versetext = versetext.split('ṟ').join('<span class=showred>');
      versetext = versetext.split('Ṟ').join('</span>');
    }
    if (this.authservice.defaultBibleId == 2) {
      versetext = versetext
        .split('[')
        .join('<span class=' + this.authservice.globalfont + 'Italic Italic>');
      versetext = versetext.split(']').join('</span>');
    }
    if (this.authservice.defaultBibleId == 3) {
      if (this.authservice.BSINumberShow == '1')
        versetext = versetext.split('[').join('<span class=' + 'textgrey>[');
      else
        versetext = versetext
          .split('[')
          .join('<span class=' + 'textgrey-hide>[');
      versetext = versetext.split(']').join(']</span>');
    }
    versetext = versetext.split('*').join('');
    versetext = versetext.split('␢').join('');

    // IMPORTANT: Only remove the Red Letter markers if Red Letters are NOT enabled
    if (
      this.authservice.defaultBibleId != 3 ||
      this.authservice.BSIRedLettersShow != '1'
    ) {
      versetext = versetext.split('ṟ').join('');
      versetext = versetext.split('Ṟ').join('');
    }

    versetext = versetext.split('§').join('');
    versetext = versetext.split('⒫').join('');
    versetext = versetext.split('⒯').join('');

    versetext = versetext.split('ḇ').join("<span class='boldtext'>");
    versetext = versetext.split('Ḇ').join('</span>');

    return versetext;
  }
  loadPrevVerse() {
    if (
      this.showBottomNav != 'opacityhide' &&
      this.appComponent.audio_panel != 'audio-panel-show'
    ) {
      if (this.authservice.defaultVersNumber > 1) {
        this.authservice.defaultVersNumber--;
        this.getVers();
        this.prevflag = 'enabled';
      } else {
        this.gotoPrevVers();
        //this.authservice.showAlert("", "", "Begining of chapter");
        this.prevflag = 'disabled';
      }
    }
  }
  loadNextVerse() {
    if (
      this.showBottomNav != 'opacityhide' &&
      this.appComponent.audio_panel != 'audio-panel-show'
    ) {
      this.authservice.defaultVersNumber++;
      this.getVers();
    }
  }
  loadChapter() {
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
    this.authservice.readMode = 'CHAPTER';
    this.maximize_screen = 0;
    this.getVers();
  }
  public selectItem(index, isSelected) {
    if (
      this.authservice.verseList[index].vnumber > 0 &&
      this.authservice.verseList[index].vnumber.toString().indexOf('.') == -1
    ) {
      if (this.authservice.paragraphMode == 0) {
        this.authservice.verseList[index].isSelected = !isSelected;
        this.selection = false;
        this.authservice.selection = false;
        this.appComponent.colorshow1 = 'hide';
        this.appComponent.colorshow2 = 'hide';
        this.appComponent.colorshow3 = 'hide';
        this.appComponent.colorshow4 = 'hide';
        this.appComponent.colorshow5 = 'hide';
        this.appComponent.colorshow6 = 'hide';
        this.appComponent.colorshow7 = 'hide';
        this.appComponent.colorshow8 = 'hide';
        this.appComponent.colorshow9 = 'hide';
        this.appComponent.colorshow10 = 'hide';

        for (var i = 0; i < this.authservice.verseList.length; i++) {
          if (this.authservice.verseList[i].isSelected) {
            this.selection = true;
            this.authservice.selection = true;
            if (this.authservice.verseList[i].textHighlight == 'color1')
              this.appComponent.colorshow1 = 'show';

            if (this.authservice.verseList[i].textHighlight == 'color2')
              this.appComponent.colorshow2 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color3')
              this.appComponent.colorshow3 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color4')
              this.appComponent.colorshow4 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color5')
              this.appComponent.colorshow5 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color6')
              this.appComponent.colorshow6 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color7')
              this.appComponent.colorshow7 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color8')
              this.appComponent.colorshow8 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color9')
              this.appComponent.colorshow9 = 'show';
            if (this.authservice.verseList[i].textHighlight == 'color10')
              this.appComponent.colorshow10 = 'show';
          }
        }
        if (this.authservice.selection) {
          // if(this.authservice.readMode!='VERSE')
          // this.showBottomNav="opacityhide";
          // else
          // this.showBottomNav="opacityshow";

          this.appComponent.drawer = 'drawershow';
          this.appComponent.read_popovermenu = 'read-popovermenu-hide';
          this.appComponent.drawer_fonts = 'drawer-font-hide';
          this.appComponent.drawer_read = 'drawer-read-hide';
          this.appComponent.hideAudioPanel();
        } else {
          this.showBottomNav = 'opacityshow';
          this.appComponent.drawer = 'drawerhide';
        }
        var selectedCount = 0;
        for (var i = 0; i < this.authservice.verseList.length; i++) {
          if (this.authservice.verseList[i].isSelected) selectedCount++;
        }
        if (selectedCount == 1) {
          this.appComponent.drawermenu_options_enabledstate =
            'enabled-drawermenu';
        } else {
          this.appComponent.drawermenu_options_enabledstate =
            'disabled-drawermenu';
        }
      }
    }
  }

  scrollTo() {
    this.isAutoScroll = true;
    this.suppressHeaderToggleUntil = Date.now() + 1500;
    console.log('Scroll set ' + this.authservice.defaultVersNumber);
    if (this.authservice.scrollmode == 'POSITION') {
      setTimeout(() => {
        //this.elementRef.nativeElement.scrollTop = this.authservice.lastread_versescroll;
        //this.scroller.scrollToPosition([0,parseFloat(this.authservice.lastread_versescroll)]);
        this.content.scrollToPoint(
          0,
          parseFloat(this.authservice.lastread_versescroll),
          100
        );
        this.authservice.appstartesstae = '1';
        setTimeout(() => {
          this.isAutoScroll = false;
        }, 350);
      }, 100);
    } else {
      setTimeout(() => {
        let b = document.getElementById(
          'item' + this.authservice.defaultVersNumber
        );

        if (b) b.scrollIntoView({ behavior: 'auto', block: 'start' });

        setTimeout(() => {
          this.isAutoScroll = false;
        }, 350);
      }, 100);
    }
  }
  async setTotalChapters(): Promise<void> {
    try {
      const data = await this.database.executeSql(
        'SELECT max(cnumber) totalchapters FROM vers where bibleid =? and booknumber=? ',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      );
      this.totalChapters = data.rows.item(0).totalchapters;
      this.authservice.totalChapters = data.rows.item(0).totalchapters;
      console.log(
        'Total chapters updated for book',
        this.authservice.defaultBookNumber,
        ':',
        this.totalChapters
      );
    } catch (e) {
      console.log('Error in setTotalChapters: ' + JSON.stringify(e));
    }
  }
  async setTotalChaptersGotoLast(): Promise<void> {
    try {
      const data = await this.database.executeSql(
        'SELECT max(cnumber) totalchapters FROM vers where bibleid =? and booknumber=? ',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      );
      this.totalChapters = data.rows.item(0).totalchapters;
      this.authservice.defaultVersNumber = 1;
      this.authservice.defaultChapterNumber = this.totalChapters;
      this.currentChapter = this.totalChapters;
      console.log(
        'Total chapters updated for book',
        this.authservice.defaultBookNumber,
        ':',
        this.totalChapters,
        '- navigating to last chapter'
      );
      this.getVers();
    } catch (e) {
      console.log('Error in setTotalChaptersGotoLast: ' + JSON.stringify(e));
    }
  }
  async setTotalBooks(): Promise<void> {
    try {
      const data = await this.database.executeSql(
        'SELECT distinct booknumber  FROM vers where bibleid =?',
        [this.authservice.defaultBibleId]
      );
      this.totalBooks = data.rows.length;
      this.authservice.totalBooks = data.rows.length;
      console.log('Total books updated:', this.totalBooks);
    } catch (e) {
      console.log('Error in setTotalBooks: ' + JSON.stringify(e));
    }
  }

  async getNextBookNumber(): Promise<number | null> {
    try {
      console.log(
        'getNextBookNumber - Current bibleid:',
        this.authservice.defaultBibleId,
        'Current booknumber:',
        this.authservice.defaultBookNumber
      );
      const data = await this.database.executeSql(
        'SELECT MIN(booknumber) as nextbook FROM vers WHERE bibleid = ? AND booknumber > ?',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      );
      console.log('getNextBookNumber - Query result rows:', data.rows.length);
      if (data.rows.length > 0) {
        console.log(
          'getNextBookNumber - Row 0 nextbook value:',
          data.rows.item(0).nextbook
        );
        if (data.rows.item(0).nextbook) {
          const nextBook = data.rows.item(0).nextbook;
          console.log('✓ Next book number found:', nextBook);
          return nextBook;
        }
      }
      console.log('✗ No next book found - end of bible');
      return null;
    } catch (e) {
      console.error('✗ Error in getNextBookNumber:', JSON.stringify(e));
      return null;
    }
  }

  async getPreviousBookNumber(): Promise<number | null> {
    try {
      const data = await this.database.executeSql(
        'SELECT MAX(booknumber) as prevbook FROM vers WHERE bibleid = ? AND booknumber < ?',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      );
      if (data.rows.length > 0 && data.rows.item(0).prevbook) {
        const prevBook = data.rows.item(0).prevbook;
        console.log('Previous book number:', prevBook);
        return prevBook;
      }
      console.log('No previous book found - beginning of bible');
      return null;
    } catch (e) {
      console.log('Error in getPreviousBookNumber: ' + JSON.stringify(e));
      return null;
    }
  }

  // Update your gotoNextVers method to preserve highlight setting:
  async gotoNextVers() {
    if (
      (this.showBottomNav != 'opacityhide' &&
        this.appComponent.audio_panel != 'audio-panel-show') ||
      this.appComponent.audio_panel == 'audio-panel-show'
    ) {
      this.show_notes_pop = '0';
      this.isNavigated = true;
      this.appComponent.navInprogress = 1;

      // Store the current highlight preference before navigation
      const currentHighlightSetting = this.appComponent.readaloud_selected;

      // Clear the progress interval before navigation
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      if (this.appComponent.isAudioPlaying == 0) this.appComponent.stopAudio();

      console.log('=== NAVIGATION DEBUG ===');
      console.log('Bible ID:', this.authservice.defaultBibleId);
      console.log('Bible Version:', this.authservice.defaultBibleVersionText);
      console.log(
        'Current Book:',
        this.currentBook,
        'Total Books:',
        this.totalBooks
      );
      console.log(
        'Current Chapter:',
        this.currentChapter,
        'Total Chapters:',
        this.totalChapters
      );
      console.log('defaultBookNumber:', this.authservice.defaultBookNumber);
      console.log(
        'defaultChapterNumber:',
        this.authservice.defaultChapterNumber
      );
      console.log('isAudioPlaying:', this.appComponent.isAudioPlaying);
      console.log('navInprogress:', this.appComponent.navInprogress);

      // CRITICAL FIX: Sync currentChapter and currentBook with authservice values FIRST
      // This ensures we're working with the actual current position
      this.currentChapter = this.authservice.defaultChapterNumber;
      this.currentBook = this.authservice.defaultBookNumber;
      console.log(
        'After sync - currentChapter:',
        this.currentChapter,
        'currentBook:',
        this.currentBook
      );

      // CRITICAL FIX: Always refresh totalChapters before navigation decision
      // This prevents stale data from causing incorrect navigation
      await this.setTotalChapters();
      console.log('Refreshed Total Chapters:', this.totalChapters);

      if (this.currentChapter < this.totalChapters) {
        console.log('✓ Navigating to next chapter within same book');
        this.showPrevNav = 'showfull';
        this.currentChapter++;
        this.authservice.defaultChapterNumber = this.currentChapter;
        if (this.currentChapter >= this.totalChapters) {
          if (this.currentBook > this.totalBooks) {
            this.showNextNav = 'showopacity';
            this.showPrevNav = 'showfull';
          }
        }
        this.authservice.defaultVersNumber = 1;

        this.authservice.scrollmode = 'NEW';
        this.appComponent.hidedrawermenu();

        // CRITICAL FIX: Stop audio and update source BEFORE loading verses
        const wasPlaying = this.appComponent.isAudioPlaying == 1;
        if (wasPlaying) {
          console.log('Stopping audio before chapter change');
          this.appComponent.audio.nativeElement.pause();
        }

        // CRITICAL: Clear old timespan data immediately to prevent wrong verse highlighting
        this.appComponent.timeSpan = [];
        this.appComponent.timeSpanBook = null;
        this.appComponent.timeSpanChapter = null;
        console.log('Cleared old timespan data and tracking variables');

        // Update audio source URL immediately for new chapter
        const newAudioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;
        console.log('Updating audio URL to:', newAudioUrl);
        this.appComponent.audioid = newAudioUrl;
        this.appComponent.audio.nativeElement.src = newAudioUrl;
        this.appComponent.audio.nativeElement.load();
        this.appComponent.audio.nativeElement.currentTime = 0;
        this.appComponent.audioCurrentTimeSeconds = 0;
        this.appComponent.audioCurrentTime = '0:00';
        this.appComponent.audioState = 'NOTSTARTED';

        await this.getVers();

        // Restart audio if it was playing
        if (wasPlaying) {
          console.log('Restarting audio with new chapter');
          setTimeout(() => {
            this.appComponent.StartAudio(1);
            setTimeout(() => {
              this.appComponent.ContinuePayAudio();
            }, 600);
          }, 300);
        } else {
          // Just initialize audio source without playing
          this.appComponent.StartAudio(1);
        }

        // Restore the highlight preference after navigation
        this.appComponent.readaloud_selected = currentHighlightSetting;

        // Reset navigation flag
        this.appComponent.navInprogress = 0;
        console.log('✓ Navigation to next chapter complete');

        // Restart the progress interval after a delay to ensure everything is loaded
        setTimeout(() => {
          this.startProgressVoiceOver();
        }, 1000); // Increased delay to 1000ms
      } else {
        console.log('✓ At last chapter, checking for next book');
        console.log(
          'Current defaultBookNumber before query:',
          this.authservice.defaultBookNumber
        );

        // Get the actual next book number from database
        const nextBookNumber = await this.getNextBookNumber();
        console.log('getNextBookNumber returned:', nextBookNumber);

        if (nextBookNumber !== null) {
          console.log(
            '✓ Navigating to next book from',
            this.authservice.defaultBookNumber,
            'to',
            nextBookNumber
          );
          this.currentBook = nextBookNumber;
          this.authservice.defaultBookNumber = nextBookNumber;
          this.currentChapter = 1;
          this.authservice.defaultChapterNumber = 1;
          this.authservice.defaultVersNumber = 1;

          console.log(
            'Updated values - Book:',
            this.authservice.defaultBookNumber,
            'Chapter:',
            this.authservice.defaultChapterNumber
          );

          // CRITICAL FIX: Wait for total chapters to be updated before proceeding
          await this.setTotalChapters();
          console.log('Total chapters for new book:', this.totalChapters);

          this.authservice.scrollmode = 'NEW';
          this.appComponent.hidedrawermenu();

          // CRITICAL FIX: Stop audio and update source BEFORE loading verses
          const wasPlaying = this.appComponent.isAudioPlaying == 1;
          if (wasPlaying) {
            console.log('Stopping audio before book change');
            this.appComponent.audio.nativeElement.pause();
          }

          // CRITICAL: Clear old timespan data immediately to prevent wrong verse highlighting
          this.appComponent.timeSpan = [];
          this.appComponent.timeSpanBook = null;
          this.appComponent.timeSpanChapter = null;
          console.log('Cleared old timespan data and tracking variables');

          // Update audio source URL immediately for new book
          const newAudioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;
          console.log('Updating audio URL to:', newAudioUrl);
          this.appComponent.audioid = newAudioUrl;
          this.appComponent.audio.nativeElement.src = newAudioUrl;
          this.appComponent.audio.nativeElement.load();
          this.appComponent.audio.nativeElement.currentTime = 0;
          this.appComponent.audioCurrentTimeSeconds = 0;
          this.appComponent.audioCurrentTime = '0:00';
          this.appComponent.audioState = 'NOTSTARTED';

          console.log(
            'About to call getVers() with Book:',
            this.authservice.defaultBookNumber,
            'Chapter:',
            this.authservice.defaultChapterNumber
          );
          await this.getVers();

          // Restart audio if it was playing
          if (wasPlaying) {
            console.log('Restarting audio with new book');
            setTimeout(() => {
              this.appComponent.StartAudio(1);
              setTimeout(() => {
                this.appComponent.ContinuePayAudio();
              }, 600);
            }, 300);
          } else {
            // Just initialize audio source without playing
            this.appComponent.StartAudio(1);
          }

          // Restore the highlight preference after navigation
          this.appComponent.readaloud_selected = currentHighlightSetting;

          // Reset navigation flag
          this.appComponent.navInprogress = 0;
          console.log('✓ Navigation to next book complete');

          // Restart the progress interval after a delay to ensure everything is loaded
          setTimeout(() => {
            this.startProgressVoiceOver();
          }, 1000); // Increased delay to 1000ms
        } else {
          console.log('✗ End of bible reached');
          this.authservice.showAlert('', '', 'End of bible');
          if (this.audioplaying == 'voiceover_playing') {
            for (var j = 0; j < this.authservice.verseList.length; j++) {
              this.authservice.verseList[j].voiceover = 0;
            }
            this.voiceOverStarted = 0;
            this.voiceOverState = 0;
            this.audioplaying = 'voiceover_notplaying';
          }
        }
      }
    }
  }

  // Update your gotoPrevVers method to preserve highlight setting:
  async gotoPrevVers() {
    if (
      (this.showBottomNav != 'opacityhide' &&
        this.appComponent.audio_panel != 'audio-panel-show') ||
      this.appComponent.audio_panel == 'audio-panel-show'
    ) {
      this.show_notes_pop = '0';
      this.isNavigated = true;
      this.appComponent.navInprogress = 1;

      // Store the current highlight preference before navigation
      const currentHighlightSetting = this.appComponent.readaloud_selected;

      // Clear the progress interval before navigation
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      if (this.appComponent.isAudioPlaying == 0) this.appComponent.stopAudio();

      console.log('=== PREVIOUS NAV DEBUG ===');
      console.log('Bible ID:', this.authservice.defaultBibleId);
      console.log(
        'Before sync - currentChapter:',
        this.currentChapter,
        'currentBook:',
        this.currentBook
      );
      console.log('defaultBookNumber:', this.authservice.defaultBookNumber);
      console.log(
        'defaultChapterNumber:',
        this.authservice.defaultChapterNumber
      );

      // CRITICAL FIX: Sync currentChapter and currentBook with authservice values FIRST
      this.currentChapter = this.authservice.defaultChapterNumber;
      this.currentBook = this.authservice.defaultBookNumber;
      console.log(
        'After sync - currentChapter:',
        this.currentChapter,
        'currentBook:',
        this.currentBook
      );

      if (this.currentChapter > 1) {
        this.showPrevNav = 'showfull';
        this.currentChapter--;
        this.authservice.defaultChapterNumber = this.currentChapter;
        if (this.currentChapter == 1) {
          if (this.currentBook == 1) {
            this.showPrevNav = 'showopacity';
            this.showNextNav = 'showfull';
          }
        }
        this.authservice.defaultVersNumber = 1;

        this.authservice.scrollmode = 'NEW';
        this.appComponent.hidedrawermenu();

        // CRITICAL FIX: Stop audio and update source BEFORE loading verses
        const wasPlaying = this.appComponent.isAudioPlaying == 1;
        if (wasPlaying) {
          console.log('Stopping audio before previous chapter');
          this.appComponent.audio.nativeElement.pause();
        }

        // CRITICAL: Clear old timespan data immediately to prevent wrong verse highlighting
        this.appComponent.timeSpan = [];
        this.appComponent.timeSpanBook = null;
        this.appComponent.timeSpanChapter = null;
        console.log('Cleared old timespan data and tracking variables');

        // Update audio source URL immediately for previous chapter
        const newAudioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;
        console.log('Updating audio URL to:', newAudioUrl);
        this.appComponent.audioid = newAudioUrl;
        this.appComponent.audio.nativeElement.src = newAudioUrl;
        this.appComponent.audio.nativeElement.load();
        this.appComponent.audio.nativeElement.currentTime = 0;
        this.appComponent.audioCurrentTimeSeconds = 0;
        this.appComponent.audioCurrentTime = '0:00';
        this.appComponent.audioState = 'NOTSTARTED';

        await this.getVers();

        // Restart audio if it was playing
        if (wasPlaying) {
          console.log('Restarting audio with previous chapter');
          setTimeout(() => {
            this.appComponent.StartAudio(1);
            setTimeout(() => {
              this.appComponent.ContinuePayAudio();
            }, 600);
          }, 300);
        } else {
          // Just initialize audio source without playing
          this.appComponent.StartAudio(1);
        }

        // Restore the highlight preference after navigation
        this.appComponent.readaloud_selected = currentHighlightSetting;

        // Reset navigation flag
        this.appComponent.navInprogress = 0;

        // Restart the progress interval after a delay to ensure everything is loaded
        setTimeout(() => {
          this.startProgressVoiceOver();
        }, 1000); // Increased delay to 1000ms
      } else {
        // Get the actual previous book number from database
        const prevBookNumber = await this.getPreviousBookNumber();

        if (prevBookNumber !== null) {
          this.currentBook = prevBookNumber;
          this.authservice.defaultBookNumber = prevBookNumber;

          // CRITICAL FIX: Wait for setTotalChaptersGotoLast to complete
          // It updates totalChapters AND calls getVers() with correct last chapter
          this.authservice.defaultVersNumber = 1;

          // CRITICAL FIX: Stop audio BEFORE loading verses
          const wasPlaying = this.appComponent.isAudioPlaying == 1;
          if (wasPlaying) {
            console.log('Stopping audio before previous book');
            this.appComponent.audio.nativeElement.pause();
          }

          // CRITICAL: Clear old timespan data immediately to prevent wrong verse highlighting
          this.appComponent.timeSpan = [];
          this.appComponent.timeSpanBook = null;
          this.appComponent.timeSpanChapter = null;
          console.log('Cleared old timespan data and tracking variables');

          // First, get the total chapters and update chapter number to last chapter
          await this.setTotalChaptersGotoLast();

          // NOW construct the audio URL with the correct chapter number (last chapter)
          const newAudioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;
          console.log('Updating audio URL to:', newAudioUrl);
          console.log(
            'Book:',
            this.authservice.defaultBookNumber,
            'Chapter:',
            this.authservice.defaultChapterNumber
          );
          this.appComponent.audioid = newAudioUrl;
          this.appComponent.audio.nativeElement.src = newAudioUrl;
          this.appComponent.audio.nativeElement.load();
          this.appComponent.audio.nativeElement.currentTime = 0;
          this.appComponent.audioCurrentTimeSeconds = 0;
          this.appComponent.audioCurrentTime = '0:00';
          this.appComponent.audioState = 'NOTSTARTED';

          this.appComponent.hidedrawermenu();

          // Restart audio if it was playing
          if (wasPlaying) {
            console.log('Restarting audio with previous book');
            setTimeout(() => {
              this.appComponent.StartAudio(1);
              setTimeout(() => {
                this.appComponent.ContinuePayAudio();
              }, 600);
            }, 300);
          } else {
            // Just initialize audio source without playing
            this.appComponent.StartAudio(1);
          }

          // Restore the highlight preference after navigation
          this.appComponent.readaloud_selected = currentHighlightSetting;

          // Reset navigation flag
          this.appComponent.navInprogress = 0;

          // Restart the progress interval after a delay to ensure everything is loaded
          setTimeout(() => {
            this.startProgressVoiceOver();
          }, 1000); // Increased delay to 1000ms
        } else {
          this.authservice.showAlert('', '', 'Begining of the Bible');
        }
      }
    }
  }

  private async resetAudioForNewChapter() {
    console.log(
      'Resetting audio for new chapter:',
      this.authservice.defaultChapterNumber
    );

    // Clear previous audio state completely
    this.appComponent.audioState = 'NOTSTARTED';
    this.appComponent.audioMaxLength = 0;
    this.appComponent.audioMaxLengthDummy = 0;
    this.appComponent.audioDuration = '';
    this.appComponent.audioCurrentTime = '0:00';
    this.appComponent.audioCurrentTimeSeconds = 0;
    this.appComponent.timeSpan = []; // Clear old timespan data
    this.appComponent.audioid = '';

    // Reset audio element completely
    if (this.appComponent.audio && this.appComponent.audio.nativeElement) {
      const audioElement = this.appComponent.audio.nativeElement;

      // Reset all properties
      audioElement.currentTime = 0;
      audioElement.src = '';
      audioElement.preload = 'metadata';

      console.log('Audio element reset for new chapter');

      // Set up new audio URL for the next chapter
      if (this.is_audio_available == 1 && this.online) {
        const audioBaseUrl = 'https://api.viviliam.com/assets/voiceover/';
        this.appComponent.audioid =
          audioBaseUrl +
          this.authservice.defaultBibleId +
          '_' +
          this.authservice.defaultBibleVersionText +
          '/' +
          this.authservice.defaultBibleId +
          '_' +
          this.authservice.defaultBookNumber +
          '_' +
          this.authservice.defaultChapterNumber +
          '.mp3';

        // Set the new source
        audioElement.src = this.appComponent.audioid;
        audioElement.preload = 'metadata';

        // Create a new metadata handler for this chapter
        const metadataLoadHandler = () => {
          const duration = audioElement.duration;
          if (duration && !isNaN(duration) && isFinite(duration)) {
            this.appComponent.audioMaxLength = duration;
            this.appComponent.audioMaxLengthDummy = duration;
            this.appComponent.audioDuration = this.convertHMS(
              Math.floor(duration)
            );
            console.log(
              'New chapter audio duration loaded:',
              duration,
              'formatted:',
              this.appComponent.audioDuration
            );
          }
        };

        // Add the new event listener
        audioElement.addEventListener('loadedmetadata', metadataLoadHandler, {
          once: true,
        });

        // Load the metadata for the new chapter
        audioElement.load();

        console.log('New chapter audio URL set:', this.appComponent.audioid);
      }
    }
  }
  swipeLeft(event: any): any {
    alert('Swipe Left');
  }

  swipeRight(event: any): any {
    alert('Swipe Right');
  }
  async shareVerse() {
    // Create the share text here instead of using undefined this.shareText
    let shareText = '';

    // Get the selected verses
    for (let verse of this.authservice.verseList) {
      if (verse.isSelected) {
        shareText += verse.vnumber + '. ' + verse.verse + '\n';
      }
    }

    // Format the text
    shareText = this.formatShareText(shareText);
    shareText =
      this.authservice.selectedBook +
      '\n\n' +
      shareText +
      '\n\nShared via Viviliam\nhttps://app.viviliam.com';

    try {
      await this.shareService.share({
        text: shareText,
        title: 'Viviliam',
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  async sharePassage() {
    // Create the share text here instead of using undefined this.sharePassageText
    let shareText = '';

    // Get all verses in the current chapter
    for (let verse of this.authservice.verseList) {
      if (verse.vnumber && verse.vnumber !== '0' && verse.verse) {
        shareText += verse.vnumber + '. ' + verse.verse + '\n';
      }
    }

    // Format the text
    shareText = this.formatShareText(shareText);
    shareText =
      this.authservice.selectedBook +
      '\n\n' +
      shareText +
      '\n\nShared via Viviliam\nhttps://app.viviliam.com';

    try {
      await this.shareService.share({
        text: shareText,
        title: 'Viviliam',
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }
  onSwipe(event) {
    alert(event.direction);
  }
  playAudio() {
    console.log('udio play in');
    //this.isAudioDisplay=1;
    if (this.isAudioPlaying == 0) {
      this.audio.play();
      this.isAudioPlaying = 1;
    } else {
      this.audio.pause();
      this.isAudioPlaying = 0;
    }
  }
  hideAudio() {
    this.audio.pause;
    this.isAudioDisplay = 0;
  }
  public handleScroll(event): void {
    const shouldLockHeaderOnEntry =
      this.isAutoScroll ||
      Date.now() < this.suppressHeaderToggleUntil ||
      event.detail.scrollTop <= 2;

    if (shouldLockHeaderOnEntry) {
      this.renderer.setStyle(this.header['el'], 'top', '0px');
      document.getElementById('myTabBar').style.display = 'flex';
      this.showBottomNav = 'opacityshow';
      this.lastScrollTop = event.detail.scrollTop;
      return;
    }

    if (this.pageloaded == 'yes') {
      this.authservice.scrollmode = 'POSITION';
      this.authservice.lastread_versescroll = event.detail.scrollTop;
      var qry =
        "update config set value='" +
        event.detail.scrollTop +
        "' where id = 19;";

      console.log('Last read scroll :' + qry);
      this.database
        .executeSql(qry, [])
        .then((data) => {
          console.log('Last read updated ');
        })
        .catch((e) =>
          alert('Last read scroll update error: ' + JSON.stringify(e))
        );
    }
    this.pageloaded = 'yes';

    if (this.maximize_screen == 0) {
      if (this.voiceOverState == 0)
        this.showBottomNav =
          this.lastScrollTop > event.detail.scrollTop
            ? 'opacityshow'
            : 'opacityhide';
      else this.showBottomNav = 'opacityshow';
    }

    // Enhanced fix for header white space issue
    if (
      this.maximize_screen == 0 &&
      this.authservice.fullscreenMode == 1 &&
      !this.isAutoScroll
    ) {
      const headerHeight = 76; // Explicit header height

      if (this.lastScrollTop < event.detail.scrollTop) {
        // Scrolling down - hide header
        this.renderer.setStyle(this.header['el'], 'top', `-${headerHeight}px`);
        this.renderer.setStyle(
          this.header['el'],
          'transition',
          'top 0.3s ease-out'
        );
        document.getElementById('myTabBar').style.display = 'none';
        this.showBottomNav = 'opacityhide';
      } else {
        // Scrolling up - show header
        this.renderer.setStyle(this.header['el'], 'top', '0px');
        this.renderer.setStyle(
          this.header['el'],
          'transition',
          'top 0.3s ease-out'
        );
        document.getElementById('myTabBar').style.display = 'flex';
        this.showBottomNav = 'opacityshow';
      }
    } else if (this.maximize_screen == 0) {
      this.renderer.setStyle(this.header['el'], 'top', '0px');
      document.getElementById('myTabBar').style.display = 'flex';
      this.showBottomNav = 'opacityshow';
    }

    this.lastScrollTop = event.detail.scrollTop;
  }
  toggledrawer() {
    if (this.appComponent.drawer == 'drawershow')
      this.appComponent.drawer = 'drawerhide';
    else this.appComponent.drawer = 'drawershow';
  }
  showhidePopoverMenu() {
    if (this.appComponent.read_popovermenu == 'read-popovermenu-hide')
      this.appComponent.read_popovermenu = 'read-popovermenu-show';
    else this.appComponent.read_popovermenu = 'read-popovermenu-hide';
    this.appComponent.hideAudioPanel();
  }
  showNotes(vid, vnumber) {
    this.database
      .executeSql('select * from vers where vid=' + vid, [])
      .then((data) => {
        if (data.rows.length > 0) {
          //this.authservice.showAlert("","",this.authservice.pageName + " not recorded");
          this.selected_verse_notes_id = vid;
          this.selected_verse_notes = data.rows.item(0).notes;
          this.show_notes_pop = '1';
        }
      });
  }
  hideNotesPop() {
    this.show_notes_pop = '0';
  }
  showNotesEdit() {
    this.authservice.pageMode = 'edit';
    this.authservice.selectedVID = this.selected_verse_notes_id;

    this.router.navigateByUrl('/addnotes');
    this.show_notes_pop = '0';
  }
  playReadAloud() {
    if (
      this.authservice.audio_bibles.indexOf(this.authservice.defaultBibleId) !==
      -1
    ) {
      if (this.isAudioPlaying == 0) {
        this.audioFocusService.requestFocus('read');
        console.log('Starting MP3 audio playback');

        // FIXED: Add the missing timeSpan interval
        this.timeSpan = setInterval(() => {
          if (
            this.appComponent.audio.nativeElement.currentTime &&
            this.appComponent.audio.nativeElement.duration
          ) {
            this.voice_over_current =
              this.convertHMS(
                this.appComponent.audio.nativeElement.currentTime
              ) +
              ' / ' +
              this.convertHMS(this.appComponent.audio.nativeElement.duration);
          }
        }, 1000);

        // UPDATED: Use .mp3 format with version folder structure
        let audioUrl = `https://api.viviliam.com/assets/voiceover/${this.authservice.defaultBibleId}_${this.authservice.defaultBibleVersionText}/${this.authservice.defaultBibleId}_${this.authservice.defaultBookNumber}_${this.authservice.defaultChapterNumber}.mp3`;

        console.log('MP3 Audio URL:', audioUrl);

        this.appComponent.audio.nativeElement.src = audioUrl;
        //this.appComponent.selectedAudioSource = audioUrl;
        this.appComponent.audioState = 'PLAYING';

        this.appComponent.audio.nativeElement
          .play()
          .then(() => {
            console.log('MP3 audio started playing');
            this.isAudioPlaying = 1;
            this.audioplaying = 'voiceover_playing';
          })
          .catch((error) => {
            console.error('Error playing MP3 audio:', error);
            // Clear interval if play fails
            if (this.timeSpan) {
              clearInterval(this.timeSpan);
            }
            Toast.show({
              text: 'Error playing audio. Please try again.',
              duration: 'short',
              position: 'center',
            });
          });
      } else {
        this.pauseReadAloud();
      }
    }
  }

  pauseReadAloud() {
    console.log('Pausing audio playback');

    // IMPORTANT: Clear the timeSpan interval
    if (this.timeSpan) {
      clearInterval(this.timeSpan);
    }

    if (this.appComponent.audio && this.appComponent.audio.nativeElement) {
      this.appComponent.audio.nativeElement.pause();
      this.appComponent.audioState = 'PAUSED';
    }

    this.isAudioPlaying = 0;
    this.audioplaying = 'voiceover_notplaying';
    this.audioFocusService.releaseFocus('read');
  }

  private stopReadAudioPlayback(): void {
    this.pauseReadAloud();
    this.appComponent.closeAudio();
    this.appComponent.hideAudioPanel();
  }

  progressVoiceOver() {
    // This method is now just a wrapper that calls startProgressVoiceOver
    this.startProgressVoiceOver();
  }
  // filepath: d:\vivcaptest11\src\app\read\read.page.ts
  // Modify showAudioPanel to handle network issues better

  // Modify the showAudioPanel method to be less aggressive:
  showAudioPanel() {
    this.online = this.network.isConnected;

    if (this.online) {
      this.audioFocusService.requestFocus('read');
      this.appComponent.audio_panel = 'audio-panel-show';

      // Only initialize audio if it's truly not started
      if (this.appComponent.audioState === 'NOTSTARTED') {
        try {
          // Simple audio initialization without complex event listeners
          this.appComponent.StartAudio(1);
          console.log('Audio initialization started');
        } catch (err) {
          console.error('Error starting audio:', err);
          Toast.show({
            text: 'Error loading audio. Please try again.',
            duration: 'short',
            position: 'bottom',
          });
        }
      }
    } else {
      this.authservice.showAlert('', '', this.authservice.noNetWorkMessage);
    }
  }
  skipForward() {
    this.appComponent.skipForward(15);
  }
  skipBackward() {
    this.appComponent.skipBackward(15);
  }
  maximizeScreen() {
    this.maximize_screen = 1;
    this.renderer.setStyle(this.header['el'], 'top', '-76px');
    document.getElementById('myTabBar').style.display = 'none';
    this.showBottomNav = 'opacityhide';
  }
  minimizeScreen() {
    this.maximize_screen = 0;
    this.renderer.setStyle(this.header['el'], 'top', '0px');
    document.getElementById('myTabBar').style.display = 'flex';
    this.showBottomNav = 'opacityshow';
  }

  // Return to previous reading position from search result
  returnToReading() {
    this.authservice.restoreReadingState();
    this.getVers(); // Reload the content with the restored state
  }

  formatShareText(shareText: string): string {
    shareText = shareText.split('&quot;').join('"');
    shareText = shareText.split('&apos;').join("'");
    shareText = shareText.split('#').join('');
    shareText = shareText.split('$').join('');
    shareText = shareText.split('ṟ').join('');
    shareText = shareText.split('Ṟ').join('');
    shareText = shareText.split('ḇ').join('');
    shareText = shareText.split('Ḇ').join('');
    shareText = shareText.split('[').join('');
    shareText = shareText.split(']').join('');
    shareText = shareText.split('␢').join('');
    shareText = shareText.split('⒫').join('');
    shareText = shareText.split('⒯').join('');
    return shareText;
  }

  // Add a new method to copy text to clipboard without showing toast
  async copyToClipboard(text: string) {
    // Format the text
    text = this.formatShareText(text);

    try {
      await Clipboard.write({
        string: text,
      });
      // Show toast with Capacitor Toast
      await Toast.show({
        text: 'Copied to clipboard',
        duration: 'short',
        position: 'center',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  ionViewWillLeave() {
    this.audioFocusService.releaseFocus('read');

    // Clear the interval when leaving the page
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Save current reading state when leaving the page
    this.saveCurrentState();

    // Release wake lock when leaving the page
    this.appComponent.wakeLockService
      .allowSleepAgain()
      .catch((err) => console.log('Error releasing wake lock:', err));
  }

  saveCurrentState() {
    // Save the current reading position to DatabaseService
    if (this.database) {
      let qry1 =
        "update config set value='" +
        this.authservice.defaultBibleId +
        "' where id = 15;";
      let qry2 =
        "update config set value='" +
        this.authservice.defaultBookNumber +
        "' where id = 16;";
      let qry3 =
        "update config set value='" +
        this.authservice.defaultChapterNumber +
        "' where id = 17;";
      let qry4 =
        "update config set value='" +
        this.authservice.defaultBibleVersionText +
        "' where id = 18;";
      let qry5 =
        "update config set value='" +
        this.authservice.lastread_versescroll +
        "' where id = 19;";
      let qry6 =
        "update config set value='" +
        this.authservice.defaultVersNumber +
        "' where id = 20;";

      console.log('Saving reading state before app close/pause');

      // Execute all queries to ensure state is fully saved
      this.database
        .executeSql(qry1, [])
        .then(() => this.database.executeSql(qry2, []))
        .then(() => this.database.executeSql(qry3, []))
        .then(() => this.database.executeSql(qry4, []))
        .then(() => this.database.executeSql(qry5, []))
        .then(() => this.database.executeSql(qry6, []))
        .then(() => console.log('Reading state successfully saved'))
        .catch((e) =>
          console.error('Error saving reading state:', JSON.stringify(e))
        );
    }
  }
}
