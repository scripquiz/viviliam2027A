import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from '../providers/authservice/authservice';
import {
  LoadingController,
  AlertController,
  Platform,
  NavController,
  IonicModule,
} from '@ionic/angular';
// Remove Cordova ScreenOrientation import
// import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
// Import the new ScreenOrientationService
import { ScreenOrientationService } from './services/screen-orientation.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgModule, ChangeDetectionStrategy } from '@angular/core';

import { ShareService } from './providers/share.service';
// Replace Cordova Toast with Capacitor Toast
import { Toast } from '@capacitor/toast';
import { IonSelect } from '@ionic/angular';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonLoaderService } from '../app/ion-loader.service';
// Remove Insomnia import
// import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
// Import WakeLockService
import { WakeLockService } from './services/wake-lock.service';
// Replace Cordova Network import with our new Capacitor NetworkService
import { NetworkService } from './services/network.service';
import { register } from 'swiper/element/bundle';
// Capacitor imports
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
// Replace Cordova Clipboard with Capacitor Clipboard
import { Clipboard } from '@capacitor/clipboard';
// Import DarkModeService
import { DarkModeService } from './services/dark-mode.service';
import { AudioFocusService } from './services/audio-focus.service';
import { Subscription } from 'rxjs';

register();
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
})
export class AppComponent {
  @ViewChild('mySelect') selectRef: IonSelect;
  @ViewChild('audio') audio;
  public fromid: any = '2';
  public isGlobalDarkMode: boolean = false;
  public isReadDarkMode: boolean = false;
  public isCompareDarkMode: boolean = false;
  public toid: any = '3';
  public database: DatabaseConnection;

  // Dark mode subscription
  private darkModeSubscription: Subscription;

  // Status bar management properties
  private statusBarUpdateTimeout: any;
  private statusBarInitialized: boolean = false;

  private lastReadingPositionRetryCount = 0;
  private readonly lastReadingPositionRetryLimit = 10;

