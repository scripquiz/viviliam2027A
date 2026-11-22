import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
// Replace Cordova ScreenOrientation with our Capacitor service
// import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { DarkModeService } from '../services/dark-mode.service';

import { AppComponent } from '../../app/app.component';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SettingsPage implements OnInit {
  public bibleList: any = [];
  public fontListTamil: any = [];
  public fontListEnglish: any = [];
  public comparebibleList: any = [];
  public selectedDefaultBibleId: any = '';
  public database: DatabaseConnection;
  public selectedTheme: any = '';
  public orderRefreshed: any = true;
  public paragraphModeSettings: any = false;
  public versenumberShowSettings: any = false;
  public textSize: any;
  public globalFontTamil: any;
  public globalFontEnglish: any;
  public textSizeCSS: any;
  public bibleRefreshed: any = false;
  public linespaceRefreshed: any = false;
  public verseNumberSizeRefreshed: any = false;
  public versepaceRefreshed: any = false;
  public selectedVerseSize: any = 'small';
  public selectedLineSpacing: any = 'linespacing_1';
  public selectedVerseSpacing: any = 'versespacing_1';
  public selectedLanguage_DailyBibleVerse: any;
  public read_speed: any;
  public selectedLanguage_DailyBibleQuiz: any;
  public selectedLanguage_DailyBibleQuote: any;
  public dailyVerseRefreshed: any = false;
  public readSpeedRefreshed: any = false;
  public dailyQuizRefreshed: any = false;
  public dailyQuoteRefreshed: any = false;
  public paragraphToggleRefreshed: any = false;
  public verseNumberToggleRefreshed: any = false;
  public BSINumberToggleRefreshed: any = false;
  public fontselectedsegmentemode: any = 'TAMIL';
  public paragraphToggle: boolean;
  public fullscreenModeToggle: boolean;
  public verseNumberToggle: boolean;
  public BSINumberToggle: boolean;
  public BSIRedLettersToggle: boolean;
  public TextHighlightToggle: boolean;
  public CompareShowLabelToggle: boolean;
  public orientation: any;
  public tamilTabSelected: any = 'TAMIL';
  public englishTabSelected: any = '';
  public defaultBible: any = '';
  public defaultLanguage: any = '';

  // Dark mode properties
  public isGlobalDarkMode: boolean = false;

  constructor(
    public appComponent: AppComponent,
    public menuCtrl: MenuController,
    public screenorientation: ScreenOrientationService,
    public authservice: AuthserviceProvider,
    public platform: Platform,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    private darkModeService: DarkModeService
  ) {
    console.log('Paragraph mode ' + this.paragraphModeSettings);
    this.platform.ready().then(() => {
      this.globalFontTamil = this.authservice.fontFamilyTamil;
      this.globalFontEnglish = this.authservice.fontFamilyEnglish;
      this.textSizeCSS = 'zoom' + this.authservice.textSize;
      this.textSize = this.authservice.textSize;
      this.defaultBible = this.authservice.defaultBibleVersionText;
      this.defaultLanguage = this.authservice.defaultBibleLanguage;
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then(
          (db: DatabaseConnection) => {
            console.log('Settings constructor device ready started');
            this.database = db;
            this.getBibleList();
            this.setFonts();
            this.setDefaults();
          },
          (e) => {
            alert('table create error: ' + JSON.stringify(e));
          }
        );
    });
  }
  ionViewWillEnter() {
    console.log('View will enter');
    this.menuCtrl.enable(false);
  }
  ionViewDidEnter() {
    this.database.executeSql('select * from config', []).then((data) => {
      for (var i = 0; i < data.rows.length; i++) {
        if (data.rows.item(i).id == 1)
          this.authservice.selectedTheme = data.rows.item(i).value;
        if (data.rows.item(i).id == 4)
          this.authservice.paragraphMode = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 6)
          this.authservice.textSize = data.rows.item(i).value;
        if (data.rows.item(i).id == 8)
          this.authservice.versenumberShow = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 9)
          this.authservice.verseNumberSize = data.rows.item(i).value;
        if (data.rows.item(i).id == 10) {
          this.authservice.lineSpacing = data.rows.item(i).value;
          if (data.rows.item(i).value == 'linespacing_1')
            this.authservice.lineSpacingText = '1x';
          else if (data.rows.item(i).value == 'linespacing_2')
            this.authservice.lineSpacingText = '1.5x';
          else if (data.rows.item(i).value == 'linespacing_3')
            this.authservice.lineSpacingText = '2x';
        }
        if (data.rows.item(i).id == 11)
          this.authservice.dailyVerse = data.rows.item(i).value;
        if (data.rows.item(i).id == 12)
          this.authservice.dailyQuiz = data.rows.item(i).value;
        if (data.rows.item(i).id == 13)
          this.authservice.dailyQuote = data.rows.item(i).value;
        if (data.rows.item(i).id == 14)
          this.authservice.verseSpacing = data.rows.item(i).value;
        if (data.rows.item(i).id == 15)
          this.authservice.lastread_bible = data.rows.item(i).value;
        if (data.rows.item(i).id == 16)
          this.authservice.lastread_book = data.rows.item(i).value;
        if (data.rows.item(i).id == 17)
          this.authservice.lastread_chapter = data.rows.item(i).value;
        if (data.rows.item(i).id == 18)
          this.authservice.lastread_versiontext = data.rows.item(i).value;
        if (data.rows.item(i).id == 19)
          this.authservice.lastread_versescroll = data.rows.item(i).value;
        if (data.rows.item(i).id == 20)
          this.authservice.lastread_versenumber = data.rows.item(i).value;
        if (data.rows.item(i).id == 25)
          this.authservice.BSINumberShow = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 26)
          this.authservice.userId = data.rows.item(i).value;
        if (data.rows.item(i).id == 27)
          this.authservice.userName = data.rows.item(i).value;
        if (data.rows.item(i).id == 29)
          this.authservice.BSIRedLettersShow = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 30)
          this.authservice.CompareShowLabel = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 31)
          this.authservice.fullscreenMode = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 32)
          this.authservice.TextHighlightShow = data.rows.item(i).value; // Keep as string
        if (data.rows.item(i).id == 33) {
          this.authservice.readSpeed = data.rows.item(i).value;
          this.appComponent.play_speed = data.rows.item(i).value;
        }

        if (this.authservice.userId != '') {
          this.authservice.userSignedStatus = 1;
          this.authservice.userFirsletter = this.authservice.userName.charAt(0);
        }
      }

      // Set the toggle states correctly
      this.selectedTheme = this.authservice.selectedTheme;
      this.bibleList = this.authservice.bibleList;
      this.selectedDefaultBibleId = this.authservice.defaultBibleId;
      this.paragraphModeSettings = this.authservice.paragraphMode;

      console.log(
        'Settings construction paragraphmode ' + this.authservice.paragraphMode
      );
      console.log(
        'Settings construction fullscreen ' + this.authservice.fullscreenMode
      );
      console.log(
        'BSIRedLettersShow from DB: ' + this.authservice.BSIRedLettersShow
      );
      console.log('BSINumberShow from DB: ' + this.authservice.BSINumberShow);
      console.log(
        'TextHighlightShow from DB: ' + this.authservice.TextHighlightShow
      );

      // Convert string values to boolean for toggle controls
      this.paragraphToggle = this.authservice.paragraphMode == '1';
      this.fullscreenModeToggle = this.authservice.fullscreenMode == '1';
      this.verseNumberToggle = this.authservice.versenumberShow == '1';
      this.BSINumberToggle = this.authservice.BSINumberShow == '1';
      this.BSIRedLettersToggle = this.authservice.BSIRedLettersShow == '1';
      this.TextHighlightToggle = this.authservice.TextHighlightShow == '1';
      this.CompareShowLabelToggle = this.authservice.CompareShowLabel == '1';

      this.versenumberShowSettings = this.authservice.versenumberShow;
      this.selectedLineSpacing = this.authservice.lineSpacing;
      this.selectedVerseSize = this.authservice.verseNumberSize;
      this.selectedVerseSpacing = this.authservice.verseSpacing;
      this.selectedLanguage_DailyBibleVerse = this.authservice.dailyVerse;
      this.read_speed = this.authservice.readSpeed;
      this.selectedLanguage_DailyBibleQuiz = this.authservice.dailyQuiz;
      this.selectedLanguage_DailyBibleQuote = this.authservice.dailyQuote;

      // Load dark mode states
      this.loadDarkModeStates();
    });
  }

  ngOnInit() {
    // Subscribe to dark mode changes
    this.darkModeService.darkModeState$.subscribe((state) => {
      this.isGlobalDarkMode = state.globalDarkMode;
    });
  }

  loadDarkModeStates() {
    const state = this.darkModeService.getCurrentState();
    this.isGlobalDarkMode = state.globalDarkMode;
  }

  toggleGlobalDarkMode(event: any) {
    this.darkModeService.toggleGlobalDarkMode(event.detail.checked);
  }

  setDefaults() {
    console.log('Settings view did entered');
    this.bibleRefreshed = false;
    this.orderRefreshed = false;
    this.linespaceRefreshed = false;
    this.verseNumberSizeRefreshed = false;
    this.versepaceRefreshed = false;
    this.dailyQuizRefreshed = false;
    this.dailyVerseRefreshed = false;
    this.readSpeedRefreshed = false;
    this.dailyQuoteRefreshed = false;
    this.verseNumberSizeRefreshed = false;
    this.selectedTheme = this.authservice.selectedTheme;
    this.bibleList = this.authservice.bibleList;
    this.selectedDefaultBibleId = this.authservice.defaultBibleId;
    this.paragraphModeSettings = this.authservice.paragraphMode;

    console.log(
      'Settings construction paragraphmode ' + this.authservice.paragraphMode
    );
    console.log(
      'Settings construction fullscreen ' + this.authservice.fullscreenMode
    );

    // Convert string values to boolean for toggle controls
    this.paragraphToggle = this.authservice.paragraphMode == '1';
    this.fullscreenModeToggle = this.authservice.fullscreenMode == '1';
    this.verseNumberToggle = this.authservice.versenumberShow == '1';
    this.BSINumberToggle = this.authservice.BSINumberShow == '1';
    this.BSIRedLettersToggle = this.authservice.BSIRedLettersShow == '1';
    this.TextHighlightToggle = this.authservice.TextHighlightShow == '1';
    this.CompareShowLabelToggle = this.authservice.CompareShowLabel == '1';

    this.versenumberShowSettings = this.authservice.versenumberShow;
    this.selectedLineSpacing = this.authservice.lineSpacing;
    this.selectedVerseSize = this.authservice.verseNumberSize;
    this.selectedVerseSpacing = this.authservice.verseSpacing;
    this.selectedLanguage_DailyBibleVerse = this.authservice.dailyVerse;
    this.read_speed = this.authservice.readSpeed;
    this.selectedLanguage_DailyBibleQuiz = this.authservice.dailyQuiz;
    this.selectedLanguage_DailyBibleQuote = this.authservice.dailyQuote;

    console.log(
      'Daily bible language :' + this.selectedLanguage_DailyBibleVerse
    );
    console.log(
      'Daily quote language :' + this.selectedLanguage_DailyBibleQuote
    );

    setTimeout(() => {
      this.bibleRefreshed = true;
      this.orderRefreshed = true;
      this.linespaceRefreshed = true;
      this.versepaceRefreshed = true;
      this.verseNumberSizeRefreshed = true;
      this.dailyQuizRefreshed = true;
      this.dailyVerseRefreshed = true;
      this.readSpeedRefreshed = true;
      this.dailyQuoteRefreshed = true;
      this.paragraphToggleRefreshed = true;
      this.verseNumberToggleRefreshed = true;
      this.BSINumberToggleRefreshed = true;
    }, 400);

    this.platform.ready().then(() => {
      // Set initial orientation from the service
      this.orientation = this.authservice.orientation;

      // Use the Capacitor ScreenOrientationService's onChange method to detect orientation changes
      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (
          this.screenorientation.type == 'landscape-primary' ||
          this.screenorientation.type == 'landscape-secondary'
        ) {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
        }
      });
    });
    console.log('Paragraph mode entered ' + this.paragraphModeSettings);
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
    this.authservice.lineSpacingText = selectedValue.currentTarget.text;
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

  setSelectedShowVerseMode(selectedValue: any) {
    this.verseNumberToggle = selectedValue.detail.checked;
    var qry =
      "update config set value = '" +
      (this.verseNumberToggle ? '1' : '0') +
      "' where id=8";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Versenumber sow toggle updtaed');
    });

    this.authservice.versenumberShow = this.verseNumberToggle;
    this.authservice.dataLoaded = 0;
  }
  setSelectedBSINumberShow(selectedValue: any) {
    this.BSINumberToggle = selectedValue.detail.checked;
    var qry =
      "update config set value = '" +
      (this.BSINumberToggle ? '1' : '0') +
      "' where id=25";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('BSI Number showtoggle updtaed');
    });

    this.authservice.BSINumberShow = this.BSINumberToggle;
    this.authservice.dataLoaded = 0;
  }

  setSelectedBSIRedLettersShow(selectedValue: any) {
    this.BSIRedLettersToggle = selectedValue.detail.checked;
    var qry =
      "update config set value = '" +
      (this.BSIRedLettersToggle ? '1' : '0') +
      "' where id=29";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('BSI Number showtoggle updtaed');
    });

    this.authservice.BSIRedLettersShow = this.BSIRedLettersToggle;
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }

  setSelecteTextHighlightShow(selectedValue: any) {
    this.TextHighlightToggle = selectedValue.detail.checked;
    var qry =
      "update config set value = '" +
      (this.TextHighlightToggle ? '1' : '0') +
      "' where id=32";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Text Highlight showtoggle updtaed');
    });

    this.authservice.TextHighlightShow = this.TextHighlightToggle;
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
    if (
      this.TextHighlightToggle == true &&
      this.appComponent.isTextSpanAvailable == 1
    )
      this.appComponent.setReadAloud('Highlight');
    else this.appComponent.setReadAloud('Voice Only');
  }

  setCompareLabel(selectedValue: any) {
    this.CompareShowLabelToggle = selectedValue.detail.checked;
    var qry =
      "update config set value = '" +
      (this.CompareShowLabelToggle ? '1' : '0') +
      "' where id=25";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('BSI Number showtoggle updtaed');
    });

    this.authservice.CompareShowLabel = this.CompareShowLabelToggle;
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }
  setSelectedParagraphMode(selectedValue: any) {
    this.paragraphToggle = selectedValue.detail.checked;

    var qry =
      "update config set value = '" +
      (this.paragraphToggle ? '1' : '0') +
      "' where id=4";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Paragraph mode  toggle updtaed');
    });

    this.authservice.paragraphMode = this.paragraphToggle;
    this.authservice.dataLoaded = 0;
  }

  setSelectedFullscreenMode(selectedValue: any) {
    this.fullscreenModeToggle = selectedValue.detail.checked;

    var qry =
      "update config set value = '" +
      (this.fullscreenModeToggle ? '1' : '0') +
      "' where id=31";
    console.log(selectedValue.currentTarget.value + ' - ' + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Fullscreen mode  toggle updtaed');
    });

    this.authservice.fullscreenMode = this.fullscreenModeToggle;
    //this.authservice.dataLoaded=0;
  }

  setFonts() {
    this.fontListTamil = [];
    this.fontListEnglish = [];
    this.database
      .executeSql('SELECT * FROM fonts  order by id', [])
      .then((data) => {
        console.log('Books count ' + data.rows.length);

        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).language == 'Tamil') {
            this.fontListTamil.push({
              id: data.rows.item(j).id,
              isset: data.rows.item(j).isset,
              font_family: data.rows.item(j).font_family,
              font_text:
                "<span class='" +
                data.rows.item(j).font_family +
                " fontsize_tamil'>" +
                data.rows.item(j).sample_text +
                '</span>',
            });
            if (data.rows.item(j).isset == '1')
              this.authservice.fontFamilyTamil = data.rows.item(j).font_family;
          } else {
            this.fontListEnglish.push({
              id: data.rows.item(j).id,
              isset: data.rows.item(j).isset,
              font_family: data.rows.item(j).font_family,
              font_text:
                "<span class='" +
                data.rows.item(j).font_family +
                " fontsize_english'>" +
                data.rows.item(j).sample_text +
                '</span>',
            });
            if (data.rows.item(j).isset == '1')
              this.authservice.fontFamilyEnglish =
                data.rows.item(j).font_family;
          }
        }
      });
  }
  setFont(language, fontid, fontindex) {
    this.database
      .executeSql(
        "update fonts set isset = '0' where language='" + language + "'",
        []
      )
      .then((data) => {
        this.database
          .executeSql("update fonts set isset = '1' where id = ? ", [fontid])
          .then((data) => {
            if (language == 'Tamil') {
              for (var i = 0; i < this.fontListTamil.length; i++)
                this.fontListTamil[i].isset = '0';
              this.fontListTamil[fontindex].isset = '1';
              this.authservice.fontFamilyTamil =
                this.fontListTamil[fontindex].font_family;
              console.log(
                'Global font Tamil ' + this.authservice.fontFamilyTamil
              );
            }
            if (language == 'English') {
              for (var i = 0; i < this.fontListEnglish.length; i++)
                this.fontListEnglish[i].isset = '0';
              this.fontListEnglish[fontindex].isset = '1';
              this.authservice.fontFamilyEnglish =
                this.fontListEnglish[fontindex].font_family;
              console.log(
                'Global font English ' + this.authservice.fontFamilyEnglish
              );
            }
          });
      });
  }

  getSelectedBible() {
    this.database
      .executeSql("update bibles set defaultbible = '0'", [])
      .then((data) => {
        this.database
          .executeSql("update bibles set defaultbible = '1' where id = ? ", [
            this.selectedDefaultBibleId,
          ])
          .then((data) => {
            this.authservice.defaultBibleId = this.selectedDefaultBibleId;
            this.authservice.dataLoaded = 0;
            this.authservice.dataLoadedCompare = 0;

            this.getBibleList();
          });
      });
  }
  getBibleList() {
    this.bibleRefreshed = false;
    this.database
      .executeSql('SELECT * FROM bibles order by seq', [])
      .then((data) => {
        console.log('Books count ' + data.rows.length);
        this.authservice.bibleList = [];
        this.bibleList = [];
        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).defaultbible == '1') {
            this.authservice.defaultBibleId = data.rows.item(j).id;
            this.authservice.defaultBibleVersionText = data.rows.item(j).title;
            this.selectedDefaultBibleId = data.rows.item(j).id;
            this.authservice.defaultBibleLanguage = data.rows.item(j).language;
            this.defaultBible = this.authservice.defaultBibleVersionText;
            this.defaultLanguage = this.authservice.defaultBibleLanguage;
            this.appComponent.initializeData();
          }

          this.authservice.bibleList.push({
            id: data.rows.item(j).id,
            title: data.rows.item(j).title,
            language: data.rows.item(j).language,
            defaultbible: data.rows.item(j).defaultbible,
          });
        }
        this.bibleList = this.authservice.bibleList;
        setTimeout(() => {
          this.bibleRefreshed = true;
        }, 300);
        this.getCompareBibleList();
      });
  }

  getCompareBibleList() {
    this.orderRefreshed = false;
    this.database
      .executeSql(
        "SELECT * FROM comparebibles where id not in (select id from bibles where defaultbible='1') order by seq asc",
        []
      )
      .then((data) => {
        //this.database.executeSql("SELECT * FROM comparebibles order by seq asc", []).then((data) => {
        console.log('Compare Books list count ' + data.rows.length);
        this.authservice.comparebibleList = [];
        this.comparebibleList = [];
        for (var j = 0; j < data.rows.length; j++) {
          console.log(
            'id' +
              data.rows.item(j).id +
              'isshow' +
              data.rows.item(j).isshow +
              'title' +
              data.rows.item(j).title +
              'language' +
              data.rows.item(j).language +
              'defaultbible' +
              data.rows.item(j).defaultbible
          );
          this.authservice.comparebibleList.push({
            id: data.rows.item(j).id,
            isshow: data.rows.item(j).isshow,
            title: data.rows.item(j).title,
            language: data.rows.item(j).language,
            defaultbible: data.rows.item(j).defaultbible,
          });
        }
        this.comparebibleList = this.authservice.comparebibleList;
        setTimeout(() => {
          this.orderRefreshed = true;
        }, 300);
      });
  }

  goBack() {
    console.log('back');
    if (this.authservice.backToPage == 'compare')
      this.navctrl.navigateRoot('/tabslink/compare');
    else if (this.authservice.backToPage == 'read')
      this.navctrl.navigateRoot('/tabslink/read');
    else if (this.authservice.backToPage == 'more')
      this.navctrl.navigateRoot('/tabslink/more');
  }
  onRenderItems(event) {
    console.log(`Moving item from ${event.detail.from} to ${event.detail.to}`);
    let draggedItem = this.comparebibleList.splice(event.detail.from, 1)[0];
    this.comparebibleList.splice(event.detail.to, 0, draggedItem);
    //this.listItems = reorderArray(this.listItems, event.detail.from, event.detail.to);
    event.detail.complete();
    this.cIDX = 0;
    this.authservice.dataLoadedCompare = 0;
    this.updateCompareBibles();
  }

  public cIDX = 0;
  updateCompareBibles() {
    if (this.cIDX < this.comparebibleList.length) {
      var qry =
        'update  comparebibles set seq = ' +
        this.cIDX +
        ' where id=' +
        [this.comparebibleList[this.cIDX].id];
      console.log('Compare update qry:' + qry);
      this.database.executeSql(qry, []).then((data) => {
        this.cIDX++;
        this.updateCompareBibles();
      });
    }
  }
  notifyToggle(event: any, bibleid) {
    var qry =
      'update comparebibles set isshow = ' +
      event.target.checked +
      ' where id= ' +
      bibleid;
    console.log(event.target.checked + ' - ' + bibleid + ' qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('toggle updtaed');
    });
    this.authservice.dataLoadedCompare = 0;
  }
  setLanguage(selectedValue: any, pagetype) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id= " +
      pagetype;
    console.log(
      selectedValue.currentTarget.value + ' - ' + pagetype + ' qry ' + qry
    );
    this.database.executeSql(qry, []).then((data) => {
      console.log('Language  updtaed' + pagetype);
    });
    if (pagetype == 11) {
      this.authservice.dailyVerse = selectedValue.currentTarget.value;
    } else if (pagetype == 12) {
      this.authservice.dailyQuiz = selectedValue.currentTarget.value;
    }
    if (pagetype == 13) {
      this.authservice.dailyQuote = selectedValue.currentTarget.value;
    }
  }
  setReadSpeed(selectedValue: any) {
    var qry =
      "update config set value = '" +
      selectedValue.currentTarget.value +
      "' where id= 33";
    console.log(selectedValue.currentTarget.value + ' -33 qry ' + qry);
    this.database.executeSql(qry, []).then((data) => {
      console.log('Language  updtaed 33');
    });
    this.authservice.readSpeed = selectedValue.currentTarget.value;
    this.appComponent.play_speed = selectedValue.currentTarget.value;
  }
  onChangeSize(obj) {
    console.log(obj + ' tex rsize');
    this.authservice.textSize = obj.currentTarget.value;

    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    var qry =
      "update config set value = '" +
      obj.currentTarget.value +
      "' where caption ='FONTSIZE'";

    this.database.executeSql(qry, []).then((data) => {});
  }
  restoreDefaults() {}
}
