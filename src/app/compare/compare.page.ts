import {
  ViewEncapsulation,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController, IonContent } from '@ionic/angular';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { MenuController } from '@ionic/angular';
// Replace Cordova ScreenOrientation with our Capacitor service
// import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { ScreenOrientationService } from '../services/screen-orientation.service';
// Import Capacitor Toast
import { Toast } from '@capacitor/toast';
import { DarkModeService } from '../services/dark-mode.service';
import { Subscription } from 'rxjs';

import { AppComponent } from '../../app/app.component';
@Component({
  selector: 'app-compare',
  templateUrl: './compare.page.html',
  styleUrls: ['./compare.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ComparePage implements OnInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('header') header: HTMLElement;
  public paragraphModeClass: any = '';
  public selectedBook: any = '.';
  public database: DatabaseConnection;
  public versData: any = '';
  public showBottomNav: any = 'opacityhide';
  public selection: boolean = false;
  public lastScrollTopCompare: any = 0;
  public showBottomNavCompare: any = 'opacityhide';
  public totalChapters: any;
  public totalBooks: any;
  public currentBook: 1;
  public currentChapter: any = 1;
  public showPrevNav: any = 'showfull';
  public showNextNav: any = 'showfull';
  public selectedVersion: any = '...';
  public selectedTheme: any = '';
  public textSizeCSS: any;
  public orientation: any;
  public isInitialized: any = 0;
  public hideIfVerseMode: any = 'hideVerseNav';
  public prevflag: any = 'disabled';
  public defaultBibleId: any = '';
  public resumeListener: any;
  public pauseListener: any;
  public isDarkMode: boolean = false;
  public isAutoScroll: boolean = false;
  private suppressHeaderToggleUntil = 0;
  private darkModeSubscription: Subscription;

  constructor(
    public darkModeService: DarkModeService,
    public renderer: Renderer2,
    public appComponent: AppComponent,
    public screenorientation: ScreenOrientationService,
    public menuCtrl: MenuController,
    public databaseService: DatabaseService,
    public platform: Platform,
    public authservice: AuthserviceProvider,
    public navctrl: NavController
  ) {
    console.log('Constructor calleing :' + authservice.timerState);
    //this.startTimer();
    this.selectedTheme = this.authservice.selectedTheme;
    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    //this.loadCompareData();
    this.platform.ready().then(() => {
      this.resumeListener = this.platform.resume.subscribe(() => {
        console.log('**** RESUME STARTED****');
        if (this.screenorientation.type == 'landscape-primary') {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
        }
      });
      this.pauseListener = this.platform.pause.subscribe(() => {
        console.log('**** MINIMIZE STARTED****');
      });
    });
  }
  ionViewDidLeave() {
    this.appComponent.hidedrawermenu();
    this.renderer.setStyle(this.header['el'], 'transition', 'none');
    this.renderer.setStyle(this.header['el'], 'top', '0px');
    document.getElementById('myTabBar').style.display = 'flex';
  }
  ionViewWillEnter() {
    console.log('View will enter');
    this.menuCtrl.enable(false);
    this.lastScrollTopCompare = 0;
    this.isAutoScroll = true;
    this.suppressHeaderToggleUntil = Date.now() + 1500;
    this.showBottomNavCompare = 'opacityshow';
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
        this.isDarkMode = state.compareDarkMode || state.globalDarkMode;
        this.applyDarkMode();
      }
    );
  }

  ngOnDestroy() {
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }

  applyDarkMode() {
    this.darkModeService.applyPageDarkMode(
      'compare',
      'app-compare ion-content'
    );
    // Also update status bar when on this page
    this.darkModeService.updateStatusBar('compare');
  }

  openSettings() {
    this.authservice.backToPage = 'compare';
    this.navctrl.navigateRoot('/settings');
  }
  openBookSelector() {
    this.authservice.selected_language_for_bookselector_compare =
      this.authservice.defaultBibleLanguage;
    this.appComponent.hidedrawermenu();
    this.authservice.backToPage = 'compare';
    this.navctrl.navigateRoot('/bookselector');
  }
  openSetBible() {
    this.appComponent.hidedrawermenu();
    this.authservice.backToPage = 'compare';
    this.navctrl.navigateRoot('/setdefaultbible');
  }
  ionViewDidEnter() {
    this.authservice.pageName = 'COMPARE';
    this.authservice.currentPage = 'COMPARE';
    this.authservice.showsign = 0;
    if (this.authservice.dataLoadedCompare == 0) {
      this.loadCompareData();
    }
    if (this.screenorientation.type == 'landscape-primary') {
      this.orientation = 'landscape';
      this.authservice.orientation = this.orientation;
    } else {
      this.orientation = 'portrait';
      this.authservice.orientation = this.orientation;
    }
  }
  async loadCompareData() {
    this.textSizeCSS = 'zoom' + this.authservice.textSize;
    this.lastScrollTopCompare = 0;

    this.defaultBibleId = this.authservice.defaultBibleId;
    this.authservice.currentPage = 'COMPARE';
    console.log('View did enter');
    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;
      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (this.screenorientation.type == 'landscape-primary') {
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
          console.log('DB created');
          this.database = db;
          this.showNextNav = 'showfull';
          this.showPrevNav = 'showopacity';
          console.log('Vers data: ');
          this.currentChapter = this.authservice.defaultChapterNumber;
          this.currentBook = this.authservice.defaultBookNumber;
          this.selectedVersion = this.authservice.defaultBibleVersionText;
          ///this.setTotalChapters();
          //this.setTotalBooks();
          this.getVers();
        });
    });
  }
  // startTimer()
  // {
  //   console.log("Timer state : " + this.authservice.defaultBibleId);
  //   setTimeout(function(){
  //       console.log("Timer state : " + this.authservice.defaultBibleId);
  //       if(this.authservice.timerState == "YES")
  //       {
  //         this.authservice.timerState == "NO";
  //         console.log("Vers data refreshed: ");
  //         this.setTotalChapters();
  //         this.setTotalBooks();
  //         this.getVers();
  //       }

  //    }, 2000);
  // }

  getVers() {
    var resultData;
    //this.database.executeSql("SELECT * FROM vers where bibleid =? and booknumber=? and cnumber=? union SELECT * FROM vers where bibleid in(select id from comparebibles where id not in(?)) ", [this.authservice.defaultBibleId, this.authservice.defaultBookNumber,  this.authservice.defaultChapterNumber,this.authservice.defaultBibleId]).then((data) => {
    this.authservice.verseListCompare = [];

    var qry;
    //this.database.executeSql("select * from bibles where defaultbible=1",[]).then((data) => {
    //if (data.rows.length > 0)
    {
      var selectedDefaulBibleId;
      if (this.authservice.compareBibleId != 0) {
        selectedDefaulBibleId = this.authservice.compareBibleId;
        this.defaultBibleId = this.authservice.compareBibleId;
        this.authservice.compareBibleId = 0;
      } else {
        selectedDefaulBibleId = this.authservice.defaultBibleId;
        this.defaultBibleId = this.authservice.defaultBibleId;
      }
      var includeDefaultBibleInCompare;
      if (this.authservice.actualDefaultBibleId == selectedDefaulBibleId) {
        includeDefaultBibleInCompare = 0;
      } else {
        includeDefaultBibleInCompare = this.authservice.actualDefaultBibleId;
      }
      this.authservice.actualDefaultBibleId = 0;

      if (selectedDefaulBibleId == '5') {
        if (this.authservice.readMode.toUpperCase() == 'CHAPTER')
          qry =
            "select distinct x.* from (select distinct 0 ono, a.*, 0 seq, b.title, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end biblebookname, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname,b.language  from vers a, bibles b, books_etb c where a.vnumber<>'0' and a.bibleid = b.id and a.booknumber = c.bnumber and a.bibleid=" +
            selectedDefaulBibleId +
            ' and a.booknumber=' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            " union select 1 ono,a.*, b.seq,b.title,'' bookname,'' fullbookname, b.language language from vers a join comparebibles b on ((a.bibleid = b.id and b.isshow=1) or (a.bibleid =" +
            includeDefaultBibleInCompare +
            ' and b.id=' +
            includeDefaultBibleInCompare +
            ')) and b.id <> ' +
            selectedDefaulBibleId +
            ' and a.booknumber = ' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ')x order by x.vnumber, x.ono, x.seq';
        else
          qry =
            "select distinct x.* from (select distinct 0 ono, a.*, 0 seq, b.title, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end biblebookname, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname,b.language  from vers a, bibles b, books_etb c where a.vnumber<>'0' and a.bibleid = b.id and a.booknumber = c.bnumber and a.bibleid=" +
            selectedDefaulBibleId +
            ' and a.booknumber=' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ' and a.vnumber=' +
            this.authservice.defaultVersNumber +
            " union select 1 ono,a.*, b.seq,b.title,'' bookname,'' fullbookname, b.language language from vers a join comparebibles b on ((a.bibleid = b.id and b.isshow=1) or (a.bibleid =" +
            includeDefaultBibleInCompare +
            ' and b.id=' +
            includeDefaultBibleInCompare +
            ')) and b.id <> ' +
            selectedDefaulBibleId +
            ' and a.booknumber = ' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ' and a.vnumber=' +
            this.authservice.defaultVersNumber +
            ')x order by x.vnumber, x.ono, x.seq';
      } else {
        if (this.authservice.readMode.toUpperCase() == 'CHAPTER')
          qry =
            "select distinct x.* from (select distinct 0 ono, a.*, 0 seq, b.title, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end biblebookname, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname,b.language  from vers a, bibles b, books c where a.vnumber<>'0' and a.bibleid = b.id and a.booknumber = c.bnumber and a.bibleid=" +
            selectedDefaulBibleId +
            ' and a.booknumber=' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            "  union select 1 ono,a.*, b.seq,b.title,'' bookname,'' fullbookname, b.language language from vers a join comparebibles b on ((a.bibleid = b.id and b.isshow=1) or (a.bibleid =" +
            includeDefaultBibleInCompare +
            ' and b.id=' +
            includeDefaultBibleInCompare +
            ')) and b.id <> ' +
            selectedDefaulBibleId +
            ' and a.booknumber = ' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ')x order by x.vnumber, x.ono, x.seq';
        else
          qry =
            "select distinct x.* from (select distinct 0 ono, a.*, 0 seq, b.title, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end biblebookname, case '" +
            this.authservice.defaultBibleLanguage +
            "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname,b.language  from vers a, bibles b, books c where a.vnumber<>'0' and a.bibleid = b.id and a.booknumber = c.bnumber and a.bibleid=" +
            selectedDefaulBibleId +
            ' and a.booknumber=' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ' and a.vnumber=' +
            this.authservice.defaultVersNumber +
            " union select 1 ono,a.*, b.seq,b.title,'' bookname,'' fullbookname, b.language language from vers a join comparebibles b on ((a.bibleid = b.id and b.isshow=1) or (a.bibleid =" +
            includeDefaultBibleInCompare +
            ' and b.id=' +
            includeDefaultBibleInCompare +
            '))  and b.id <> ' +
            selectedDefaulBibleId +
            ' and a.booknumber = ' +
            this.authservice.defaultBookNumber +
            ' and a.cnumber = ' +
            this.authservice.defaultChapterNumber +
            ' and a.vnumber=' +
            this.authservice.defaultVersNumber +
            ')x order by x.vnumber, x.ono, x.seq';
      }
      console.log('Compare : ' + qry);
      this.database.executeSql(qry, []).then(
        (data) => {
          if (data.rows.length == 0) {
            //this.authservice.showAlert("","","End of chapter");
            //this.authservice.defaultVersNumber--;
            this.gotoNextVers();
            return;
          }
          //this.database.executeSql("select x.* from (select 0 ono, a.*, b.timespan,b.title  from vers a join bibles b on a.bibleid = b.id and a.bibleid=" + this.authservice.defaultBibleId + " and a.booknumber="+ this.authservice.defaultBookNumber +" and a.cnumber = " + this.authservice.defaultChapterNumber + " union select 1 ono,a.*, b.timespan,b.title from vers a join comparebibles b on a.bibleid = b.id  and b.id not in (select id from bibles where defaultbible = '1') and a.booknumber = "+ this.authservice.defaultBookNumber +" and a.cnumber = " + this.authservice.defaultChapterNumber+")x order by x.vnumber, x.ono, x.timespan desc",[]).then((data) => {
          this.selectedBook =
            data.rows.item(0).biblebookname + ' ' + data.rows.item(0).cnumber;
          this.authservice.defaultBookText = data.rows.item(0).fullbookname;

          var font, globalfont;
          var prevVnumber = data.rows.item(0).vnumber;

          for (var i = 0; i < data.rows.length; i++) {
            this.versData = '';
            var versetext = data.rows.item(i).vers;
            var vnumber = data.rows.item(i).vnumber;
            if (data.rows.item(i).language == 'Tamil') {
              font = 'font16';
              globalfont = this.authservice.fontFamilyTamil;
            } else {
              font = 'font18';
              globalfont = this.authservice.fontFamilyEnglish;
            }

            var splitted = versetext.split(' ');
            var versetextNew = '';

            /*for(var splitIndex = 0; splitIndex<splitted.length; splitIndex++)
          {
            if (splitted[splitIndex].indexOf("கர்த்த")!=-1 && splitted[splitIndex].indexOf("கர்த்தத்")==-1)
            {
                  versetextNew += "<span class='boldtext'>" + splitted[splitIndex] + "</span> ";
            }
            else
              versetextNew += splitted[splitIndex] + " ";
          }*/
            //versetext=versetextNew;

            if (this.authservice.BSIRedLettersShow == '1') {
              versetext = versetext.split('ṟ').join('<span class=showred>');
              versetext = versetext.split('Ṟ').join('</span>');
            }

            if (data.rows.item(i).bibleid == 2) {
              versetext = versetext
                .split('[')
                .join(
                  '<span class="' +
                    this.authservice.globalfont +
                    'Italic Italic">'
                );
              versetext = versetext.split(']').join('</span>');
            }
            if (data.rows.item(i).bibleid == 3) {
              if (this.authservice.BSINumberShow == '1')
                versetext = versetext
                  .split('[')
                  .join('<span class=' + 'textgrey>[');
              else
                versetext = versetext
                  .split('[')
                  .join('<span class=' + 'textgrey-hide>[');

              versetext = versetext.split(']').join(']</span>');
            }

            versetext = versetext.split('*').join('');
            versetext = versetext.split('␢').join('');
            versetext = versetext.split('§').join('');
            versetext = versetext.split('⒫').join('');
            versetext = versetext.split('⒯').join('');

            versetext = versetext.split('ḇ').join("<span class='boldtext'>");
            versetext = versetext.split('Ḇ').join('</span>');

            versetext = versetext.split('ṟ').join('');
            versetext = versetext.split('Ṟ').join('');

            // var boldText = this.authservice.bold_words;
            // for(var boldindex=0; boldindex<boldText.length; boldindex++)
            // {
            //     if(versetext.indexOf(boldText[boldindex]) !=-1)
            //     {
            //       versetext = versetext.split(boldText[boldindex]).join("<span class='boldtext'>" + boldText[boldindex] + "</span>" );
            //     }
            // }

            if (
              versetext.indexOf('#') == -1 &&
              data.rows.item(i).vnumber != '0' &&
              vnumber.toString().indexOf('.') == -1
            ) {
              this.versData +=
                "<span class='" +
                font +
                ' ' +
                globalfont +
                ' vers_' +
                (i + 1) +
                "'>" +
                versetext +
                '</span>';
              var seperator = '';
              if (prevVnumber != vnumber) {
                prevVnumber = vnumber;
                seperator =
                  "<div class='seperator'>&nbsp;</div><div class='seperator-noline'>&nbsp;</div>";
              }
              this.authservice.verseListCompare.push({
                index: i,
                vid: data.rows.item(i).vid,
                title: data.rows.item(i).title,
                verseData: this.versData,
                verse: data.rows.item(i).vers,
                bookname: data.rows.item(i).biblebookname,
                vnumber: data.rows.item(i).vnumber,
                isSelected: false,
                textHighlight: data.rows.item(i).textHighlight,
                seperator: seperator,
              });
            }
          }
          if (this.authservice.readMode.toUpperCase() == 'CHAPTER') {
            this.hideIfVerseMode = 'hideVerseNav';
          } else {
            this.hideIfVerseMode = 'showVerseNav';
            this.showBottomNavCompare = 'opacityhide';
          }
          console.log('Set vers in' + this.currentChapter);
          this.currentChapter = this.authservice.defaultChapterNumber;
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

          this.scrollTo();
          if (this.isInitialized == 0) {
            this.setTotalChapters();
            this.setTotalBooks();
            this.isInitialized = 1;
          }
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );
      this.authservice.dataLoadedCompare = 1;
    }
  }
  // scrollTo() {
  //           //var yOffset = document.getElementsByClassName('vers').item(this.authservice.defaultVersNumber).getAttribute("offsetTop");
  //   this.content.scrollToPoint(0,0,10);
  //   if(this.authservice.defaultChapterNumber != 1)
  //   {
  //       var yOffset=document.getElementsByClassName('vers_' + this.authservice.defaultVersNumber).item(0).getBoundingClientRect().y;
  //       this.content.scrollToPoint(0, yOffset, 4000);
  //   }
  // }
  scrollTo() {
    this.isAutoScroll = true;
    this.suppressHeaderToggleUntil = Date.now() + 1500;
    console.log('Scroll set ' + this.authservice.defaultVersNumber);
    setTimeout(() => {
      let b = document.getElementById(
        'item' + this.authservice.defaultVersNumber + '_' + this.defaultBibleId
      );
      //if (b) b.scrollIntoView();
      if (b) b.scrollIntoView({ behavior: 'auto', block: 'start' });

      this.renderer.setStyle(this.header['el'], 'top', '0px');
      document.getElementById('myTabBar').style.display = 'flex';
      this.showBottomNavCompare = 'opacityshow';

      setTimeout(() => {
        this.isAutoScroll = false;
      }, 350);
    }, 100);
  }
  setTotalChapters() {
    var resultData;
    this.database
      .executeSql(
        'SELECT max(cnumber) totalchapters FROM vers where bibleid =? and booknumber=? ',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      )
      .then(
        (data) => {
          this.totalChapters = data.rows.item(0).totalchapters;
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );
  }
  setTotalChaptersGotoLast() {
    var resultData;
    this.database
      .executeSql(
        'SELECT max(cnumber) totalchapters FROM vers where bibleid =? and booknumber=? ',
        [this.authservice.defaultBibleId, this.authservice.defaultBookNumber]
      )
      .then(
        (data) => {
          this.totalChapters = data.rows.item(0).totalchapters;
          this.authservice.defaultVersNumber = 1;
          this.authservice.defaultChapterNumber = this.totalChapters;
          this.getVers();
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );
  }
  setTotalBooks() {
    var resultData;
    this.database
      .executeSql(
        'SELECT max(booknumber) totalbooks FROM vers where bibleid =?',
        [this.authservice.defaultBibleId]
      )
      .then(
        (data) => {
          this.totalBooks = data.rows.item(0).totalbooks;
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );
  }
  gotoNextVers() {
    console.log('Next vers in' + this.currentChapter);
    if (this.currentChapter < this.totalChapters) {
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
      this.suppressHeaderToggleUntil = Date.now() + 1500;
      // let options: NativeTransitionOptions = {
      //   direction: 'left',
      //   duration: 400,
      //   slowdownfactor: -1,
      //   iosdelay: 50,
      //   fixedPixelsTop: 53,
      //   fixedPixelsBottom: 50,
      //  };

      // this.nativePageTransitions.slide(options);
      this.getVers();
    } else {
      if (this.currentBook < this.totalBooks) {
        this.currentBook++;
        this.authservice.defaultBookNumber = this.currentBook;
        this.currentChapter = 1;
        this.authservice.defaultChapterNumber = 1;
        this.setTotalChapters();
        this.authservice.defaultVersNumber = 1;
        this.suppressHeaderToggleUntil = Date.now() + 1500;
        // let options: NativeTransitionOptions = {
        //   direction: 'left',
        //   duration: 400,
        //   slowdownfactor: -1,
        //   iosdelay: 50,
        //   fixedPixelsTop: 53,
        //   fixedPixelsBottom: 50,
        //  };

        // this.nativePageTransitions.slide(options);
        this.getVers();
      }
      // Replace alert with Capacitor Toast
      else this.showToast('End of bible');
    }
  }
  gotoPrevVers() {
    console.log('Prev vers in' + this.currentChapter);
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
      this.setTotalChapters();
      this.authservice.defaultVersNumber = 1;
      this.suppressHeaderToggleUntil = Date.now() + 1500;
      // let options: NativeTransitionOptions = {
      //   direction: 'right',
      //   duration: 400,
      //   slowdownfactor: -1,
      //   iosdelay: 50,
      //   fixedPixelsTop: 53,
      //   fixedPixelsBottom: 50,
      //  };

      // this.nativePageTransitions.slide(options);
      this.getVers();
    } else {
      if (this.currentBook > 1) {
        this.currentBook--;
        this.authservice.defaultBookNumber = this.currentBook;

        this.setTotalChapters();
        this.currentChapter = this.totalChapters;
        this.authservice.defaultChapterNumber = this.currentChapter;
        this.authservice.defaultVersNumber = 1;
        this.suppressHeaderToggleUntil = Date.now() + 1500;
        // let options: NativeTransitionOptions = {
        //   direction: 'right',
        //   duration: 400,
        //   slowdownfactor: -1,
        //   iosdelay: 50,
        //   fixedPixelsTop: 53,
        //   fixedPixelsBottom: 50,
        //  };

        // this.nativePageTransitions.slide(options);
        this.setTotalChaptersGotoLast();
        //this.getVers();
      }
      // Replace alert with Capacitor Toast
      else this.showToast('Beginning of bible');
    }
  }
  public handleScroll(event): void {
    console.log('compare scroll event');

    const shouldLockHeaderOnEntry =
      this.isAutoScroll ||
      Date.now() < this.suppressHeaderToggleUntil ||
      event.detail.scrollTop <= 2;

    if (shouldLockHeaderOnEntry) {
      this.renderer.setStyle(this.header['el'], 'top', '0px');
      document.getElementById('myTabBar').style.display = 'flex';
      this.showBottomNavCompare = 'opacityshow';
      this.lastScrollTopCompare = event.detail.scrollTop;
      return;
    }

    this.showBottomNavCompare =
      this.lastScrollTopCompare > event.detail.scrollTop
        ? 'opacityshow'
        : 'opacityhide';

    // Only toggle header for actual user scrolling, not page-entry/navigation auto-scroll.
    if (this.authservice.fullscreenMode == 1 && !this.isAutoScroll) {
      const headerHeight = 76; // Explicit header height

      if (this.lastScrollTopCompare < event.detail.scrollTop) {
        // Scrolling down - hide header
        this.renderer.setStyle(this.header['el'], 'top', `-${headerHeight}px`);
        this.renderer.setStyle(
          this.header['el'],
          'transition',
          'top 0.3s ease-out'
        );
        document.getElementById('myTabBar').style.display = 'none';
        this.showBottomNavCompare = 'opacityhide';
      } else {
        // Scrolling up - show header
        this.renderer.setStyle(this.header['el'], 'top', '0px');
        this.renderer.setStyle(
          this.header['el'],
          'transition',
          'top 0.3s ease-out'
        );
        document.getElementById('myTabBar').style.display = 'flex';
        this.showBottomNavCompare = 'opacityshow';
      }
    } else {
      this.renderer.setStyle(this.header['el'], 'top', '0px');
      document.getElementById('myTabBar').style.display = 'flex';
      this.showBottomNavCompare = 'opacityshow';
    }

    this.lastScrollTopCompare = event.detail.scrollTop;
  }
  loadPrevVerse() {
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
  loadNextVerse() {
    this.authservice.defaultVersNumber++;
    this.getVers();
  }
  loadChapter() {
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;

    this.authservice.readMode = 'CHAPTER';
    this.getVers();
  }
  public selectItem(index, isSelected, vnumber) {
    if (this.authservice.paragraphMode == 0) {
      // Clear all selections first
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        this.authservice.verseListCompare[i].isSelected = false;
      }

      // Build the formatted text for copy/share with version information
      let formattedTextForCopy = '';
      let selectedVersesArray = [];
      let versesForThisNumber = [];

      // Select the clicked verse and collect all versions for this verse number
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        if (this.authservice.verseListCompare[i].vnumber == vnumber) {
          this.authservice.verseListCompare[i].isSelected = !isSelected;

          if (this.authservice.verseListCompare[i].isSelected) {
            // Get the version title and verse data
            const versionTitle = this.authservice.verseListCompare[i].title;
            const verseNumber = this.authservice.verseListCompare[i].vnumber;
            const bookName = this.authservice.verseListCompare[i].bookname;

            // Extract plain text from HTML content (remove HTML tags)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.authservice.verseListCompare[i].verseData;
            const plainVerseText =
              tempDiv.textContent || tempDiv.innerText || '';

            const chapterNumber = this.authservice.defaultChapterNumber;

            // Store individual verse info
            selectedVersesArray.push({
              version: versionTitle,
              book: bookName,
              chapter: chapterNumber,
              verse: verseNumber,
              text: plainVerseText.trim(),
            });
          }
        }
      }

      // Now collect ALL versions for the selected verse number (both selected and unselected)
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        if (this.authservice.verseListCompare[i].vnumber == vnumber) {
          const versionTitle = this.authservice.verseListCompare[i].title;
          const verseNumber = this.authservice.verseListCompare[i].vnumber;
          const bookName = this.authservice.verseListCompare[i].bookname;

          // Extract plain text from HTML content (remove HTML tags)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = this.authservice.verseListCompare[i].verseData;
          const plainVerseText = tempDiv.textContent || tempDiv.innerText || '';

          const chapterNumber = this.authservice.defaultChapterNumber;

          versesForThisNumber.push({
            version: versionTitle,
            book: bookName,
            chapter: chapterNumber,
            verse: verseNumber,
            text: plainVerseText.trim(),
          });
        }
      }

      // Format the text in the desired format if any verse is selected
      if (selectedVersesArray.length > 0) {
        const firstVerse = versesForThisNumber[0];

        // Add book name and chapter:verse header
        formattedTextForCopy += `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}\n\n`;

        // Add each version on separate lines with dash format
        versesForThisNumber.forEach((verse) => {
          formattedTextForCopy += `${verse.version} - ${verse.text}\n\n`;
        });
      }

      // Store the formatted text for the copy/share functionality
      this.authservice.selectedVerseTextForCopy = formattedTextForCopy.trim();
      this.authservice.selectedVersesArray = selectedVersesArray;

      // Also store it globally for access by other components
      if (typeof window !== 'undefined') {
        (window as any).selectedTextForCopy = formattedTextForCopy.trim();
      }

      // Set selection state
      this.selection = false;
      this.authservice.selection = false;

      // Remove color panel visibility code
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

      // Check if any verse is selected (for copy/share)
      var selectedCount = 0;
      for (var i = 0; i < this.authservice.verseListCompare.length; i++) {
        if (this.authservice.verseListCompare[i].isSelected) {
          this.selection = true;
          this.authservice.selection = true;
          selectedCount++;
        }
      }

      if (this.authservice.selection) {
        this.showBottomNav = 'opacityhide';

        // Show drawer for copy/share options, hide highlight panel
        this.appComponent.drawer_colors = 'drawer-colors-hide';
        this.appComponent.drawer = 'drawershow';
        this.appComponent.read_popovermenu = 'read-popovermenu-hide';
        this.appComponent.drawer_fonts = 'drawer-font-hide';
        this.appComponent.drawer_read = 'drawer-read-hide';
      } else {
        this.showBottomNav = 'opacityshow';
        this.appComponent.drawer = 'drawerhide';
      }

      // Enable/disable menu options based on selection
      if (selectedCount == 1) {
        this.appComponent.drawermenu_options_enabledstate =
          'enabled-drawermenu';
      } else {
        this.appComponent.drawermenu_options_enabledstate =
          'disabled-drawermenu';
      }

      // Debug log to verify the formatted text
      console.log(
        'Formatted text for copy:',
        this.authservice.selectedVerseTextForCopy
      );
    }
  }
  showhidePopoverMenu() {
    if (this.appComponent.compare_popovermenu == 'compare-popovermenu-hide')
      this.appComponent.compare_popovermenu = 'compare-popovermenu-show';
    else this.appComponent.compare_popovermenu = 'compare-popovermenu-hide';
  }

  // Helper method to show toast messages
  async showToast(
    message: string,
    duration: 'short' | 'long' = 'short',
    position: 'top' | 'center' | 'bottom' = 'center'
  ) {
    await Toast.show({
      text: message,
      duration: duration,
      position: position,
    });
  }
}