  // Network subscription properties
  public networkConnectSubscription: any;
  public networkDisconnectSubscription: any;
  public bibleList: Array<{ id: number; title: string; language: string }> = [];
  public categoryList: Array<{ id: number; title: string }> = [];
  public books: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksNonEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksFrom: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksTo: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksOldTestament: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksNewTestament: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksOldTestamentNonEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksNewTestamentNonEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksOldTestamentEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];
  public booksNewTestamentEtb: Array<{
    bnumber: number;
    fullname_tamil: string;
    shortname_tamil: string;
    fullname_english: string;
    shortname_english: string;
  }> = [];

  public paragraphToggle: any = false;
  public drawermenu_options_enabledstate: any = '';
  public selectedFontRefreshed: any = false;
  selectedBibleId: any = 3;
  selectedLanguage: any = 'T';
  selectedCategory: any = 1;

  selectedFromBook: any = 1;
  selectedToBook: any = 1;

  prevSelectedFromBook: any = 1;
  prevSelectedToBook: any = 1;

  bibleRefreshed: any = true;
  booksFromRefreshed: any = true;
  booksToRefreshed: any = true;
  categoryRefreshed: any = true;
  bookFromToShow: any = 'show';

  searchOption: any = 'Exact';
  orientation: any;
  public drawer: any = 'drawerhide';
  public drawer_fonts: any = 'drawer-font-hide';
  public drawer_read: any = 'drawer-read-hide';
  public drawer_colors: any = 'drawer-colors-hide'; // Add this property
  public read_popovermenu: any = 'read-popovermenu-hide';
  public compare_popovermenu: any = 'compare-popovermenu-hide';

  public selectedReadngLanguage: any;
  public fontListTamil: any = [];
  public fontListEnglish: any = [];
  public fontList: any = [];
  public readSelectedFont: any;
  public selectedFont: any;
  public selectedFontName: any;
  public textSize: any;

  public colorshow1 = 'hide';
  public colorshow2 = 'hide';
  public colorshow3 = 'hide';
  public colorshow4 = 'hide';
  public colorshow5 = 'hide';
  public colorshow6 = 'hide';
  public colorshow7 = 'hide';
  public colorshow8 = 'hide';
  public colorshow9 = 'hide';
  public colorshow10 = 'hide';
  public signupMenu: any = 'myaccount-signup-menu-hide';
  public myaccountPopover: any = 'myaccount-popover-hide';

  public audio_panel: any = 'audio-panel-hide';
  public audioCurrentTime: any = '0:00';
  public audioDuration: any = '';
  public readaloud_options: any = 'readaloud-options-hide';
  public timer_options: any = 'timer-options-hide';
  public speed_options: any = 'speed-options-hide';
  public play_speed: any = '1';
  public readaloud_selected: any = 'Voice Only';
  public timer_selected: any = 'Off';
  public timeSpan: any;
  public timeSpanBook: any = null; // Track which book the timespan is for
  public timeSpanChapter: any = null; // Track which chapter the timespan is for
  public voiceOverLength: number;
  public voiceOverState: number = 0;
  public voiceOverStarted: number = 0;
  public voiceOverReadingVerse: number = 0;
  public voice_over_current: any = '';

  public isAudioAvailable: any = 0;
  public isAudioPlaying: any = 0;
  public audioid: any;
  public isAudioDisplay: any = 0;
  public audioState: any = 'NOTSTARTED';
  public audioMaxLength: any = 0;
  public audioCurrentTimeSeconds: any = 0;
  public audioMaxLengthDummy: any = 10000;
  public isTextSpanAvailable: any = 0;
  public audioplaying: any = 'voiceover_notplaying';
  public interval: any;
  public timer_seconds: any;
  public timer_chapter: any;
  public timer_selected_option: any;
  public timer_counter_check: any;
  public chapterPlayed: any;
  public navigateToNextVers: any = 0;
  public navigateToPreviousVers: any = 0;
  public navInprogress: any = 0;
  public networkState: any = 0;
  public prevPlayedSeconds: any = 0;
  public timer_audio_played: any = 0;
  public repeat_state: any = 0;
  public repeat_played_count: any = 0;
  public selectedFromBookCaption = '';
  public selectedToBookCaption = '';
  constructor(
    public darkModeService: DarkModeService,
    public network: NetworkService,
    // Replace Insomnia with WakeLockService
    public wakeLockService: WakeLockService,
    public ionLoaderService: IonLoaderService,
    public alertController: AlertController,
    public socialSharing: ShareService,
    public router: Router,
    // Replace ScreenOrientation with ScreenOrientationService
    public screenOrientation: ScreenOrientationService,
    public authservice: AuthserviceProvider,
    public platform: Platform,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    private audioFocusService: AudioFocusService
  ) {
    this.audioFocusService.registerOwner('app', () => {
      this.stopAppAudioPlayback();
    });

    this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      console.log('Back press handler!' + this.constructor.name);
      if (this.authservice.currentPage == 'HOME') navigator['app'].exitApp();
      else this.navctrl.navigateRoot('tabslink/home');
    });
    this.platform.ready().then(() => {
      // Initialize Capacitor plugins
      this.initializeCapacitor();
      this.connectDB();

      // Set up network status monitoring with the new NetworkService
      this.networkConnectSubscription = this.network.connected$.subscribe(
        (isConnected) => {
          console.log('NetworkService connection status changed:', isConnected);

          if (isConnected) {
            // Connected - but verify with an actual connectivity test
            this.checkNetworkAndConnectivity().then((hasRealConnection) => {
              if (hasRealConnection) {
                this.networkState = 1;
                // if (this.isAudioPlaying == 1) {
                //   // Updated to use Capacitor Toast
                //   Toast.show({
                //     text: 'Network connected!',
                //     duration: 'short',
                //     position: 'center'
                //   });
                // }
              }
            });
          } else {
            // Disconnected
            console.log('Network disconnected - updating app state');
            this.networkState = 0;

            // if (this.isAudioPlaying == 1) {
            //   // Updated to use Capacitor Toast
            //   Toast.show({
            //     text: 'Network disconnected! Audio may be interrupted',
            //     duration: 'short',
            //     position: 'center'
            //   });
            // }
          }
        }
      );

      // Also monitor connection type changes
      this.networkDisconnectSubscription =
        this.network.connectionType$.subscribe((connectionType) => {
          console.log('Network connection type changed to:', connectionType);
        });
    });
  }

  // Initialize Capacitor plugins
  async initializeCapacitor() {
    try {
      // Hide splash screen with fade effect
      await SplashScreen.hide({
        fadeOutDuration: 500,
      });

      // Subscribe to dark mode state changes
      this.darkModeSubscription = this.darkModeService.darkModeState$.subscribe(
        (state) => {
          this.isGlobalDarkMode = state.globalDarkMode;
          this.isReadDarkMode = state.readDarkMode;
          this.isCompareDarkMode = state.compareDarkMode;
        }
      );

      // Update status bar based on initial dark mode state
      await this.darkModeService.updateStatusBar();

      // Load last reading position
      this.loadLastReadingPosition();
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }

    // Set up hardware back button handling (in addition to your existing code)
    App.addListener('backButton', () => {
      if (this.authservice.currentPage == 'HOME') {
        App.exitApp();
      } else {
        this.navctrl.navigateRoot('tabslink/home');
      }
    }); // Handle app state changes to ensure reading position is saved
    App.addListener('appStateChange', (state) => {
      console.log('App state changed. Is active:', state.isActive);

      // If app is going to background, save current reading state
      if (!state.isActive) {
        this.saveCurrentReadingState();
      } else {
        // App is resuming from background - reapply status bar settings
        this.darkModeService.updateStatusBar(this.authservice.currentPage);
      }
    });

    // Listen for app resume events to reapply status bar settings
    App.addListener('resume', () => {
      console.log('App resumed - reapplying status bar settings');
      this.darkModeService.updateStatusBar(this.authservice.currentPage);
    });
  } // Helper method to set status bar style based on dark mode preference

  // Debounced status bar update to prevent rapid-fire calls
  checkNetworkAndConnectivity(): Promise<boolean> {
    return new Promise((resolve) => {
      // First use our improved NetworkService
      if (!this.network.isConnected) {
        console.log('Network service reports no connection');
        this.networkState = 0;
        resolve(false);
        return;
      }

      // Use the NetworkService's actual connectivity check
      this.network
        .verifyConnectivity()
        .then((isConnected) => {
          this.networkState = isConnected ? 1 : 0;
          console.log('Active connectivity test result:', isConnected);
          resolve(isConnected);
        })
        .catch((error) => {
          console.log('Active connectivity test failed:', error);
          this.networkState = 0;
          resolve(false);
        });
    });
  }

  showSignupMenu() {
    if (this.signupMenu == 'myaccount-signup-menu-show') {
      this.signupMenu = 'myaccount-signup-menu-hide';
      this.myaccountPopover = 'myaccount-popover-hide';
    } else {
      this.signupMenu = 'myaccount-signup-menu-show';
      this.myaccountPopover = 'myaccount-popover-show';
    }
  }
  hideSignupMenu() {
    this.signupMenu = 'myaccount-signup-menu-hide';
    this.myaccountPopover = 'myaccount-popover-hide';
  }
  ionViewDidEnter() {
    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;
      // Use the new ScreenOrientationService
      this.screenOrientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenOrientation.type);
        if (this.screenOrientation.type == 'landscape-primary') {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
        }
      });
    });
  }

  setLanguage(selectedValue: any) {
    this.setLanguageDDL(selectedValue.currentTarget.value);
  }
  setLanguageDDL(bibleId) {
    this.categoryRefreshed = false;
    this.selectedBibleId = bibleId;
    this.authservice.searchBible = this.selectedBibleId;
    console.log('Selected bible ' + bibleId);
    this.categoryList = [];
    for (var i = 0; i < this.bibleList.length; i++) {
      if (this.bibleList[i].id == bibleId) {
        this.authservice.searchbibleInfo =
          this.bibleList[i].title + ' - ' + this.bibleList[i].language;
        this.authservice.searchInfo =
          this.authservice.searchbibleInfo +
          ' - ' +
          this.authservice.searchcategoryinfo +
          ' - ' +
          this.authservice.searchOption;
      }
    }
    if (bibleId == 3 || bibleId == 4 || bibleId == 5) {
      this.categoryList.push({ id: 1, title: 'முழு வேதாகமம்' });
      this.categoryList.push({ id: 4, title: 'பழைய ஏற்பாடு' });
      this.categoryList.push({ id: 3, title: 'புதிய ஏற்பாடு' });
      this.categoryList.push({ id: 2, title: 'புத்தகங்கள்' });
      this.selectedLanguage = 'T';
      this.authservice.searchLanguage = 'Tamil';
    } else {
      this.categoryList.push({ id: 1, title: 'Whole Bible' });
      this.categoryList.push({ id: 4, title: 'Old Testament' });
      this.categoryList.push({ id: 3, title: 'New Testament' });
      this.categoryList.push({ id: 2, title: 'Selected Books' });
      this.selectedLanguage = 'E';
      this.authservice.searchLanguage = 'English';
    }
    setTimeout(() => {
      this.categoryRefreshed = true;
    }, 300);
    this.bindBooks();
  }
  bindBooks() {
    this.booksFromRefreshed = false;
    this.booksToRefreshed = false;
    this.booksFrom = [];
    this.booksTo = [];
    this.books = [];
    if (this.selectedBibleId == 5) {
      this.books = this.booksEtb;
      this.booksOldTestament = this.booksOldTestamentEtb;
      this.booksNewTestament = this.booksNewTestamentEtb;
    } else {
      this.books = this.booksNonEtb;
      this.booksOldTestament = this.booksOldTestamentNonEtb;
      this.booksNewTestament = this.booksNewTestamentNonEtb;
    }
    console.log('Selected book category ' + this.selectedCategory);
    if (this.selectedCategory == 2) {
      //Selected books
      this.booksFrom = this.books;
      this.booksTo = this.books;

      this.selectedFromBook = this.books[0].bnumber;
      this.selectedToBook = this.books[0].bnumber;
      this.authservice.SearchFromBook = this.selectedFromBook;
      this.authservice.SearchToBook = this.selectedToBook;
    } else if (this.selectedCategory == 3) {
      // New testament
      this.booksFrom = this.booksNewTestament;
      this.booksTo = this.booksNewTestament;

      this.selectedFromBook = this.booksNewTestament[0].bnumber;
      this.selectedToBook =
        this.booksNewTestament[this.booksNewTestament.length - 1].bnumber;
      this.authservice.SearchFromBook = this.selectedFromBook;
      this.authservice.SearchToBook = this.selectedToBook;
    } else if (this.selectedCategory == 4) {
      // Old testament
      this.booksFrom = this.booksOldTestament;
      this.booksTo = this.booksOldTestament;

      this.selectedFromBook = this.booksOldTestament[0].bnumber;
      this.selectedToBook =
        this.booksOldTestament[this.booksOldTestament.length - 1].bnumber;
      this.authservice.SearchFromBook = this.selectedFromBook;
      this.authservice.SearchToBook = this.selectedToBook;
    } //Whole bible
    else {
      this.booksFrom = this.books;
      this.booksTo = this.books;
      this.selectedFromBook = 1;
      this.selectedToBook = 1000;
      this.authservice.SearchFromBook = this.selectedFromBook;
      this.authservice.SearchToBook = this.selectedToBook;
    }
    this.prevSelectedFromBook = this.authservice.SearchFromBook;
    this.prevSelectedToBook = this.authservice.SearchToBook;
    setTimeout(() => {
      this.booksFromRefreshed = true;
      this.booksToRefreshed = true;
    }, 300);
    console.log(
      'set book ' + this.selectedFromBook + ' - ' + this.selectedToBook
    );
  }
  setSearchCategory(selectedValue: any) {
    this.selectedCategory = selectedValue.currentTarget.value;
    if (this.selectedCategory == 1)
      this.authservice.searchcategoryinfo = 'Whole Bible';
    else if (this.selectedCategory == 2)
      this.authservice.searchcategoryinfo = 'Selected Books';
    else if (this.selectedCategory == 3)
      this.authservice.searchcategoryinfo = 'New Testament';
    else if (this.selectedCategory == 4)
      this.authservice.searchcategoryinfo = 'Old Testament';

    if (this.selectedCategory == 2) this.bookFromToShow = 'show';
    else this.bookFromToShow = 'hide';
    this.bindBooks();
    console.log(
      'Selected from ' + this.selectedFromBook + ' to ' + this.selectedToBook
    );
    this.authservice.searchInfo =
      this.authservice.searchbibleInfo +
      ' - ' +
      this.authservice.searchcategoryinfo +
      ' - ' +
      this.authservice.searchOption;
  }
  setSearchOption(selectedValue: any) {
    this.authservice.searchOption = selectedValue.currentTarget.value;
    console.log('search option ' + this.authservice.searchOption);
    this.authservice.searchInfo =
      this.authservice.searchbibleInfo +
      ' - ' +
      this.authservice.searchcategoryinfo +
      ' - ' +
      this.authservice.searchOption;
  }
  setFromBookId(selectedValue: any) {
    //alert ("from starts " + selectedValue.currentTarget.value + "-" + this.selectedToBook);
    debugger;
    this.booksFromRefreshed = false;
    if (
      parseInt(selectedValue.currentTarget.value) >
      parseInt(this.selectedToBook)
    ) {
      this.selectedToBook = selectedValue.currentTarget.value;
      this.authservice.SearchToBook = selectedValue.currentTarget.value;
    }
    //else
    {
      this.authservice.SearchFromBook = selectedValue.currentTarget.value;
      this.prevSelectedFromBook = selectedValue.currentTarget.value;
      this.selectedFromBook = selectedValue.currentTarget.value;
      console.log('search from  ' + this.authservice.SearchFromBook);
    }
    //alert ("from " + this.selectedFromBook + "-" + this.selectedToBook);
    setTimeout(() => {
      this.booksFromRefreshed = true;
    }, 300);
  }
  setToBookId(selectedValue: any) {
    debugger;
    //alert ("to starts " + selectedValue.currentTarget.value + "-" + this.selectedToBook);
    this.booksToRefreshed = false;
    if (
      parseInt(selectedValue.currentTarget.value) <
      parseInt(this.selectedFromBook)
    ) {
      this.selectedFromBook = selectedValue.currentTarget.value;
      this.authservice.SearchFromBook = selectedValue.currentTarget.value;
    }
    //else
    {
      this.authservice.SearchToBook = selectedValue.currentTarget.value;
      this.selectedToBook = selectedValue.currentTarget.value;
      this.prevSelectedToBook = selectedValue.currentTarget.value;
      console.log('search to  ' + this.authservice.SearchToBook);
    }
    //alert ("to " + this.selectedFromBook + "-" + this.selectedToBook);
    setTimeout(() => {
      this.booksToRefreshed = true;
    }, 300);
  }
  connectDB() {
    this.databaseService
      .create({
        name: 'viviliam.db',
        location: 'default',
      })
      .then(async (db: DatabaseConnection) => {
        console.log('DB created @ Search');
        this.database = db;

        try {
          const health = await this.databaseService.verifyCoreSchema(db);
          if (!health.isReady) {
            console.warn(
              'Database schema check failed. Missing tables:',
              health.missingTables.join(', ')
            );
          } else if (!health.coreDataPresent) {
            console.warn(
              'Database schema is present, but core Bible data appears empty.'
            );
          }
        } catch (error) {
          console.error('Database health check failed:', error);
        }

        console.log('Search Initialize data called!');
        if (this.authservice.currentPage == 'SEARCH') {
          this.initializeData();
        }
      });
  }

  initializeData() {
    this.booksFromRefreshed = false;
    this.booksToRefreshed = false;
    this.bibleRefreshed = false;
    this.categoryRefreshed = false;

    this.bibleList = [];
    this.categoryList = [];
    this.books = [];
    this.booksNonEtb = [];
    this.booksEtb = [];
    this.booksFrom = [];
    this.booksTo = [];
    this.booksOldTestament = [];
    this.booksNewTestament = [];
    this.booksOldTestamentNonEtb = [];
    this.booksNewTestamentNonEtb = [];
    this.booksOldTestamentEtb = [];
    this.booksNewTestamentEtb = [];

    this.bibleList.push({ id: 3, language: 'Tamil', title: 'BSI' });
    this.bibleList.push({ id: 4, language: 'Tamil', title: 'ERV' });
    this.bibleList.push({ id: 5, language: 'Tamil', title: 'ETB' });
    this.bibleList.push({ id: 2, language: 'English', title: 'KJV' });
    this.bibleList.push({ id: 1, language: 'English', title: 'WEB' });
    setTimeout(() => {
      this.bibleRefreshed = true;
      setTimeout(() => {
        this.selectedBibleId = this.authservice.defaultBibleId;
      }, 500);
    }, 500);

    this.selectedBibleId = this.authservice.defaultBibleId;
    this.selectedLanguage = this.authservice.defaultBibleLanguage;
    this.authservice.searchLanguage = this.authservice.defaultBibleLanguage;
    //this.selectedLanguage="T";
    //this.authservice.searchLanguage = "Tamil";
    //this.authservice.searchBible = 3;

    // this.categoryList.push({id:1,"title":"முழு வேதாகமம்"});
    // this.categoryList.push({id:4,"title":"பழைய ஏற்பாடு"});
    // this.categoryList.push({id:3,"title":"புதிய ஏற்பாடு"});
    //     this.categoryList.push({id:2,"title":"புத்தகங்கள்"});
    // this.selectedCategory = 1;
    this.setLanguageDDL(this.selectedBibleId);
    var qry;
    qry =
      'select bnumber booknumber,fullname_english,  fullname_tamil,fullname_english, chapters chaptercount from books a order by bnumber';
    this.database.executeSql(qry, []).then(
      (data) => {
        for (var i = 0; i < data.rows.length; i++) {
          console.log('Non ETB book count ' + data.rows.length);
          this.booksNonEtb.push({
            bnumber: data.rows.item(i).booknumber,
            fullname_tamil: data.rows.item(i).fullname_tamil,
            shortname_tamil: '',
            fullname_english: data.rows.item(i).fullname_english,
            shortname_english: '',
          });
          if (data.rows.item(i).booknumber < 40)
            this.booksOldTestamentNonEtb.push({
              bnumber: data.rows.item(i).booknumber,
              fullname_tamil: data.rows.item(i).fullname_tamil,
              shortname_tamil: '',
              fullname_english: data.rows.item(i).fullname_english,
              shortname_english: '',
            });
          else
            this.booksNewTestamentNonEtb.push({
              bnumber: data.rows.item(i).booknumber,
              fullname_tamil: data.rows.item(i).fullname_tamil,
              shortname_tamil: '',
              fullname_english: data.rows.item(i).fullname_english,
              shortname_english: '',
            });
        }
        this.books = this.booksNonEtb;
      },
      (e) => {
        console.log('search non etb books bind select : ' + JSON.stringify(e));
      }
    );

    qry =
      'select bnumber booknumber,fullname_english,  fullname_tamil,fullname_english, chapters chaptercount from books_etb a order by bnumber';
    this.database.executeSql(qry, []).then(
      (data) => {
        for (var i = 0; i < data.rows.length; i++) {
          console.log('ETB book count ' + data.rows.length);
          this.booksEtb.push({
            bnumber: data.rows.item(i).booknumber,
            fullname_tamil: data.rows.item(i).fullname_tamil,
            shortname_tamil: '',
            fullname_english: data.rows.item(i).fullname_english,
            shortname_english: '',
          });
          if (data.rows.item(i).booknumber < 40)
            this.booksOldTestamentEtb.push({
              bnumber: data.rows.item(i).booknumber,
              fullname_tamil: data.rows.item(i).fullname_tamil,
              shortname_tamil: '',
              fullname_english: data.rows.item(i).fullname_english,
              shortname_english: '',
            });
          else
            this.booksNewTestamentEtb.push({
              bnumber: data.rows.item(i).booknumber,
              fullname_tamil: data.rows.item(i).fullname_tamil,
              shortname_tamil: '',
              fullname_english: data.rows.item(i).fullname_english,
              shortname_english: '',
            });
        }
      },
      (e) => {
        console.log('ETB books select : ' + JSON.stringify(e));
      }
    );
  }
  hidedrawermenu() {
    this.drawer = 'drawerhide';
    this.drawer_fonts = 'drawer-font-hide';
    this.drawer_read = 'drawer-read-hide';
    this.read_popovermenu = 'read-popovermenu-hide';
    this.compare_popovermenu = 'compare-popovermenu-hide';
  }
  showfontdrawer() {
    this.drawer_fonts = 'drawer-font-show';
    this.drawer = 'drawerhide';
    this.read_popovermenu = 'read-popovermenu-hide';
    this.compare_popovermenu = 'compare-popovermenu-hide';
    this.drawer_read = 'drawer-read-hide';
    this.hideAudioPanel();
  }
  showreaddrawer() {
    this.drawer_read = 'drawer-read-show';
    this.drawer = 'drawerhide';
    this.read_popovermenu = 'read-popovermenu-hide';
    this.compare_popovermenu = 'compare-popovermenu-hide';
    this.drawer_fonts = 'drawer-font-hide';
    this.hideAudioPanel();
  }
  setFonts() {
    this.selectedFontRefreshed = false;
    var selectedFontNameEnglish, selectedFontNameTamil;
    this.fontListTamil = [];
    this.fontListEnglish = [];
    this.fontList = [];
    var selectedTamil, selectedEnglish;
    this.textSize = this.authservice.textSize;
    this.database
      .executeSql('SELECT * FROM fonts  order by id', [])
      .then((data) => {
        console.log('Fonts count ' + data.rows.length);

        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).language == 'Tamil') {
            this.fontListTamil.push({
              id: data.rows.item(j).id,
              isset: data.rows.item(j).isset,
              font_family: data.rows.item(j).font_family,
              font_text: data.rows.item(j).sample_text,
            });
            console.log('data.rows.item(j).isset' + data.rows.item(j).isset);
            if (data.rows.item(j).isset == 1) {
              this.authservice.fontFamilyTamil = data.rows.item(j).font_family;
              selectedTamil = data.rows.item(j).id;
              selectedFontNameTamil = data.rows.item(j).sample_text;
            }
          } else {
            this.fontListEnglish.push({
              id: data.rows.item(j).id,
              isset: data.rows.item(j).isset,
              font_family: data.rows.item(j).font_family,
              font_text: data.rows.item(j).sample_text,
            });
            if (data.rows.item(j).isset == 1) {
              this.authservice.fontFamilyEnglish =
                data.rows.item(j).font_family;
              selectedEnglish = data.rows.item(j).id;
              selectedFontNameEnglish = data.rows.item(j).sample_text;
            }
          }
        }
        if (this.authservice.defaultBibleLanguage.toUpperCase() == 'TAMIL') {
          this.fontList = [];
          this.fontList = this.fontListTamil;
          this.selectedFont = selectedTamil;
          this.selectedFontName = selectedFontNameTamil;
        } else {
          this.fontList = [];
          this.fontList = this.fontListEnglish;
          this.selectedFont = selectedEnglish;
          this.selectedFontName = selectedFontNameEnglish;
        }
        console.log('Selected font : ' + this.selectedFont);
      });

    setTimeout(() => {
      this.selectedFontRefreshed = true;
    }, 400);
    console.log('Set read font  ' + this.readSelectedFont);
  }
  setSelectedFont(selectedValue: any) {
    var selectedFont = selectedValue.currentTarget.value;
    this.selectedFontName = selectedValue.currentTarget.text;

    this.database
      .executeSql(
        "update fonts set isset = '0' where language='" +
          this.authservice.defaultBibleLanguage +
          "'",
        []
      )
      .then((data) => {
        this.database
          .executeSql("update fonts set isset = '1' where id = ? ", [
            selectedFont,
          ])
          .then((data) => {
            this.database
              .executeSql('select * from  fonts  where id = ? ', [selectedFont])
              .then((data) => {
                if (this.authservice.defaultBibleLanguage == 'Tamil') {
                  this.authservice.fontFamilyTamil =
                    data.rows.item(0).font_family;
                  this.authservice.globalfont = data.rows.item(0).font_family;
                  console.log(
                    'Global font Tamil ' + this.authservice.fontFamilyTamil
                  );
                } else {
                  this.authservice.fontFamilyEnglish =
                    data.rows.item(0).font_family;
                  this.authservice.globalfont = data.rows.item(0).font_family;
                  console.log(
                    'Global font English ' + this.authservice.fontFamilyEnglish
                  );
                }
              });
          });
      });
  }
  onChangeSize(obj) {
    console.log(obj + ' tex rsize');
    this.authservice.textSize = obj.currentTarget.value;

    this; //.textSizeCSS = "zoom" + this.authservice.textSize;
    var qry =
      "update config set value = '" +
      obj.currentTarget.value +
      "' where caption ='FONTSIZE'";

    this.database.executeSql(qry, []).then((data) => {});
  }
  setHighlight(color) {
    // For compare page, disallow highlighting completely
    if (this.authservice.currentPage == 'COMPARE') {
      this.hidedrawermenu();
      return; // Exit the method early
    }

    var qry;
    if (this.authservice.currentPage == 'READ') {
      for (var i = 0; i < this.authservice.verseList.length; i++) {
        if (this.authservice.verseList[i].isSelected) {
          this.authservice.verseList[i].textHighlight = 'color' + color;
          qry =
            "update vers set textHighlight='" +
            'color' +
            color +
            "', highlightOn=CURRENT_TIMESTAMP where vid=" +
            this.authservice.verseList[i].vid;
          this.database.executeSql(qry, []).then((data) => {});
        }
      }
      for (var i = 0; i < this.authservice.verseList.length; i++) {
        this.authservice.verseList[i].isSelected = 0;
      }
      this.authservice.dataLoadedCompare = 0;
    } else {
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        if (this.authservice.verseListCompare[i].isSelected) {
          this.authservice.verseListCompare[i].textHighlight = 'color' + color;
          qry =
            "update vers set textHighlight='" +
            'color' +
            color +
            "', highlightOn=CURRENT_TIMESTAMP where vid=" +
            this.authservice.verseListCompare[i].vid;
          this.database.executeSql(qry, []).then((data) => {});
        }
      }
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        this.authservice.verseListCompare[i].isSelected = 0;
      }
    }
    this.authservice.dataLoaded = 0;
    this.hidedrawermenu();
  }
  removeHighlight(color) {
    var qry;
    if (this.authservice.currentPage == 'READ') {
      for (var i = 0; i < this.authservice.verseList.length; i++) {
        if (
          this.authservice.verseList[i].isSelected &&
          this.authservice.verseList[i].textHighlight == 'color' + color
        ) {
          this.authservice.verseList[i].textHighlight = '';
          if (color == 1) this.colorshow1 = 'hide';
          else if (color == 2) this.colorshow2 = 'hide';
          else if (color == 3) this.colorshow3 = 'hide';
          else if (color == 4) this.colorshow4 = 'hide';
          else if (color == 5) this.colorshow5 = 'hide';
          else if (color == 6) this.colorshow6 = 'hide';
          else if (color == 7) this.colorshow7 = 'hide';
          else if (color == 8) this.colorshow8 = 'hide';
          else if (color == 9) this.colorshow9 = 'hide';
          else if (color == 10) this.colorshow10 = 'hide';
          qry =
            "update vers set textHighlight='' where vid=" +
            this.authservice.verseList[i].vid;
          this.database.executeSql(qry, []).then((data) => {});
        }
      }
      this.authservice.dataLoadedCompare = 0;
    } else {
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        if (
          this.authservice.verseListCompare[i].isSelected &&
          this.authservice.verseListCompare[i].textHighlight == 'color' + color
        ) {
          this.authservice.verseListCompare[i].textHighlight = '';
          if (color == 1) this.colorshow1 = 'hide';
          else if (color == 2) this.colorshow2 = 'hide';
          else if (color == 3) this.colorshow3 = 'hide';
          else if (color == 4) this.colorshow4 = 'hide';
          else if (color == 5) this.colorshow5 = 'hide';
          else if (color == 6) this.colorshow6 = 'hide';
          else if (color == 7) this.colorshow7 = 'hide';
          else if (color == 8) this.colorshow8 = 'hide';
          else if (color == 9) this.colorshow9 = 'hide';
          else if (color == 10) this.colorshow10 = 'hide';
          qry =
            "update vers set textHighlight='' where vid=" +
            this.authservice.verseListCompare[i].vid;
          this.database.executeSql(qry, []).then((data) => {});
        }
      }
    }
    this.authservice.dataLoaded = 0;

    // for(var i=0; i<this.authservice.verseList.length; i++)
    // {

    //   this.authservice.verseList[i].isSelected = 0;

    // }
  }
  setBookMark() {
    if (this.drawermenu_options_enabledstate != 'disabled-drawermenu') {
      var qry;
      for (var i = 0; i < this.authservice.verseList.length; i++) {
        if (this.authservice.verseList[i].isSelected) {
          this.authservice.verseList[i].bookMark = '1';
          qry =
            "update vers set bookMark='1', bookMarkOn=CURRENT_TIMESTAMP where vid=" +
            this.authservice.verseList[i].vid;
          this.database.executeSql(qry, []).then((data) => {});
        }
      }
      for (var i = 0; i < this.authservice.verseList.length; i++) {
        this.authservice.verseList[i].isSelected = 0;
      }
      this.hidedrawermenu();
    } else alert('Selected single verse to add bookmark ');
  }
  openNotesEditPage() {
    this.hideAudioPanel();
    this.authservice.pageMode = 'new';
    if (this.drawermenu_options_enabledstate != 'disabled-drawermenu')
      this.router.navigateByUrl('/addnotes');
    else alert('Selected single verse to enter notes');
  }
  setSelectedLinespacing(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id=10";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber size toggle updtaed');
    });

    this.authservice.lineSpacing = selectedValue.currentTarget.value;
  }
  setSelectedVerseSize(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id=9";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber size toggle updtaed');
    });

    this.authservice.verseNumberSize = selectedValue.currentTarget.value;
  }
  setSelectedVerseSpacing(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id=14";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber size toggle updtaed');
    });

    this.authservice.verseSpacing = selectedValue.currentTarget.value;
  }
  // Modified shareContent method to prevent duplicate toasts
  shareContent(mode) {
    var shareText = '';
    var bookname;
    var cnumber;
    var vnumber;

    if (this.authservice.paragraphMode == 0) {
      if (this.authservice.currentPage == 'READ') {
        // READ page logic remains the same
        for (var i = 0; i < this.authservice.verseList.length; i++) {
          if (this.authservice.verseList[i].isSelected) {
            shareText +=
              this.authservice.verseList[i].vnumber +
              '. ' +
              this.authservice.verseList[i].verse +
              '\n';
            bookname = this.authservice.verseList[i].bookname;
            this.authservice.verseList[i].isSelected = false;
          }
        }
        shareText = shareText.split('&quot;').join('"');
        shareText = shareText.split('&apos;').join("'");
        shareText = shareText.split('#').join('');
        shareText = shareText.split('$').join('');
        shareText = shareText.split('␢').join('');
        shareText = shareText.split('⒫').join('');
        shareText = shareText.split('⒯').join('');
        shareText = shareText.split('ṟ').join('');
        shareText = shareText.split('Ṟ').join('');
        shareText = shareText.split('ḇ').join('');
        shareText = shareText.split('Ḇ').join('');
        shareText = shareText.split('[').join('');
        shareText = shareText.split(']').join('');

        shareText =
          bookname +
          ' ' +
          this.authservice.defaultChapterNumber +
          '\n\n' +
          shareText +
          '\n\nShared via Viviliam\nhttps://app.viviliam.com';
      } else {
        // COMPARE page - use the formatted text with version information
        if (this.authservice.selectedVerseTextForCopy) {
          // Use the pre-formatted text that includes version information
          shareText = this.authservice.selectedVerseTextForCopy;
        } else {
          // Fallback to old method if formatted text is not available
          var versenumber;
          for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
            if (this.authservice.verseListCompare[i].isSelected) {
              versenumber = this.authservice.verseListCompare[i].vnumber;
              const versionTitle = this.authservice.verseListCompare[i].title;

              // Extract plain text from HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML =
                this.authservice.verseListCompare[i].verseData;
              const plainText = tempDiv.textContent || tempDiv.innerText || '';

              // Format with version information
              shareText += `[${versionTitle}] ${this.authservice.verseListCompare[i].bookname} ${this.authservice.defaultChapterNumber}:${versenumber} ${plainText}\n`;

              this.authservice.verseListCompare[i].isSelected = false;
            }
          }
        }

        // Clean up text
        shareText = shareText.split('&quot;').join('"');
        shareText = shareText.split('&apos;').join("'");
        shareText = shareText.split('#').join('');
        shareText = shareText.split('$').join('');
        shareText = shareText.split('␢').join('');
        shareText = shareText.split('⒫').join('');
        shareText = shareText.split('⒯').join('');
        shareText = shareText.split('ṟ').join('');
        shareText = shareText.split('Ṟ').join('');
        shareText = shareText.split('ḇ').join('');
        shareText = shareText.split('Ḇ').join('');
        shareText = shareText.split('[').join('');
        shareText = shareText.split(']').join('');

        // Add footer
        shareText += '\n\nShared via Viviliam\nhttps://app.viviliam.com';

        // Clear selected verses for compare page
        for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
          this.authservice.verseListCompare[i].isSelected = false;
        }
      }

      if (mode == 'SHARE') {
        // Use Capacitor Share plugin instead of Cordova social sharing
        this.socialSharing
          .share({
            text: shareText,
            title: 'Viviliam',
          })
          .catch((err) => {
            console.error('Error sharing content:', err);
          });
      } else {
        Clipboard.write({
          string: shareText,
        }).then(() => {
          // Show toast notification with Capacitor Toast
          Toast.show({
            text: 'Copied to clipboard',
            duration: 'short',
            position: 'center',
          });
        });
      }
      this.authservice.selection = false;
    } else {
      // Paragraph mode logic remains the same
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

      shareText +=
        this.authservice.verseList[0].verseData +
        '\n\nShared via Viviliam\nhttps://app.viviliam.com';

      if (mode == 'SHARE') {
        // Use Capacitor Share plugin instead of Cordova social sharing
        this.socialSharing
          .share({
            text: shareText,
            title: 'Viviliam',
          })
          .catch((err) => {
            console.error('Error sharing content:', err);
          });
      } else {
        Clipboard.write({
          string: shareText,
        }).then(() => {
          // Show toast notification with Capacitor Toast
          Toast.show({
            text: 'Copied to clipboard',
            duration: 'short',
            position: 'center',
          });
        });
      }
      this.authservice.selection = false;
    }

    this.drawer = 'drawerhide';
    this.drawer_fonts = 'drawer-font-hide';
    this.drawer_read = 'drawer-read-hide';
    this.read_popovermenu = 'read-popovermenu-hide';
    for (var i = 0; i < this.authservice.verseList.length; i++) {
      this.authservice.verseList[i].isSelected = 0;
    }
  }
  openNotesPage(objPage) {
    this.authservice.pageName = objPage;
    this.read_popovermenu = 'read-popovermenu-hide';
    this.hidedrawermenu();
    //this.navctrl.navigateRoot("/readmarklist");
    var counter;
    counter = Math.floor(Math.random() * 100);
    //this.router.navigateByUrl("/readmarklist/" + counter);
    this.navctrl.navigateRoot('/readmarklist/' + counter);
  }

  toggleGlobalDarkMode() {
    this.darkModeService.toggleGlobalDarkMode();
    this.read_popovermenu = 'read-popovermenu-hide';
    this.compare_popovermenu = 'compare-popovermenu-hide';
  }

  toggleReadDarkMode() {
    this.darkModeService.toggleReadDarkMode();
    this.read_popovermenu = 'read-popovermenu-hide';
  }

  toggleCompareDarkMode() {
    this.darkModeService.toggleCompareDarkMode();
    this.compare_popovermenu = 'compare-popovermenu-hide';
  }

  setSelectedShowVerseMode(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id=8";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber size toggle updtaed');
    });

    this.authservice.versenumberShow = selectedValue.currentTarget.value;
  }

  setSelectedParagraphMode(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id=4";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber size toggle updtaed');
    });

    this.authservice.paragraphMode = selectedValue.currentTarget.value;
  }
  showLogin() {
    this.router.navigateByUrl('/login');
  }
  showProfile() {
    this.router.navigateByUrl('/myaccount');
  }
  showChangePassword() {
    this.authservice.userId_ForgotPassword = '';
    this.router.navigateByUrl('/change-password');
  }
  doLogout() {
    var qry;
    qry = "UPDATE CONFIG SET value = '' WHERE id = 26";
    console.log('udpate user :' + qry);
    this.database
      .executeSql(qry)
      .then(() => {
        console.log('userid inserted');
      })
      .catch((e) => {
        console.log(
          'Hot fixes config USERID insert error: ' + JSON.stringify(e)
        );
      });

    qry = "UPDATE CONFIG Set value = '' WHERE id = 27";
    console.log('udpate user :' + qry);
    this.database
      .executeSql(qry)
      .then(() => {
        console.log('username inserted');
      })
      .catch((e) => {
        console.log(
          'Hot fixes config USERNAME insert error: ' + JSON.stringify(e)
        );
      });
    this.authservice.userSignedStatus = 0;
    this.authservice.userId = '';
    this.authservice.userFirsletter = '';
    this.hideSignupMenu();
  }
  deleteAccount() {
    this.showConfirm();
  }
  showConfirm() {
    this.alertController
      .create({
        header: 'Confirm Alert',
        subHeader:
          'Your account will be removed from the system. Your Highlights, Bookmarks, and Notes will be permanently deleted.',
        message: 'Are you sure? Do you want to delete your account?',
        cssClass: 'custom-confirm',
        buttons: [
          {
            text: 'YES',
            handler: () => {
              this.doDeleteAccount();
            },
          },
          {
            text: 'NO',
            handler: () => {
              alert('No');
            },
          },
        ],
      })
      .then((res) => {
        res.present();
      });
  }
  doDeleteAccount() {
    //this.ionLoaderService.simpleLoader("Validating data, please wait...");
    var params =
      'delete_account?userid=' + this.authservice.userId + '&device=android';
    this.authservice.execute_api(params, this.deleteaccountResult, this);
  }
  deleteaccountResult(status, objAllData, objThis) {
    //  objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.databaseService
          .create({
            name: 'viviliam.db',
            location: 'default',
          })
          .then((db: DatabaseConnection) => {
            console.log('DB created');
            objThis.database = db;
            objThis.database
              .executeSql(
                "UPDATE vers SET notes = '', textHighlight='', bookMark=0",
                []
              )
              .then((data) => {
                objThis.database
                  .executeSql("UPDATE CONFIG SET value = '' WHERE id = 26", [])
                  .then((data) => {
                    objThis.database
                      .executeSql(
                        "UPDATE CONFIG SET value = '' WHERE id = 27",
                        []
                      )
                      .then((data) => {
                        objThis.authservice.userSignedStatus = 0;
                        objThis.authservice.userId = '';
                        objThis.authservice.userFirsletter = '';
                        objThis.hideSignupMenu();
                        objThis.authservice.showAlert(
                          '',
                          '',
                          objAllData[0]['message']
                        );
                      });
                  });
              });
          });
      }
    }
  }
  hideAudioPanel() {
    this.audio_panel = 'audio-panel-hide';
    this.hideControls();
  }
  readAloud() {
    if (this.isTextSpanAvailable == 1) {
      if (this.readaloud_options == 'readaloud-options-hide') {
        this.readaloud_options = 'readaloud-options-show';
        this.speed_options = 'speed-options-hide';
        this.timer_options = 'timer-options-hide';
      } else this.readaloud_options = 'readaloud-options-hide';
    }
  }
  showTimer() {
    if (this.timer_options == 'timer-options-hide') {
      this.timer_options = 'timer-options-show';
      this.speed_options = 'speed-options-hide';
      this.readaloud_options = 'readaloud-options-hide';
    } else this.timer_options = 'timer-options-hide';
  }
  playSpead() {
    if (this.speed_options == 'speed-options-hide') {
      this.speed_options = 'speed-options-show';
      this.readaloud_options = 'readaloud-options-hide';
      this.timer_options = 'timer-options-hide';
    } else this.speed_options = 'speed-options-hide';
  }
  hideControls() {
    this.speed_options = 'speed-options-hide';
    this.readaloud_options = 'readaloud-options-hide';
    this.timer_options = 'timer-options-hide';
  }
  setSpeed(speed) {
    this.play_speed = speed;
    if (this.audioState == 'PLAYING') this.ContinuePayAudio();
    this.hideControls();
  }
  setReadAloud(option) {
    this.readaloud_selected = option;
    if (this.audioState == 'PLAYING') {
      this.ContinuePayAudio();
      for (var j = 0; j < this.authservice.verseList.length; j++) {
        this.authservice.verseList[j].voiceover = 0;
      }
    }
    this.hideControls();
  }
  setTimer(value, option, countercheck) {
    this.resetAudioState();
    this.audio.nativeElement.pause();
    this.audio.nativeElement.currentTime = 0;
    this.audioCurrentTimeSeconds = 0;
    this.audioCurrentTime = '0:00';
    this.PauseAudio();
    this.hideControls();
    this.timer_selected = value;
    this.timer_selected_option = option;
    this.timer_counter_check = countercheck;
    this.repeat_state = 0;
    this.audioCurrentTimeSeconds = 0;
    this.repeat_played_count = 0;
  }
  setPlayState() {
    if (this.authservice.read_play_state == 0)
      this.authservice.read_play_state = 1;
    else this.authservice.read_play_state = 0;
    this.hideControls();
    this.StartAudio(0);
  }

  StartAudio(force: number = 0) {
    if (this.authservice.currentPage !== 'READ') {
      this.audioFocusService.requestFocus('app');
    }

    console.log('Audio state: ' + this.audioState);
    console.log(
      'Audio URL: https://api.viviliam.com/assets/voiceover/' +
        this.authservice.defaultBibleId +
        '_' +
        this.authservice.defaultBibleVersionText +
        '/' +
        this.authservice.defaultBibleId +
        '_' +
        this.authservice.defaultBookNumber +
        '_' +
        this.authservice.defaultChapterNumber +
        '.json'
    );
    console.log(
      'Audio MP3: https://api.viviliam.com/assets/voiceover/' +
        this.authservice.defaultBibleId +
        '_' +
        this.authservice.defaultBibleVersionText +
        '/' +
        this.authservice.defaultBibleId +
        '_' +
        this.authservice.defaultBookNumber +
        '_' +
        this.authservice.defaultChapterNumber +
        '.mp3'
    );

    // Skip reinitialization if audio is already playing and not forced to restart
    if (this.audioState === 'PLAYING' && force === 0) {
      console.log('Audio already playing, skipping initialization');
      return;
    }

    // Skip reinitialization if audio is paused (and not being forced) - this is key for the panel reopening issue
    if (this.audioState === 'PAUSE' && force === 0) {
      console.log('Audio is paused, keeping current position');
      return;
    }

    if (this.audioState === 'NOTSTARTED' || force === 1) {
      // Check if timespan is already loaded for the current chapter
      const timespanAlreadyLoaded =
        this.timeSpan &&
        this.timeSpan.length > 0 &&
        this.timeSpanBook === this.authservice.defaultBookNumber &&
        this.timeSpanChapter === this.authservice.defaultChapterNumber;

      if (timespanAlreadyLoaded) {
        console.log(
          'Timespan already loaded for Book',
          this.timeSpanBook,
          'Chapter',
          this.timeSpanChapter,
          '- Skipping fetch'
        );

        // Set isTextSpanAvailable since we have valid timespan data
        this.voiceOverLength = this.timeSpan.length;
        this.isTextSpanAvailable = this.voiceOverLength > 0 ? 1 : 0;

        // Still need to set up audio duration and max length
        const newAudioURL =
          'https://api.viviliam.com/assets/voiceover/' +
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

        if (this.audioid !== newAudioURL) {
          this.audioid = newAudioURL;
          this.audio.nativeElement.load();
          this.audio.nativeElement.currentTime = 0;
          this.navInprogress = 0;
          this.prevPlayedSeconds = 0;
        }

        setTimeout(() => {
          this.audioMaxLength = this.audio.nativeElement.duration;
          this.audioDuration = this.convertHMS(this.audioMaxLength);

          if (this.isAudioPlaying == 1) {
            this.ContinuePayAudio();
          } else {
            if (force === 1) {
              this.resetAudioState();
            }
          }
        }, 500);

        return; // Skip fetching timespan
      }

      // Proceed with initialization and fetch timespan
      fetch(
        'https://api.viviliam.com/assets/voiceover/' +
          this.authservice.defaultBibleId +
          '_' +
          this.authservice.defaultBibleVersionText +
          '/' +
          this.authservice.defaultBibleId +
          '_' +
          this.authservice.defaultBookNumber +
          '_' +
          this.authservice.defaultChapterNumber +
          '.json'
      )
        .then((res) => res.json())
        .then((json) => {
          this.timeSpan = json;
          this.timeSpanBook = this.authservice.defaultBookNumber;
          this.timeSpanChapter = this.authservice.defaultChapterNumber;
          console.log(
            'Timespan loaded in StartAudio for Book',
            this.timeSpanBook,
            'Chapter',
            this.timeSpanChapter,
            '- Length:',
            this.timeSpan.length
          );
          this.voiceOverLength = this.timeSpan.length;
          this.isTextSpanAvailable = this.voiceOverLength > 0 ? 1 : 0;

          // Only change audio source if it's not already set to the current chapter
          const newAudioURL =
            'https://api.viviliam.com/assets/voiceover/' +
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

          if (this.audioid !== newAudioURL) {
            this.audioid = newAudioURL;
            this.audio.nativeElement.load();
            this.audio.nativeElement.currentTime = 0;
            this.navInprogress = 0;
            this.prevPlayedSeconds = 0;
          }

          setTimeout(() => {
            this.audioMaxLength = this.audio.nativeElement.duration;
            this.audioDuration = this.convertHMS(this.audioMaxLength);

            if (this.isAudioPlaying == 1) {
              this.ContinuePayAudio();
            } else {
              // Don't reset audio state if we're not restarting
              if (force === 1) {
                this.resetAudioState();
              }
            }
          }, 500);
        })
        .catch((e) => {
          console.log('Error loading JSON timespan data:', e);
          this.isTextSpanAvailable = 0;
          this.voiceOverStarted = 0;
          this.voiceOverState = 0;
          this.audioplaying = 'voiceover_notplaying';

          // Only change audio source if it's not already set
          const newAudioURL =
            'https://api.viviliam.com/assets/voiceover/' +
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

          if (this.audioid !== newAudioURL) {
            this.audioid = newAudioURL;
            this.audio.nativeElement.load();
            this.audio.nativeElement.currentTime = 0;
            this.navInprogress = 0;
            this.prevPlayedSeconds = 0;
          }

          setTimeout(() => {
            this.audioMaxLength = this.audio.nativeElement.duration;
            this.audioDuration = this.convertHMS(this.audioMaxLength);

            if (this.isAudioPlaying == 1) {
              this.ContinuePayAudio();
            } else {
              // Don't reset audio state if we're not restarting
              if (force === 1) {
                this.resetAudioState();
              }
            }
          }, 500);
        });
    }
  }
  PauseAudio() {
    this.audio.nativeElement.pause();
    this.audioState = 0;
    this.audioState = 'PAUSE';
    this.isAudioPlaying = 0;
    this.audioFocusService.releaseFocus('app');
    // Replace Insomnia with WakeLockService
    this.wakeLockService.allowSleepAgain().then(
      () => console.log('success'),
      () => console.log('error')
    );
  }
  ContinuePayAudio() {
    // Replace Insomnia with WakeLockService
    this.wakeLockService.keepAwake().then(
      () => console.log('success'),
      () => console.log('error')
    );
    this.audio.nativeElement.play();
    // Reset wake lock activity timer on audio play
    this.wakeLockService.resetActivity();
    this.audioState = 'PLAYING';
    this.audio.nativeElement.playbackRate = this.play_speed;
    this.isAudioPlaying = 1;
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.audioMaxLength = this.audio.nativeElement.duration;
      this.audioDuration = this.convertHMS(this.audioMaxLength);
      //console.log("audio max length 3" + this.audioMaxLength + "-" + this.audioCurrentTimeSeconds);

      if (this.audioState == 'PLAYING') {
        // Reset wake lock activity timer every 30 seconds during playback
        if (Math.floor(this.audio.nativeElement.currentTime) % 30 === 0) {
          this.wakeLockService.resetActivity();
        }
        this.audioCurrentTimeSeconds =
          (this.audio.nativeElement.currentTime * this.audioMaxLengthDummy) /
          this.audioMaxLength;
        this.audioCurrentTime = this.convertHMS(
          this.audio.nativeElement.currentTime
        );
        if (
          this.timer_selected != 'Off' &&
          Number(this.timer_selected_option) > 0 &&
          Number(this.timer_counter_check) > 0 &&
          Number(this.timer_selected_option) <= 5
        ) {
          if (this.chapterPlayed >= this.timer_counter_check) {
            const completedChapters = this.timer_counter_check;
            this.timer_selected = 'Off';
            this.resetAudioState();
            this.PauseAudio();
            void Toast.show({
              text: `Completed ${completedChapters} chapter${
                completedChapters > 1 ? 's' : ''
              }`,
              duration: 'short',
              position: 'bottom',
            });
          } else {
            if (this.timer_counter_check - this.chapterPlayed > 1)
              this.timer_selected =
                (this.timer_counter_check - this.chapterPlayed).toString() +
                ' Chapters';
            else
              this.timer_selected =
                (this.timer_counter_check - this.chapterPlayed).toString() +
                ' Chapter';
          }
        }
      }
      if (this.navigateToNextVers == 1 || this.navigateToPreviousVers == 1) {
        this.audioCurrentTimeSeconds = 0;
        this.audioDuration = '';
        this.audioCurrentTime = '0:00';
        this.audioState = 'NOTSTARTED';
        this.audio.nativeElement.currentTime = 0;
        this.audioid = '';
        if (
          this.timer_selected != 'Off' &&
          Number(this.timer_selected_option) > 0 &&
          this.isAudioPlaying == 1
        )
          this.resetAudioStateWithoutTimer();
        else this.resetAudioState();
      }
    }, 250);
  }
  onChangeAudioPosition(obj: any) {
    this.audio.nativeElement.pause();
    // Remove any existing loadedmetadata listener to prevent duplicates
    this.audio.nativeElement.removeEventListener('loadedmetadata', () => {
      this.audio.nativeElement.currentTime = obj.target.value;
      this.audioCurrentTimeSeconds =
        (obj.target.value / this.audioMaxLengthDummy) * this.audioMaxLength;
    });

    // Add the loadedmetadata event listener to update the audio position and duration
    this.audio.nativeElement.addEventListener('loadedmetadata', () => {
      this.audio.nativeElement.currentTime =
        (obj.target.value / this.audioMaxLengthDummy) * this.audioMaxLength;
      this.audioCurrentTimeSeconds =
        (this.audio.nativeElement.currentTime * this.audioMaxLengthDummy) /
        this.audioMaxLength;
    });

    // Manually load the audio to trigger loadedmetadata after source change
    this.audio.nativeElement.load();

    // If the audio state is "PLAYING", resume playback
    if (this.audioState === 'PLAYING') {
      this.audio.nativeElement.play();
      this.ContinuePayAudio();
    }
  }

  // onChangeAudioPosition(obj: any)
  // {
  //   setTimeout(() => {
  //     this.audio.nativeElement.load(); // Loads the new source if dynamically changed
  //   }, 100);

  //    setTimeout(() => {

  //     this.audio.nativeElement.currentTime =   obj.target.value;
  //     this.audioCurrentTimeSeconds =  obj.target.value;
  //     this.audioMaxLength = this.audio.nativeElement.duration;
  //     this.audioDuration = this.convertHMS(this.audioMaxLength);

  //    },100);
  //   //this.audioCurrentTimeSeconds =  obj.target.value;
  //   // Listen for the loadedmetadata event to ensure seeking is available
  //   // this.audio.nativeElement.addEventListener('loadedmetadata', () => {
  //   //   // Set current time after metadata is loaded and the audio can be seeked
  //   //   this.audio.nativeElement.currentTime =  obj.target.value;  // Replace with the time you want to start from
  //   //   this.audio.nativeElement.play();  // Start playback if required
  //   // }, { once: true });  // Use { once: true } to remove the event listener after it fires
  //   // this.audioCurrentTimeSeconds =  obj.target.value;
  //   // setTimeout(() => {
  //   // this.audio.nativeElement.pause();
  //   // this.audio.nativeElement.currentTime =   obj.target.value;
  //   // this.audio.nativeElement.play();
  //   // },100);
  //   if(this.audioState == "PLAYING")
  //   {
  //     this.audio.nativeElement.play();
  //     this.ContinuePayAudio();
  //   }
  // }
  convertHMS(sec) {
    if (isNaN(sec)) {
      return '';
    } else {
      var hours = Math.floor(sec / 3600); // get hours
      var minutes = Math.floor((sec - hours * 3600) / 60); // get minutes
      var seconds = Math.floor(sec - hours * 3600 - minutes * 60); //  get seconds
      var hoursOut, minutesOut, secondsOut;
      hoursOut = hours;
      minutesOut = minutes;
      secondsOut = seconds;
      // add 0 if value < 10; Example: 2 => 02
      if (hours < 10) {
        hoursOut = '0' + hours;
      }
      if (minutes < 10) {
        minutesOut = '0' + minutes;
      }
      if (seconds < 10) {
        secondsOut = '0' + seconds;
      }
      if (hours == 0) {
        hoursOut = '';
      }
      return minutesOut + ':' + secondsOut; // Return is HH : MM : SS
    }
  }
  resetAudioState() {
    this.chapterPlayed = 0;
    this.timer_counter_check = 0;
    this.timer_selected = 'Off';
    this.timer_selected_option = 0;
    //this.readaloud_selected = "Voice Only";
    this.prevPlayedSeconds = 0;
    // this.timer_audio_played = 0;
    this.repeat_played_count = 0;
    this.repeat_state = 0;
  }
  resetAudioStateWithoutTimer() {
    console.log('timer nav');
  }
  doNavigateNext() {
    if (this.navInprogress == 0) {
      this.audioCurrentTimeSeconds = 0;
      this.audioCurrentTime = '0:00';
      this.audioDuration = '';
      this.audioState = 'NOTSTARTED';
      this.audio.nativeElement.currentTime = 0;
      this.audioid = '';
      this.resetAudioState();
      this.navigateToPreviousVers = 0;
      this.navigateToNextVers = 1;
      // Don't set navInprogress here - let the progress monitor set it
      // this.navInprogress = 1;
    }
  }
  doNavigatePrevious() {
    if (this.navInprogress == 0) {
      this.audioCurrentTimeSeconds = 0;
      this.audioCurrentTime = '0:00';
      this.audioDuration = '';
      this.audioState = 'NOTSTARTED';
      this.audio.nativeElement.currentTime = 0;
      this.audioid = '';
      this.resetAudioState();
      this.navigateToPreviousVers = 1;
      this.navigateToNextVers = 0;
      // Don't set navInprogress here - let the progress monitor set it
      // this.navInprogress = 1;
    }
  }
  closeAudio() {
    this.PauseAudio();
    this.audio_panel = 'audio-panel-hide';
    this.audioState = 'NOTSTARTED';
    this.audio.nativeElement.currentTime = 0;
    this.audioCurrentTimeSeconds = 0;
    this.audioCurrentTime = '0:00';
    this.audioDuration = '';
    this.audioid = '';
    this.resetAudioState();
    this.isAudioPlaying = 0;
    this.audioFocusService.releaseFocus('app');
    this.hideControls();
  }
  stopAudio() {
    this.PauseAudio();
    this.audioState = 'NOTSTARTED';
    this.audio.nativeElement.currentTime = 0;
    this.audioid = '';
    this.resetAudioState();
    this.isAudioPlaying = 0;
    this.audioFocusService.releaseFocus('app');
  }

  private stopAppAudioPlayback(): void {
    this.closeAudio();
  }
  skipForward(s) {
    if (
      this.audio.nativeElement.duration - this.audio.nativeElement.currentTime >
      s
    ) {
      this.audio.nativeElement.currentTime += s;
      this.audioCurrentTimeSeconds =
        (this.audio.nativeElement.currentTime * this.audioMaxLengthDummy) /
        this.audioMaxLength;
    } else {
      this.audio.nativeElement.currentTime = this.audio.nativeElement.duration;
      this.audioCurrentTimeSeconds =
        (this.audio.nativeElement.currentTime * this.audioMaxLengthDummy) /
        this.audioMaxLength;
    }
  }
  skipBackward(s) {
    if (this.audio.nativeElement.currentTime > s) {
      this.audio.nativeElement.currentTime -= s;
    } else {
      this.audio.nativeElement.currentTime = 0;
    }
  }

  setRepeatState() {
    this.PauseAudio();
    this.timer_counter_check = 0;
    this.timer_selected = 'Off';
    this.timer_selected_option = 0;
    this.audioState = 'NOTSTARTED';
    this.audio.nativeElement.currentTime = 0;
    this.audioid = '';
    this.isAudioPlaying = 0;
    this.repeat_state++;
    // Repeat count tracks only extra plays for the current selection.
    this.repeat_played_count = 0;
    this.audioCurrentTimeSeconds = 0;
    this.audioCurrentTime = '0:00';
    if (this.repeat_state > 3) this.repeat_state = 0;
  }
  public getBibleText(bibleIdParam) {
    var selectedBibleText;
    for (var i = 0; i < this.bibleList.length; i++) {
      if (this.bibleList[i].id == bibleIdParam) {
        selectedBibleText = this.bibleList[i].title;
        break;
      }
    }
    return selectedBibleText;
  }
  public getSelectedCategory(selectedCategoryParam) {
    var selectedCategoryText;
    for (var i = 0; i < this.categoryList.length; i++) {
      if (this.categoryList[i].id == selectedCategoryParam) {
        selectedCategoryText = this.categoryList[i].title;
        break;
      }
    }
    return selectedCategoryText;
  }

  public getSelectedBookFrom(selectedCategoryParam) {
    var selectedBookFrom = 'Book From';
    for (var i = 0; i < this.booksFrom.length; i++) {
      if (this.booksFrom[i].bnumber == selectedCategoryParam) {
        selectedBookFrom =
          this.selectedLanguage == 'T'
            ? this.booksFrom[i].fullname_tamil
            : this.booksFrom[i].fullname_english;
        break;
      }
    }
    return selectedBookFrom;
  }
  public getSelectedBookTo(selectedCategoryParam) {
    var selectedBookTo = 'Book To';
    if (selectedCategoryParam == 1000) {
      selectedBookTo =
        this.selectedLanguage == 'T'
          ? this.booksTo[this.booksTo.length - 1].fullname_tamil
          : this.booksTo[this.booksTo.length - 1].fullname_english;
    }

    for (var i = 0; i < this.booksTo.length; i++) {
      if (this.booksTo[i].bnumber == selectedCategoryParam) {
        selectedBookTo =
          this.selectedLanguage == 'T'
            ? this.booksTo[i].fullname_tamil
            : this.booksTo[i].fullname_english;
        break;
      }
    }
    return selectedBookTo;
  }
  // Clean up subscriptions when component is destroyed
  ngOnDestroy() {
    console.log('AppComponent being destroyed, cleaning up subscriptions');

    this.audioFocusService.releaseFocus('app');
    this.audioFocusService.unregisterOwner('app');

    // Clear status bar update timeout
    if (this.statusBarUpdateTimeout) {
      clearTimeout(this.statusBarUpdateTimeout);
    }

    if (this.networkConnectSubscription) {
      this.networkConnectSubscription.unsubscribe();
    }
    if (this.networkDisconnectSubscription) {
      this.networkDisconnectSubscription.unsubscribe();
    }
  }

  // Load last reading position from database
  loadLastReadingPosition() {
    console.log('Loading last reading position from database');

    if (
      this.authservice.bibleImportInProgress ||
      this.authservice._IS_UPDATE_BIBLE === 1 ||
      ((this.authservice.currentPage === '' ||
        this.authservice.currentPage === 'GETSTARTED') &&
        this.lastReadingPositionRetryCount < this.lastReadingPositionRetryLimit)
    ) {
      this.lastReadingPositionRetryCount++;
      console.log(
        `Deferring last reading position load until startup completes (${this.lastReadingPositionRetryCount}/${this.lastReadingPositionRetryLimit})`
      );
      setTimeout(() => this.loadLastReadingPosition(), 2000);
      return;
    }

    if (!this.database) {
      // Create database connection if it doesn't exist yet
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          this.database = db;
          this.lastReadingPositionRetryCount = 0;
          // Now that we have the database, load the reading position
          this.authservice
            .loadLastReadingPosition(this.database)
            .then((success) => {
              console.log(
                'Last reading position loaded successfully:',
                success
              );
            })
            .catch((error) => {
              console.error('Error loading last reading position:', error);
            });
        })
        .catch((error) => {
          console.error('Error creating database connection:', error);
        });
    } else {
      // Database connection already exists, load reading position
      this.lastReadingPositionRetryCount = 0;
      this.authservice
        .loadLastReadingPosition(this.database)
        .then((success) => {
          console.log('Last reading position loaded successfully:', success);
        })
        .catch((error) => {
          console.error('Error loading last reading position:', error);
        });
    }
  }

  // Save current reading state
  saveCurrentReadingState() {
    console.log('Saving current reading state');

    if (!this.database) {
      console.error('Cannot save reading state: database not initialized');
      return;
    }

    // Only save if we're on the read page
    if (this.authservice.currentPage === 'READ') {
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

      console.log('Saving reading state on app pause/background');

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
    } else {
      console.log('Not on read page, skipping reading state save');
    }
  }
}
