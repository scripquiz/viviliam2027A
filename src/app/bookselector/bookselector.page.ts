import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController } from '@ionic/angular';
import { AuthserviceProvider } from '../../providers/authservice/authservice';

@Component({
  selector: 'app-bookselector',
  templateUrl: './bookselector.page.html',
  styleUrls: ['./bookselector.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class BookselectorPage {
  public database: DatabaseConnection;
  public selectedsegmentemode: any = 'books';

  public books: any = [];
  public chapters: any = [];
  public vers: any = [];
  public filteredItems: any = [];
  public bookShow: any = 'show';
  public chaptersShow: any = 'hide';
  public versShow: any = 'hide';

  public searchKeyword: any = '';
  public selectedBookNumber: any = 1;
  public selectedChapterNumber: any = 1;
  public selectedVersNumber: any = 1;

  public selectedBookText: any = '';
  public selectedChapterText: any = '';
  public selectedVersText: any = '';

  public showsearchbar: any = 'show';
  public showchapterverseinfobar: any = 'hide';
  public chapterverseinfo: any = '';

  constructor(
    public databaseService: DatabaseService,
    public platform: Platform,
    public authservice: AuthserviceProvider,
    public navctrl: NavController
  ) {}

  ionViewDidEnter() {
    this.authservice.readMode = 'CHAPTER';
    this.selectedBookNumber = this.authservice.defaultBookNumber;
    this.selectedChapterNumber = this.authservice.defaultChapterNumber;
    this.selectedVersNumber = 1;
    this.selectedVersText = 1;
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          this.loadBooks();
        });
    });
  }
  async filterList(evt) {
    this.filteredItems = [];
    const searchTerm = evt.srcElement.value;

    if (searchTerm == '') {
      return;
    }
    if (!searchTerm || searchTerm == '') {
      return;
    }

    if (this.selectedsegmentemode == 'books') this.filteredItems = this.books;
    if (this.selectedsegmentemode == 'chapters')
      this.filteredItems = this.chapters;
    else if (this.selectedsegmentemode == 'vers')
      this.filteredItems = this.vers;

    this.filteredItems = this.filteredItems.filter((data) => {
      if (data.item && searchTerm) {
        setTimeout(() => {
          let b = document.getElementById('search-container');
          if (b) b.scrollTop = 0;
        }, 100);
        var searchClean =
          data.item
            .toString()
            .substring(0, data.item.toString().indexOf('<') - 1) +
          data.item.toString().substring(data.item.toString().indexOf('>'));
        searchClean = searchClean.split('</span>').join('').split('>').join('');
        //return (data.item.toUpperCase().indexOf(searchTerm.toUpperCase()) > -1);
        return searchClean.toUpperCase().indexOf(searchTerm.toUpperCase()) > -1;
      }
      return false; // Add this line to ensure all code paths return a value
    });
  }

  segmentChanged(ev: any) {
    if (this.selectedsegmentemode == 'books') {
      this.showsearchbar = 'show';
      this.showchapterverseinfobar = 'hide';
      this.loadBooks();
    } else if (this.selectedsegmentemode == 'chapters') {
      this.showsearchbar = 'hide';
      this.showchapterverseinfobar = 'show';
      this.chapterverseinfo = this.selectedBookText;
      this.bindChapters(this.selectedBookNumber);
    } else {
      if (this.selectedChapterNumber == '') {
        this.authservice.defaultChapterNumber = 1;
        this.selectedChapterNumber = 1;
        this.selectedChapterText = 1;
      }
      this.showsearchbar = 'hide';
      this.showchapterverseinfobar = 'show';
      this.chapterverseinfo =
        this.selectedBookText + ' ' + this.selectedChapterNumber;
      this.bindVers(this.selectedChapterNumber);
    }
  }
  navigate(selectedItem, selectedText) {
    this.authservice.dataLoaded = 0;
    console.log('Navigate : ' + selectedItem + ' - ' + selectedText);
    this.searchKeyword = '';
    this.filteredItems = [];
    if (this.selectedsegmentemode == 'books') {
      this.showchapterverseinfobar = 'hide';
      this.selectedBookNumber = selectedItem;
      this.selectedsegmentemode = 'chapters';
      //this.authservice.defaultBookNumber = selectedItem;
      this.selectedBookText = selectedText;
      //if(this.selectedChapterNumber == "")
      //{
      this.authservice.defaultChapterNumber = 1;
      this.selectedChapterNumber = 1;
      //}
      this.authservice.defaultVersNumber = 1;
      this.selectedVersText = 1;
      this.bindChapters(selectedItem);
    } else if (this.selectedsegmentemode == 'chapters') {
      this.selectedChapterNumber = selectedItem;
      this.selectedsegmentemode = 'vers';
      //this.authservice.defaultChapterNumber = selectedItem;
      this.selectedChapterText = selectedText;
      this.authservice.defaultVersNumber = 1;
      this.selectedVersText = 1;
      this.bindVers(selectedItem);
    } else if (this.selectedsegmentemode == 'vers') {
      //this.authservice.defaultBookNumber = this.selectedBookNumber;
      //this.authservice.defaultChapterNumber = this.selectedChapterNumber;
      this.authservice.defaultVersNumber = selectedText;
      this.selectedVersText = selectedText;
      this.authservice.readMode = 'VERSE';
      this.authservice.totalVerseInchapter = this.chapters.length;
      //this.navctrl.navigateRoot("/tabslink/read");
      this.navBack();
    }
  }

  scrollTo() {
    setTimeout(() => {
      let b = document.getElementById('book' + this.selectedBookNumber);
      if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (b) b.scrollIntoView(false);
    }, 100);

    // setTimeout(() => {
    //   //this.elementRef.nativeElement.scrollTop = this.authservice.lastread_versescroll;
    //   //this.scroller.scrollToPosition([0,parseFloat(this.authservice.lastread_versescroll)]);
    //   let b = document.getElementById('book' + this.selectedBookNumber);
    //   this.content.scrollToPoint(0,b.offsetHeight * 24 , 100);

    // }, 100);
  }
  navBack() {
    this.authservice.timerState = 'YES';
    this.authservice.defaultBookNumber = this.selectedBookNumber;
    this.authservice.defaultChapterNumber = this.selectedChapterNumber;
    this.authservice.scrollmode = 'VERSE';
    this.authservice.dataLoaded = 0;
    this.authservice.dataLoadedCompare = 0;
    this.authservice.appstartesstae = '1';
    console.log('back');
    if (this.authservice.backToPage == 'compare')
      this.navctrl.navigateRoot('/tabslink/compare');
    else this.navctrl.navigateRoot('/tabslink/read');
  }
  navBackNoSet() {
    if (this.authservice.backToPage == 'compare') {
      this.authservice.dataLoadedCompare = 0;
      this.navctrl.navigateRoot('/tabslink/compare');
    } else {
      this.authservice.dataLoaded = 0;
      this.navctrl.navigateRoot('/tabslink/read');
    }
  }
  bindChapters(bookNumber) {
    this.bookShow = 'hide';
    this.chaptersShow = 'show';
    this.versShow = 'hide';
    this.chapters = [];

    this.database
      .executeSql(
        'SELECT x.cnumber from (SELECT distinct cnumber FROM vers where cnumber<>-1 and cnumber<>0 and cnumber>=1 and bibleid =? and booknumber=?  )x order by x.cnumber ',
        [this.authservice.defaultBibleId, this.selectedBookNumber]
      )
      .then(
        (data) => {
          for (var i = 0; i < data.rows.length; i++) {
            this.chapters.push({
              item: data.rows.item(i).cnumber,
              number: data.rows.item(i).cnumber,
            });
          }
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
        }
      );
  }
  bindVers(chapterNumber) {
    this.bookShow = 'hide';
    this.chaptersShow = 'hide';
    this.versShow = 'show';
    this.vers = [];

    this.vers = [];
    var resultData;
    var vnumber;
    this.database
      .executeSql(
        'SELECT x.vnumber from (SELECT distinct vnumber FROM vers where bibleid =? and booknumber=? and cnumber=?)x order by x.vnumber',
        [
          this.authservice.defaultBibleId,
          this.selectedBookNumber,
          this.selectedChapterNumber,
        ]
      )
      .then(
        (data) => {
          for (var i = 0; i < data.rows.length; i++) {
            vnumber = data.rows.item(i).vnumber;
            if (vnumber.toString().indexOf('.') == -1 && vnumber != '0') {
              this.vers.push({
                item: data.rows.item(i).vnumber,
                number: data.rows.item(i).vnumber,
              });
            }
          }
        },
        (e) => {
          console.log('select : ' + JSON.stringify(e));
          resultData = -1;
        }
      );

    /*this.vers.push({"item":"1", "number":"1"});
    this.vers.push({"item":"2", "number":"2"});
    this.vers.push({"item":"3", "number":"3"});
    this.vers.push({"item":"4", "number":"4"});
    this.vers.push({"item":"5", "number":"5"});
    this.vers.push({"item":"6", "number":"6"});
    this.vers.push({"item":"7", "number":"7"});
    this.vers.push({"item":"8", "number":"8"});
    this.vers.push({"item":"9", "number":"9"});*/
  }
  loadBooks() {
    this.bookShow = 'show';
    this.chaptersShow = 'hide';
    this.versShow = 'hide';
    this.books = [];
    var resultData;
    var qry;
    if (this.authservice.defaultBibleId == '5')
      qry =
        "select bnumber booknumber,fullname_english,  case '" +
        this.authservice.defaultBibleLanguage +
        "' when 'Tamil' then fullname_tamil else fullname_english end bookname, chapters chaptercount from books_etb a order by bnumber";
    else
      qry =
        "select bnumber booknumber,fullname_english,  case '" +
        this.authservice.defaultBibleLanguage +
        "' when 'Tamil' then fullname_tamil else fullname_english end bookname, chapters chaptercount from books a order by bnumber";
    this.database.executeSql(qry, []).then(
      (data) => {
        for (var i = 0; i < data.rows.length; i++) {
          if (data.rows.item(i).booknumber == this.selectedBookNumber)
            this.selectedBookText = data.rows.item(i).bookname;
          //this.books.push({"item":data.rows.item(i).bookname + " <span class='filterenglish' style='display:none'>" + data.rows.item(i).fullname_english +"</span>", "number":data.rows.item(i).booknumber, "chaptercount":data.rows.item(i).chaptercount});
          this.books.push({
            item:
              data.rows.item(i).bookname +
              " <span class='filterenglish' style='display:none'>" +
              data.rows.item(i).fullname_english +
              '</span>',
            number: data.rows.item(i).booknumber,
            chaptercount: data.rows.item(i).chaptercount,
          });
        }
      },
      (e) => {
        console.log('select : ' + JSON.stringify(e));
        resultData = -1;
      }
    );

    /*this.books.push({"number":"1", "item":"a"});
    this.books.push({"number":"2", "item":"b"});
    this.books.push({"number":"3", "item":"c"});
    this.books.push({"number":"4", "item":"d"});
    this.books.push({"number":"5", "item":"e"});*/

    this.scrollTo();
  }
}
