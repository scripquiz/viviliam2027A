import { Component, ChangeDetectionStrategy } from '@angular/core';

import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { Router } from '@angular/router';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController } from '@ionic/angular';
import { AppComponent } from '../../app/app.component';
@Component({
  selector: 'app-addnotes',
  templateUrl: './addnotes.page.html',
  styleUrls: ['./addnotes.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AddnotesPage {
  private database: DatabaseConnection;
  public selected_fornotes_bookname: any;
  public selected_fornotes_cnumber: any;
  public selected_fornotes_vnumber: any;
  public selected_fornotes_bible: any;
  public selected_fornotes_versData: any;
  public notes: any = '';
  public selected_VID: any;
  public versData: any = 'Loading...';
  public titlefont: any = '';
  public booktitlefont: any = '';
  public font: any = '';
  public isContentLoaded: any = 0;
  constructor(
    private router: Router,
    public navctrl: NavController,
    public databaseService: DatabaseService,
    private appComponent: AppComponent,
    public platform: Platform,
    public authservice: AuthserviceProvider
  ) {}
  goBack() {
    for (var i = 0; i < this.authservice.verseList.length; i++)
      this.authservice.verseList[i].isSelected = false;
    this.appComponent.drawer = 'drawershide';
    if (this.authservice.currentPage == 'READ')
      this.navctrl.navigateRoot('/tabslink/read');
    else {
      var counter;
      counter = Math.floor(Math.random() * 100);
      this.router.navigateByUrl('/readmarklist/' + counter);
    }
  }
  ionViewDidEnter() {
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          this.appComponent.drawer = 'drawerhide';
          var qry;
          var vid;
          if (this.authservice.pageMode != 'edit') {
            for (var i = 0; i < this.authservice.verseList.length; i++) {
              if (this.authservice.verseList[i].isSelected) {
                this.selected_fornotes_bible =
                  this.authservice.defaultBibleVersionText;
                this.selected_fornotes_bookname =
                  this.authservice.verseList[i].bookname;
                this.selected_fornotes_cnumber =
                  this.authservice.defaultChapterNumber;
                this.selected_fornotes_vnumber =
                  this.authservice.verseList[i].vnumber;
                this.selected_fornotes_versData =
                  this.authservice.verseList[i].verseData;
                vid = this.authservice.verseList[i].vid;
                this.selected_VID = vid;
              }
            }
          } else {
            vid = this.authservice.selectedVID;
            this.selected_VID = this.authservice.selectedVID;
          }
          qry =
            "select x.* from (SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid = 5 and a.vid=" +
            vid +
            ' union ';
          qry +=
            "SELECT a.*, c.*, case upper(c.language)  when 'TAMIL' then fullname_tamil else fullname_english end booknamecaption, case upper(c.language) when 'TAMIL' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b, bibles c where a.booknumber=b.bnumber and a.bibleid = c.id and bibleid <>5 and a.vid =" +
            vid +
            ' )x order by x.bibleid, x.booknumber, x.cnumber, x.vnumber  ';
          this.database.executeSql(qry, []).then((data) => {
            this.notes = data.rows.item(0).notes;
            // try
            // {
            // this.notes = this.notes.split("`").join("'");
            // }
            // catch{}
            this.selected_fornotes_bible = data.rows.item(0).title;
            this.selected_fornotes_bookname = data.rows.item(0).fullbookname;
            this.selected_fornotes_cnumber = data.rows.item(0).cnumber;
            this.selected_fornotes_vnumber = data.rows.item(0).vnumber;
            if (data.rows.length == 0) {
              //this.authservice.showAlert("","",this.authservice.pageName + " not recorded");

              return;
            } else {
              for (var i = 0; i < data.rows.length; i++) {
                this.versData = '';

                if (this.authservice.defaultBibleLanguage == 'Tamil') {
                  this.titlefont = 'font14';
                  this.font = 'font16';
                  this.booktitlefont = 'font11';
                  this.authservice.globalfont =
                    this.authservice.fontFamilyTamil;
                } else {
                  this.titlefont = 'font16';
                  this.font = 'font18';
                  this.booktitlefont = 'font13';
                  this.authservice.globalfont =
                    this.authservice.fontFamilyEnglish;
                }
                var versetext = data.rows.item(i).vers;
                var vnumber = data.rows.item(i).vnumber;

                versetext = versetext.split('#').join('<span class=showred>');
                versetext = versetext.split('$').join('</span>');
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
                versetext = versetext
                  .split('ḇ')
                  .join("<span class='boldtext'>");
                versetext = versetext.split('Ḇ').join('</span>');
                if (this.authservice.BSIRedLettersShow == '1') {
                  versetext = versetext.split('ṟ').join('<span class=showred>');
                  versetext = versetext.split('Ṟ').join('</span>');
                }
                versetext = versetext.split('ṟ').join('');
                versetext = versetext.split('Ṟ').join('');

                var boldText = this.authservice.bold_words;
                for (
                  var boldindex = 0;
                  boldindex < boldText.length;
                  boldindex++
                ) {
                  if (versetext.indexOf(boldText[boldindex]) != -1) {
                    versetext = versetext
                      .split(boldText[boldindex])
                      .join(
                        "<span class='boldtext'>" +
                          boldText[boldindex] +
                          '</span>'
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
                // this.readMarkList.push({"vid":data.rows.item(i).vid, "bibleid":data.rows.item(i).bibleid, "bible":data.rows.item(i).title, "bookname": data.rows.item(i).fullbookname, "booknumber":data.rows.item(i).booknumber, "cnumber":data.rows.item(i).cnumber, "vnumber": data.rows.item(i).vnumber, "versData" : this.versData, "textHighlight": data.rows.item(i).textHighlight, "bookMark":data.rows.item(i).bookMark, "notes":data.rows.item(i).notes,  "popclass":"markpopup-hide"});
                this.selected_fornotes_versData = this.versData;
              }
            }
            this.isContentLoaded = 1;
          });
        });
    });
  }
  saveNotes() {
    var qry;
    this.notes = this.notes.substring(0, 500);

    this.notes = this.notes.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
    //var excludeCharacters = "~,!,@,#,$,%,^,&,*,(,),;,/,{,},-,=,+,<,>,?,`,.\',\"";
    //var excludeCharacters = "~,!,@,#,$,%,^,&,*,(,),;,/,{,},-,=,+,<,>,?,.";
    var excludeCharacters = '<,>';
    var excludeCharactersArray = excludeCharacters.split(',');
    var isSecialCharacters = 0;
    for (var i = 0; i < excludeCharactersArray.length; i++) {
      if (this.notes.indexOf(excludeCharactersArray[i]) != -1) {
        isSecialCharacters = 1;
        this.notes = this.notes.split(excludeCharactersArray[i]).join('');
      }
    }

    //this.notes = this.notes.split("'").join("`");
    this.notes = this.notes.split("'").join('’');
    if (this.notes == '') {
      alert('Enter notes');
    } else {
      qry =
        "update vers set notes='" +
        this.notes +
        "', notesOn=CURRENT_TIMESTAMP where vid=" +
        this.selected_VID;
      this.database.executeSql(qry, []).then((data) => {
        for (var i = 0; i < this.authservice.verseList.length; i++) {
          if (this.authservice.verseList[i].vid == this.selected_VID)
            this.authservice.verseList[i].notes = this.notes;
        }
        this.goBack();
      });
    }
  }
}
