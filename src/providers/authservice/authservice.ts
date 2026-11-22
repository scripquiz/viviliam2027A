import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthserviceProvider {
  API_URL = 'https://api.viviliam.com/api/';
  //API_URL="http://apitest.viviliam.com/api/";
  //API_URL="https://gracematrimony.com/api/";

  items: any;
  result: any;
  allData: any;
  api_status: any;

  public _DB_VERSION: any = '40809'; // Changed to string to match what's stored in the DB
  public _IS_UPDATE_BIBLE: any = 0;
  public bibleImportInProgress: boolean = false;
  public defaultBibleId: any = 3;
  public defaultBibleVersionText: any = 'BSI';
  public defaultBibleLanguage: any = 'Tamil';
  public defaultBookNumber: any = 1;
  public defaultBookText: any = '';
  public defaultChapterNumber: any = 1;
  public defaultVersNumber: any = 1;
  public compareVersions: any = [];

  public bibleList: any = [];
  public comparebibleList: any = [];
  public timerState: any = 'NO';
  public backToPage: any = '';
  public currentPage: any = '';

  public searchBible: any = '3';
  public SearchFromBook: any = 1;
  public SearchToBook: any = 100;
  public searchLanguage: any = 'T';
  public searchbibleInfo: any = 'BSI - Tamil';
  public searchcategoryinfo: any = 'Whole Bible';
  public searchOption: any = 'exact';

  public fontFamilyTamil: any = 'Default';
  public fontFamilyEnglish: any = 'Besley';

  public selectedTheme: any = '';
  public paragraphMode: any = false;
  public fullscreenMode: any = true;
  public versenumberShow: any = true;
  public BSINumberShow: any = false;
  public BSIRedLettersShow: any = false;
  public TextHighlightShow: any = false;
  public CompareShowLabel: any = true;
  public verseNumberSize: any = 'versenosmall';
  public lineSpacing: any = 'linespacing_1';
  public lineSpacingText = '1x';
  public textSize: any = '3';
  public orientation: any = 'portrait';
  public dailyVerse: any = 'TAMIL';
  public readSpeed: any = '1';
  public dailyQuiz: any = 'ENGLISH';
  public dailyQuote: any = 'TAMIL';
  public verseSpacing: any = 'versespacing_1';
  public readMode: any = 'chapter';
  public totalVerseInchapter: any;
  public default_language: any = 'Tamil';
  public default_bibleid: any = '3';
  public noNetWorkMessage =
    'No internet connection. Please connect your device to the internet and try again.';
  public serverDownMessage =
    'Service temporarily not available. Please try again later.';
  public bold_words: any[] = [];
  public defaultbibleid_setforsearch: any = false;
  public appstartesstae = '0';
  public lastread_bible = '';
  public lastread_book = '';
  public lastread_chapter = '';
  public lastread_versescroll = '0';
  public lastread_versiontext = '';
  public lastread_versenumber = '1';
  public scrollmode = 'POSITION';
  public globalfont: any = '';
  public verseList: any = [];
  public verseList_compare: any = [];
  public verseListCompare: any = [];
  public pageName: any = 'Highlights';
  public pageMode: any = '';
  public selectedVID: any = '';
  public listPageFrom: any = '';
  public selection: any = false;
  public searchInfo: any = '';
  public dataLoaded: any = 0;
  public dataLoadedCompare: any = 0;
  public userSignedStatus = 0;
  public userId: any = '';
  public userName: any = '';
  public totalChapters: any;
  public totalBooks: any;
  public selectedBook: any;
  public selectedVersion: any;
  public userFirsletter: any;
  public showsign: any = 0;
  public userId_ForgotPassword: any = '';
  public promoslide: any = 0;
  public loginRedirected: any = 1;
  public compareBibleId: any = 0;
  public actualDefaultBibleId: any = 0;

  // Variables for managing search and reading states
  public isViewingSearchResult: boolean = false;
  public savedReadingState: any = {
    bibleId: '',
    bookNumber: 0,
    chapterNumber: 0,
    verseNumber: 0,
    scrollPosition: 0,
    bibleVersionText: '',
  };
  public searchResultReference: string = ''; // To display which search result is being viewed

  public read_play_state: any = 0;
  public audio_bibles: any = '';
  public selected_language_for_bookselector_read: any;
  public selected_language_for_bookselector_compare: any;
  public audio_available_bibles: any = '2,3,5';
  selectedVerseTextForCopy: string;
  selectedVersesArray: any[];
  constructor(
    private http: HttpClient,
    public alertController: AlertController
  ) {
    console.log('Authservice constructor entered');
  }

  execute_api(params: any, callBackSet: any, objThis: any) {
    var url = this.API_URL + params;
    url = encodeURI(url);
    this.items = null;
    this.result = null;
    this.allData = null;
    this.api_status = null;
    console.log(url);
    const timeoutValue = 5000;

    this.http
      .get(url)
      .pipe(timeout(timeoutValue))
      .subscribe(
        (data) => {
          callBackSet(true, data, objThis);
        },
        (err) => {
          if (err.name && err.name === 'TimeoutError') {
            callBackSet(false, 'Request timed out', objThis);
          } else {
            callBackSet(false, err.message, objThis);
          }
        }
      );
  }

  showAlert(header: any, subheader: any, message: any) {
    this.alertController
      .create({
        message: message,
        cssClass: 'custom-alert',
        buttons: ['OK'],
      })
      .then((res) => {
        res.present();
      });
  }

  // Save current reading position when navigating to search results
  saveReadingState() {
    this.savedReadingState = {
      bibleId: this.defaultBibleId,
      bookNumber: this.defaultBookNumber,
      chapterNumber: this.defaultChapterNumber,
      verseNumber: this.defaultVersNumber,
      scrollPosition: this.lastread_versescroll,
      bibleVersionText: this.defaultBibleVersionText,
    };
  }

  // Restore previous reading position
  restoreReadingState() {
    if (this.savedReadingState.bibleId) {
      this.defaultBibleId = this.savedReadingState.bibleId;
      this.defaultBookNumber = this.savedReadingState.bookNumber;
      this.defaultChapterNumber = this.savedReadingState.chapterNumber;
      this.defaultVersNumber = this.savedReadingState.verseNumber;
      this.lastread_versescroll = this.savedReadingState.scrollPosition;
      this.defaultBibleVersionText = this.savedReadingState.bibleVersionText;
      this.isViewingSearchResult = false;
      this.searchResultReference = '';
      this.dataLoaded = 0; // Force reload of the page
    }
  }

  // Load last reading position from database
  loadLastReadingPosition(database: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!database) {
        resolve(false);
        return;
      }

      // Query to get all reading position data at once
      const query =
        'SELECT id, value FROM config WHERE id IN (15, 16, 17, 18, 19, 20)';

      database
        .executeSql(query, [])
        .then((data: any) => {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              const row = data.rows.item(i);

              switch (row.id) {
                case 15: // Bible ID
                  this.lastread_bible = row.value || '3'; // Default to BSI if not set
                  this.defaultBibleId = row.value || '3';
                  break;
                case 16: // Book number
                  this.lastread_book = row.value || '1'; // Default to Genesis if not set
                  this.defaultBookNumber = row.value || '1';
                  break;
                case 17: // Chapter number
                  this.lastread_chapter = row.value || '1'; // Default to chapter 1 if not set
                  this.defaultChapterNumber = row.value || '1';
                  break;
                case 18: // Version text
                  this.lastread_versiontext = row.value || 'BSI'; // Default to BSI if not set
                  this.defaultBibleVersionText = row.value || 'BSI';
                  break;
                case 19: // Verse scroll position
                  this.lastread_versescroll = row.value || '0';
                  break;
                case 20: // Verse number
                  this.lastread_versenumber = row.value || '1'; // Default to verse 1 if not set
                  this.defaultVersNumber = row.value || '1';
                  break;
              }
            }
            console.log('Last reading position loaded successfully');
            this.appstartesstae = '1'; // Mark that app has started and data is loaded
            resolve(true);
          } else {
            console.log('No last reading position found');
            resolve(false);
          }
        })
        .catch((error: any) => {
          console.error(
            'Error loading last reading position:',
            JSON.stringify(error)
          );
          reject(error);
        });
    });
  }
}
