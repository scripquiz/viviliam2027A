import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
// Replace Cordova Toast with Capacitor Toast
import { Toast } from '@capacitor/toast';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { Router } from '@angular/router';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController, IonContent } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { AppComponent } from '../../app/app.component';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-readmarklist',
  templateUrl: './readmarklist.page.html',
  styleUrls: ['./readmarklist.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ReadmarklistPage {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('audio') audio;

  public readMarkList: any = [];
  private database: DatabaseConnection;
  public versData: any = '';
  public titlefont: any = '';
  public booktitlefont: any = '';
  public font: any = '';
  public nodataState: any = 'hide';
  public filters = 'show';
  public drawer_highlightedit: any = 'drawerhide-edithighlights';
  public highlightEditState: any = '0';
  public sortOptionsRefreshed: any = false;
  public fileterRefreshed: any = false;
  public sortByRefreshed: any = false;
  public sortOptions: any = [];
  public filerBy: any = '1';
  public sortBy: any = '1';
  public sortOption: any = 1;
  public pager: any = '';
  public currentpage: any = 1;
  public totalpages: any = 15;
  public gotoPage: any = '';
  public drawer_highlightedit_show: Date;
  public isAudioPlaying: any = 0;
  public timeSpan: any;
  public voiceOverLength: any;
  public audioid: any;
  public startTime: any;
  public endTime: any;
  public interval: any;
  constructor(
    private network: NetworkService,
    private appComponent: AppComponent,
    public alertController: AlertController,
    public navctrl: NavController,
    public router: Router,
    public databaseService: DatabaseService,
    public platform: Platform,
    public authservice: AuthserviceProvider
  ) {
    // Note: Removed toast from constructor parameters since Capacitor plugins don't need DI

    this.drawer_highlightedit_show = new Date();

    // Watch network for disconnection using Capacitor NetworkService
    this.network.disconnected$.subscribe(() => {
      console.log('network was disconnected :-(');
      if (this.isAudioPlaying == 1) {
        // Update to use Capacitor Toast
        Toast.show({
          text: 'Network disconnected!, Audio may be interrupted',
          duration: 'short',
          position: 'center',
        });
      }
    });

    // Watch network for connection using Capacitor NetworkService
    this.network.connected$.subscribe(() => {
      console.log('network connected!');
      if (this.isAudioPlaying == 1) {
        // Update to use Capacitor Toast
        Toast.show({
          text: 'Network connected!',
          duration: 'short',
          position: 'center',
        });
      }
    });

    // Check initial connection status
  }

  goBack() {
    this.authservice.showsign = 0;
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
    this.authservice.appstartesstae = '1';
    if (this.authservice.currentPage == 'READ')
      this.navctrl.navigateRoot('/tabslink/read');
    else if (this.authservice.currentPage == 'MORE')
      this.navctrl.navigateRoot('/tabslink/more');
    else this.navctrl.navigateRoot('/tabslink/compare');
  }

  toggleMarkPopup(id) {
    for (var i = 0; i < this.readMarkList.length; i++) {
      if (i == id) {
        if (this.readMarkList[id].popclass == 'markpopup-show')
          this.readMarkList[id].popclass = 'markpopup-hide';
        else this.readMarkList[id].popclass = 'markpopup-show';
      } else this.readMarkList[i].popclass = 'markpopup-hide';
    }
  }
  // hideMArkPopup(){
  //   for(var i=0; i<this.readMarkList.length; i++)
  //   {
  //       this.readMarkList[i].popclass="markpopup-hide";
  //   }
  // }
  ionViewDidLeave() {
    this.appComponent.compare_popovermenu = 'compare-popovermenu-hide';
  }
  ionViewDidEnter() {
    this.authservice.showsign = 0;
    //this.readMarkList.push({"vid":"1","deleted":"0", "bibleid":"3","language":"TAMIL", "bible":"BSI", "bookname": "BOOK NAME", "booknumber":"1", "cnumber":"16", "vnumber": "1", "versData" :"TEST", "textHighlight": "!", "bookMark":"0", "notes":"TEST",  "popclass":"markpopup-hide","audioState":"STOPPED"});

    this.fileterRefreshed = false;
    this.sortByRefreshed = false;
    this.sortOptionsRefreshed = false;

    this.filerBy = this.authservice.defaultBibleId.toString();
    this.sortOptions.push({ id: 1, title: 'Oldest' });
    this.sortOptions.push({ id: 2, title: 'Newest' });

    this.sortBy = '1';
    this.sortOption = 1;
    setTimeout(() => {
      this.fileterRefreshed = true;
      this.sortByRefreshed = true;
      this.sortOptionsRefreshed = true;
    }, 50);

    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          this.bindData();
          //         this.database.executeSql("SELECT * FROM bibles order by seq", []).then((data) => {
          //   console.log("Books count " +  data.rows.length) ;
          //   this.fileterRefreshed = false;
          //   this.bibleList = [];
          //   for(var i=0; i< data.rows.length;i++)
          //   {
          //       this.bibleList.push({"id":data.rows.item(i).id, "title":data.rows.item(i).title});
          //   }

          //   this.filerBy="2";
          //   setTimeout(()=>{
          //     this.fileterRefreshed = true;
          //     this.bindData();
          //   },500)
          // });
        });
    });
  }
  setFilterBible(selectedValue: any) {
    this.bindData();
  }
  bindSortBy(selectedValue: any) {
    this.bindData();
  }
  bindSortOptions(selectedValue: any) {
    var sortBy = selectedValue.currentTarget.value;
    this.sortOptionsRefreshed = false;
    this.sortOptions = [];
    if (sortBy == 1) {
      this.sortOptions.push({ id: 1, title: 'Newest' });
      this.sortOptions.push({ id: 2, title: 'Oldest' });
    } else if (sortBy == 2) {
      this.sortOptions.push({ id: 1, title: 'Ascending' });
      this.sortOptions.push({ id: 2, title: 'Descending' });
    }

    this.sortOption = 1;
    setTimeout(() => {
      this.sortOptionsRefreshed = true;
    }, 20);
    this.bindData();
  }
  gotoRead(bibleid, booknmber, cnumber, vnumber, language) {
    this.authservice.defaultBibleId = bibleid;
    this.authservice.defaultBookNumber = booknmber;
    this.authservice.defaultChapterNumber = cnumber;
    this.authservice.defaultVersNumber = vnumber;
    this.hideMarkPopup(0);
    this.authservice.scrollmode = 'VERSE';
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
    var counter;
    counter = Math.floor(Math.random() * 100);
    //this.router.navigateByUrl("/readmarklist/" + counter);
    //this.navctrl.navigateRoot("/tabslink/read/"+counter);
    this.navctrl.navigateRoot('/tabslink/read');
  }
  gotoCompare(bibleid, booknmber, cnumber, vnumber, language) {
    this.authservice.defaultBibleId = bibleid;
    this.authservice.defaultBookNumber = booknmber;
    this.authservice.defaultChapterNumber = cnumber;
    this.authservice.defaultVersNumber = vnumber;
    this.authservice.defaultBibleLanguage = language;
    this.hideMarkPopup(0);
    this.authservice.scrollmode = 'VERSE';
    this.authservice.dataLoadedCompare = 0;
    this.authservice.dataLoaded = 0;
    this.authservice.compareBibleId = bibleid;

    this.navctrl.navigateRoot('/tabslink/compare');
  }
  bindData() {
    var qry;
    var param = '';
    var sortfield = '';
    if (this.authservice.pageName == 'Highlights') {
      param = " and ifnull(textHighlight,'') <> ''";
      sortfield = 'highlightOn';
      this.hideHighlightEditOverlay();
    } else if (this.authservice.pageName == 'Notes') {
      param = " and ifnull(notes,'') <> ''";
      sortfield = 'notesOn';
    } else if (this.authservice.pageName == 'Bookmarks') {
      param = " and ifnull(bookMark,'0') <> '0'";
      sortfield = 'bookMarkOn';
    }
    if (this.filerBy == '5')
      qry =
        "select x.* from (SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid = 5 " +
        param +
        ' )x ';
    else if (this.filerBy != '0') {
      qry =
        "select x.* from (SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid =" +
        this.filerBy +
        ' ' +
        param +
        ' )x ';
    } else {
      qry =
        "select x.* from (SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid <>5" +
        ' ' +
        param +
        ' union ' +
        "SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid = 5 " +
        param +
        ' )x ';
    }

    if (this.sortBy == '2' && this.sortOption == '1')
      qry += 'order by x.bibleid, x.booknumber, x.cnumber, x.vnumber  ';
    else if (this.sortBy == '2' && this.sortOption == '2')
      qry +=
        'order by x.bibleid desc, x.booknumber desc, x.cnumber, x.vnumber desc ';
    else if (this.sortBy == '1' && this.sortOption == '1')
      qry += 'order by ' + sortfield;
    else if (this.sortBy == '1' && this.sortOption == '2')
      qry += 'order by ' + sortfield + ' desc';
    this.readMarkList = [];
    this.database.executeSql(qry, []).then((data) => {
      if (data.rows.length == 0) {
        //this.authservice.showAlert("","",this.authservice.pageName + " not recorded");
        this.nodataState = 'show';
        this.filters = 'hide';
        return;
      } else {
        this.totalpages = parseInt((data.rows.length / 25).toString());
        if (data.rows.length % 25 > 0) this.totalpages++;
        var startIndex, endIndex;
        startIndex = this.currentpage * 25 - 25;
        endIndex = this.currentpage * 25 - 1;
        if (this.currentpage == this.totalpages && data.rows.length % 25 > 0)
          endIndex = (data.rows.length % 25) + this.currentpage * 25 - 25 - 1;
        this.pager = 'Page ' + this.currentpage + ' of ' + this.totalpages;
        var sn = 1;
        for (var i = startIndex; i <= endIndex; i++) {
          this.nodataState = 'hide';
          this.filters = 'show';

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

          if (this.authservice.defaultBibleId == 2) {
            versetext = versetext
              .split('[')
              .join('<span class=' + ' ' + 'Italic>');
            versetext = versetext.split(']').join('</span>');
          }
          versetext = versetext.split('*').join('');
          versetext = versetext.split('␢').join('');
          versetext = versetext.split('§').join('');
          versetext = versetext.split('⒫').join('');
          versetext = versetext.split('⒯').join('');
          versetext = versetext.split('ḇ').join("<span class='boldtext'>");
          versetext = versetext.split('Ḇ').join('</span>');
          if (this.authservice.BSIRedLettersShow == '1') {
            versetext = versetext.split('ṟ').join('<span class=showred>');
            versetext = versetext.split('Ṟ').join('</span>');
          }
          versetext = versetext.split('ṟ').join('');
          versetext = versetext.split('Ṟ').join('');

          var boldText = this.authservice.bold_words;
          for (var boldindex = 0; boldindex < boldText.length; boldindex++) {
            if (versetext.indexOf(boldText[boldindex]) != -1) {
              versetext = versetext
                .split(boldText[boldindex])
                .join(
                  "<span class='boldtext'>" + boldText[boldindex] + '</span>'
                );
            }
          }

          if (data.rows.item(i).vnumber == '0') {
            this.versData +=
              "<span class='vers  showtitle " +
              this.titlefont +
              ' ' +
              ' ' +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '</span>';
          } else if (vnumber.toString().indexOf('.') !== -1) {
            this.versData +=
              "<span class='vers  showthebrew " +
              this.font +
              "' id='" +
              data.rows.item(i).vnumber +
              "'>" +
              versetext +
              '</span>';
          } else {
            this.versData += '<span>' + versetext + '</span>';
          }
          this.readMarkList.push({
            vid: data.rows.item(i).vid,
            deleted: '0',
            bibleid: data.rows.item(i).bibleid,
            language: data.rows.item(i).language,
            bible: data.rows.item(i).title,
            bookname:
              data.rows.item(i).fullbookname.length <= 10
                ? data.rows.item(i).fullbookname
                : data.rows.item(i).fullbookname.substr(0, 8) + '...',
            booknumber: data.rows.item(i).booknumber,
            cnumber: data.rows.item(i).cnumber,
            vnumber: data.rows.item(i).vnumber,
            versData: this.versData,
            textHighlight: data.rows.item(i).textHighlight,
            bookMark: data.rows.item(i).bookMark,
            notes: data.rows.item(i).notes,
            popclass: 'markpopup-hide',
            audioState: 'STOPPED',
          });
        }
      }
    });

    this.hideMarkPopup(0);
  }

  hideMarkPopup(o) {
    console.log('hide popup' + o);
    for (var i = 0; i < this.readMarkList.length; i++) {
      this.readMarkList[i].popclass = 'markpopup-hide';
    }
  }
  showConfirmForDelete(vid, i) {
    this.hideMarkPopup(0);
    this.alertController
      .create({
        header: 'Confirmation',
        subHeader: '',
        message: 'Do you want to delete this entry?',
        cssClass: 'custom-confirm',
        buttons: [
          {
            text: 'Yes',
            cssClass: 'cancel-button',
            handler: () => {
              this.DeleteItem(vid, i);
            },
          },
          {
            text: 'No',
            cssClass: 'cancel-button',
            handler: () => {
              console.log('Let me think');
            },
          },
        ],
      })
      .then((res) => {
        res.present();
      });
  }
  DeleteItem(vid, i) {
    var qry;
    if (this.authservice.pageName == 'Notes')
      qry = "update vers set notes='' where vid=" + vid;
    else if (this.authservice.pageName == 'Highlights')
      qry = "update vers set textHighlight='' where vid=" + vid;
    else if (this.authservice.pageName == 'Bookmarks')
      qry = 'update vers set bookMark=0 where vid=' + vid;
    this.database.executeSql(qry, []).then((data) => {
      for (var i = 0; i < this.authservice.verseList; i++) {
        if (this.authservice.verseList[i].vid == vid)
          if (this.authservice.pageName == 'Notes')
            this.authservice.verseList[i].notes = '';
          else if (this.authservice.pageName == 'Highlights')
            this.authservice.verseList[i].Highlights = '';
          else if (this.authservice.pageName == 'Bookmarks')
            this.authservice.verseList[i].bookmark = false;
      }
      var deletedall = 1;
      for (var i = 0; i < this.readMarkList.length; i++) {
        if (this.readMarkList[i].vid == vid) {
          this.readMarkList[i].deleted = '1';
        }
        if (this.readMarkList[i].deleted != '1') {
          deletedall = 0;
        }
      }
      if (deletedall == 1) {
        this.nodataState = 'show';
        this.filters = 'hide';
      }
      //this.bindData();
    });
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }
  EditItem(vid, j) {
    this.authservice.selectedVID = vid;
    if (this.authservice.pageName == 'Notes') {
      this.authservice.pageMode = 'edit';

      this.authservice.currentPage = 'READMARKLIST';
      this.router.navigateByUrl('/addnotes');
    } else if (this.authservice.pageName == 'Highlights') {
      this.drawer_highlightedit = 'drawershow-edithighlights';
      this.drawer_highlightedit_show = new Date();
      this.highlightEditState = '1';
      for (var i = 0; i < this.readMarkList.length; i++) {
        this.readMarkList[i].popclass = 'markpopup-hide';
      }
    }
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }
  hideHighlightEditOverlay() {
    var currentTime = new Date();
    var seconds = Math.floor(
      (currentTime.getTime() - this.drawer_highlightedit_show.getTime()) / 1000
    );
    if (seconds > 1) {
      this.drawer_highlightedit = 'drawerhide-edithighlights';
      this.highlightEditState = 0;
    }
  }
  setHighlight(color) {
    var qry;

    qry =
      "update vers set textHighlight='" +
      'color' +
      color +
      "' where vid=" +
      this.authservice.selectedVID;
    this.database.executeSql(qry, []).then((data) => {
      for (var i = 0; i < this.readMarkList.length; i++) {
        if (this.readMarkList[i].vid == this.authservice.selectedVID) {
          this.readMarkList[i].textHighlight = 'color' + color;
        }
      }

      this.drawer_highlightedit = 'drawerhide-edithighlights';
      this.highlightEditState = 0;
    });

    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }
  gotoPrevPage() {
    if (this.currentpage > 1) {
      this.currentpage--;
      this.bindData();
    }
    //alert("Begining of page");
    else this.authservice.showAlert('', '', 'Beginning of page');
  }
  gotoNextPage() {
    if (this.currentpage < this.totalpages) {
      this.currentpage++;
      this.bindData();
    }
    //alert("End of page");
    else this.authservice.showAlert('', '', 'End of page');
  }
  gotoPageNumber() {
    if (this.gotoPage.toString().indexOf('.') != -1)
      //alert("Enter valid page number");
      this.authservice.showAlert('', '', 'Enter valid page number');
    else if (this.gotoPage == '')
      //alert("Enter page number between 1 and " + this.totalpages);
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    else if (
      parseInt(this.gotoPage) < 0 ||
      parseInt(this.gotoPage) > this.totalpages
    ) {
      //alert("Enter page number between 1 and " + this.totalpages);
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    } else {
      this.currentpage = this.gotoPage;
      this.bindData();
    }
  }
  showhidePopoverMenu() {
    if (this.appComponent.compare_popovermenu == 'compare-popovermenu-hide')
      this.appComponent.compare_popovermenu = 'compare-popovermenu-show';
    else this.appComponent.compare_popovermenu = 'compare-popovermenu-hide';
  }
  StartAudio(rowid, bibleid, version, booknumber, chapternumber, vnumber) {
    for (var i = 0; i < this.readMarkList.length; i++) {
      this.readMarkList[i].audioState = 'PAUSE';
    }
    fetch(
      'https://api.viviliam.com/assets/voiceover/' +
        bibleid +
        '_' +
        version +
        '/' +
        bibleid +
        '_' +
        booknumber +
        '_' +
        chapternumber +
        '.json'
    )
      .then((res) => res.json())
      .then((json) => {
        this.timeSpan = json;
        console.log('Timespan ' + this.timeSpan.length);
        this.voiceOverLength = this.timeSpan.length;
        for (var i = 0; i < this.timeSpan.length; i++) {
          if (this.timeSpan[i].vnumber == vnumber) {
            this.startTime = this.timeSpan[i].start;
            this.endTime = this.timeSpan[i].end;
          }
        }
        this.audioid =
          'https://api.viviliam.com/assets/voiceover/' +
          bibleid +
          '_' +
          version +
          '/' +
          bibleid +
          '_' +
          booknumber +
          '_' +
          chapternumber +
          '.mp3';
        this.audio.nativeElement.load();
        this.readMarkList[rowid].audioState = 'PLAYING';
        this.audio.nativeElement.currentTime = this.startTime;
        this.audio.nativeElement.play();
        this.isAudioPlaying = 1;
        this.interval = setInterval(() => {
          if (this.isAudioPlaying == 1) {
            if (this.audio.nativeElement.currentTime >= this.endTime) {
              this.PauseAudio();
            }
          }
        });
      })
      .catch((e) => {
        this.network.getNetworkStatus().then((status) => {
          //console.log("Connection status: ", status);
          // Try and find out the current online status of the device
          if (!status.connected) {
            //console.log("The device is not online");
            this.authservice.showAlert(
              '',
              '',
              this.authservice.noNetWorkMessage
            );
          } else {
            //console.log("The device is online!");
            this.authservice.showAlert(
              '',
              '',
              'Verse audio not available for this chapter'
            );
          }
        });
      });
  }
  PauseAudio() {
    this.audio.nativeElement.pause();
    this.isAudioPlaying = 0;
    for (var i = 0; i < this.readMarkList.length; i++) {
      this.readMarkList[i].audioState = 'PAUSE';
    }
  }
  deleteAll() {
    // Update to just use a string directly instead of IonicSafeString
    this.alertController
      .create({
        cssClass: 'custom-alert-with-header',
        header: 'Delete All ' + this.authservice.pageName,
        subHeader: '',
        // Just use HTML string directly without IonicSafeString
        message:
          'All items in ' +
          this.authservice.pageName +
          ' will be deleted permanently. This action cannot be undone. Type DELETE and press CONFIRM.',
        inputs: [
          {
            name: 'deleteconfirm',
            placeholder: 'Type DELETE to confirm',
            attributes: {
              autocomplete: 'off',
              autocorrect: 'off',
            },
          },
        ],
        buttons: [
          {
            text: 'CONFIRM',
            handler: (data: any) => {
              if (
                data &&
                data.deleteconfirm &&
                data.deleteconfirm.toString().trim().toUpperCase() === 'DELETE'
              ) {
                this.doDeleteAll();
                return true;
              } else {
                // Show error message
                Toast.show({
                  text: 'Please type DELETE to confirm',
                  duration: 'short',
                  position: 'bottom',
                });
                return false; // Keep dialog open
              }
            },
          },
          {
            text: 'CANCEL',
            role: 'cancel',
            handler: () => {
              console.log('Delete operation cancelled');
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }
  doDeleteAll() {
    var qry;
    if (this.authservice.pageName == 'Notes') qry = "update vers set notes=''";
    else if (this.authservice.pageName == 'Highlights')
      qry = "update vers set textHighlight=''";
    else if (this.authservice.pageName == 'Bookmarks')
      qry = 'update vers set bookMark=0';
    this.database.executeSql(qry, []).then((data) => {
      for (var i = 0; i < this.authservice.verseList; i++) {
        if (this.authservice.pageName == 'Notes')
          this.authservice.verseList[i].notes = '';
        else if (this.authservice.pageName == 'Highlights')
          this.authservice.verseList[i].Highlights = '';
        else if (this.authservice.pageName == 'Bookmarks')
          this.authservice.verseList[i].bookmark = false;
      }
      var deletedall = 1;

      this.nodataState = 'show';
      this.filters = 'hide';
      this.bindData();
      // this.authservice.showAlert("", "", "Deleted Succwessfully!");
    });
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
  }
}
