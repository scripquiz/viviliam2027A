import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, NgZone } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { Platform, NavController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { DarkModeService } from '../services/dark-mode.service';
import { Subscription } from 'rxjs';

import { AppComponent } from '../../app/app.component';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SearchPage {
  // Placeholder tokens for HTML entity preservation during highlighting.
  // Chosen to be extremely unlikely in real Bible text.
  private readonly Q_PLACEHOLDER = '\u0001Q';
  private readonly APOS_PLACEHOLDER = '\u0002A';
  private readonly DOT_PLACEHOLDER = '\u0003D';

  public currentpage: number = 1;
  public totalpages: number = 15;
  public showSearchNavigation: 'show' | 'hide' = 'hide';
  public database: DatabaseConnection;
  public versData: string = '';
  public verseList: Array<{
    sn: number;
    verseData: string;
    bibleid: number;
    booknumber: number;
    cnumber: number;
    vnumber: number;
  }> = [];
  public searchText: string = '';
  public pager: string = 'Loading...';
  public gotoPage: string = '';
  public showverse: 'show' | 'hide' = 'hide';
  public searchinfo: string = '';
  public searchInprocess: boolean = false;
  public searchInput: string = '';
  public search_submited: number = 0;
  public isDarkMode: boolean = false;
  private darkModeSubscription: Subscription;

  constructor(
    public appComponent: AppComponent,
    public screenorientation: ScreenOrientationService,
    public menuCtrl: MenuController,
    public authservice: AuthserviceProvider,
    public platform: Platform,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    private ngZone: NgZone,
    private darkModeService: DarkModeService
  ) {
    this.setSearchData();

    // Subscribe to dark mode state changes
    this.darkModeSubscription = this.darkModeService.darkModeState$.subscribe(
      (state) => {
        this.isDarkMode = state.searchDarkMode || state.globalDarkMode;
        this.applyDarkMode();
      }
    );
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true);
  }

  ionViewDidEnter() {
    this.authservice.showsign = 0;
    this.applyDarkMode();
    this.platform.ready().then(() => {
      // Critical fix for Tamil character input in Capacitor
      Keyboard.setAccessoryBarVisible({ isVisible: false });
      Keyboard.setScroll({ isDisabled: false });
      // Removed setResizeMode that was causing TypeScript errors

      // Enhanced input handling for Tamil characters
      const searchInputs = document.querySelectorAll('ion-input');
      searchInputs.forEach((input) => {
        input.addEventListener('ionFocus', () => {
          console.log('Input focused - enabling proper keyboard handling');
          Keyboard.setScroll({ isDisabled: false });

          // Force re-render of input to ensure IME works correctly
          setTimeout(() => {
            this.ngZone.run(() => {
              // This triggers Angular change detection
              this.searchInprocess = this.searchInprocess;
            });
          }, 50);
        });
      });

      // Listen to keyboard events
      Keyboard.addListener('keyboardWillShow', () => {
        Keyboard.setScroll({ isDisabled: false });
      });
    });
  }

  ionViewWillLeave() {
    this.platform.ready().then(() => {
      Keyboard.setScroll({ isDisabled: false });
      // Remove keyboard listeners when leaving the page
      Keyboard.removeAllListeners();
    });
  }

  ngOnDestroy() {
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }

  applyDarkMode() {
    this.darkModeService.applyPageDarkMode('search', 'app-search ion-content');
    // Also update status bar when on this page
    this.darkModeService.updateStatusBar('search');
  }

  setSearchData() {
    this.authservice.searchInfo =
      this.authservice.searchbibleInfo +
      ' - ' +
      this.authservice.searchcategoryinfo +
      ' - ' +
      this.authservice.searchOption;
    this.authservice.currentPage = 'SEARCH';

    this.platform.ready().then(() => {
      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (this.screenorientation.type == 'landscape-primary') {
          this.authservice.orientation = 'landscape';
        } else {
          this.authservice.orientation = 'portrait';
        }
      });
    });
    console.log('View did enter');
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          if (!this.authservice.defaultbibleid_setforsearch) {
            this.getBibleList();
            this.authservice.defaultbibleid_setforsearch = true;
          }
        });
    });
  }
  getBibleList() {
    this.database
      .executeSql('SELECT * FROM bibles order by seq', [])
      .then((data) => {
        console.log('Books count ' + data.rows.length);
        this.authservice.bibleList = [];

        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).defaultbible == '1') {
            this.authservice.defaultBibleId = data.rows.item(j).id;
            this.authservice.defaultBibleVersionText = data.rows.item(j).title;

            this.authservice.defaultBibleLanguage = data.rows.item(j).language;

            this.appComponent.initializeData();
          }

          this.authservice.bibleList.push({
            id: data.rows.item(j).id,
            title: data.rows.item(j).title,
            language: data.rows.item(j).language,
            defaultbible: data.rows.item(j).defaultbible,
          });
        }
      });
  }
  initiateSearchBible() {
    this.currentpage = 1;
    this.gotoPage = '';
    this.searchInput = this.searchText.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
    this.searchBible();
  }

  searchBible() {
    this.searchInprocess = true;
    this.pager = 'Looking...';
    this.showverse = 'hide';
    this.versData = '';
    this.verseList = [];

    const excludeCharacters = this.getForbiddenChars();
    if (this.containsForbiddenChars(excludeCharacters)) {
      return;
    }

    this.search_submited = 1;
    this.showSearchNavigation = 'show';

    const safeSearchInput = this.escapeForLike(this.searchInput);
    const searchVerse = this.buildWhereClause(safeSearchInput);
    const qry = this.buildQuery(safeSearchInput, searchVerse);

    console.log('Search qry ' + qry);
    this.database.executeSql(qry, [
      parseInt(this.authservice.searchBible, 10),
      parseInt(this.authservice.SearchFromBook, 10),
      parseInt(this.authservice.SearchToBook, 10),
    ]).then((data) => {
      if (data.rows.length == 0) {
        this.pager = 'Verse not found';
        this.showverse = 'hide';
      } else {
        this.showverse = 'show';
        this.versData = '';
        const font = this.authservice.searchLanguage == 'Tamil' ? 'font16' : 'font18';
        this.totalpages = parseInt((data.rows.length / 25).toString());
        if (data.rows.length % 25 > 0) this.totalpages++;

        const startIndex = this.currentpage * 25 - 25;
        let endIndex = this.currentpage * 25 - 1;
        if (this.currentpage == this.totalpages && data.rows.length % 25 > 0) {
          endIndex = (data.rows.length % 25) + this.currentpage * 25 - 25 - 1;
        }

        this.pager = 'Page ' + this.currentpage + ' of ' + this.totalpages;
        const myarr = this.searchInput.split(' ');
        let sn = 1;
        for (var i = startIndex; i <= endIndex; i++) {
          this.versData = '';
          const row = data.rows.item(i);
          const verseMarkup = this.renderHighlightedVerse(row, myarr);

          this.versData +=
            "<p class='searchvers " +
            font +
            "'><span class='black-color'>" +
            row.bookname +
            '&nbsp;' +
            row.cnumber +
            ':' +
            row.vnumber +
            '</span><br>' +
            verseMarkup +
            '</p>';

          this.verseList.push({
            sn: sn,
            verseData: this.versData,
            bibleid: row.bibleid,
            booknumber: row.booknumber,
            cnumber: row.cnumber,
            vnumber: row.vnumber,
          });
          sn++;
        }
      }
      this.searchInprocess = false;
      this.scrollTo();
    });
  }

  /** Returns the list of forbidden characters based on search language mode. */
  private getForbiddenChars(): string[] {
    let excludeCharacters =
      '1,2,3,4,5,6,7,8,9,0,~,@,#,$,%,^,*,(,),{,},-,=,+,<,>,?,`,[,],%,_,*';
    if (this.authservice.searchBible != 1 && this.authservice.searchBible != 2) {
      excludeCharacters +=
        ',' + 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z';
    }
    return excludeCharacters.split(',');
  }

  /** Checks if searchInput contains any forbidden characters; shows alert and returns true if found. */
  private containsForbiddenChars(chars: string[]): boolean {
    let isSpecial = false;
    for (let i = 0; i < chars.length; i++) {
      if (this.searchInput.indexOf(chars[i]) != -1) {
        isSpecial = true;
      }
    }
    if (!isSpecial) return false;

    this.searchInprocess = false;
    this.pager = 'Verse not found';
    const isTamilSearch = this.authservice.searchBible == 1 || this.authservice.searchBible == 2;
    this.authservice.showAlert(
      '',
      '',
      isTamilSearch
        ? 'Numbers and Special characters are not allowed in search'
        : 'Special characters, Numbers and English alphabets are not allowed in Tamil Bible search'
    );
    return true;
  }

  /** Escapes backslashes and single quotes for safe LIKE pattern usage. */
  private escapeForLike(input: string): string {
    return input.split('\\').join('').split("'").join("''");
  }

  /** Builds the SQL search clause based on the selected search option (EXACT / ANY / ALL). */
  private buildWhereClause(safeInput: string): string {
    const option = this.authservice.searchOption.toUpperCase();
    if (option === 'EXACT') {
      return (
        "replace(replace(vers, '&quot;', '" + this.Q_PLACEHOLDER + "'), '&apos;','" +
        this.APOS_PLACEHOLDER + "') like '%" + safeInput + "%'"
      );
    }

    const words = safeInput.split(' ');
    const sep = option === 'ANY' ? ' or ' : ' and ';
    return '(' + words.map(w => {
      return "replace(replace(vers, '&quot;', '" + this.Q_PLACEHOLDER + "'), '&apos;','" + this.APOS_PLACEHOLDER + "') like '%" + w + "%'";
    }).join(sep) + ')';
  }

  /** Builds the full SQL query for execution. */
  private buildQuery(safeInput: string, searchVerse: string): string {
    const searchBibleNum = parseInt(this.authservice.searchBible, 10);
    const lang = this.authservice.searchLanguage === 'Tamil' ? 'Tamil' : 'English';
    const tableClause = searchBibleNum === 5 ? 'vers a, books_etb b' : 'vers a, books b';

    return `SELECT a.*, case '${lang}' when 'Tamil' then fullname_tamil else fullname_english end bookname, case '${lang}' when 'Tamil' then fullname_tamil else fullname_english end fullbookname FROM ${tableClause} where a.booknumber=b.bnumber and bibleid = ? and a.booknumber between ? and ? and ${searchVerse} and vnumber <>'0' order by a.bibleid,a.booknumber,a.cnumber, a.vnumber`;
  }

  /** Renders highlighted verse text for a single row: escape entities, highlight matches, restore. */
  private renderHighlightedVerse(row: any, searchTerms: string[]): string {
    let versetext = row.vers
      .split('&quot;').join(this.Q_PLACEHOLDER)
      .split('&apos;').join(this.APOS_PLACEHOLDER)
      .split('.').join(this.DOT_PLACEHOLDER);

    const option = this.authservice.searchOption.toUpperCase();
    if (option === 'EXACT') {
      versetext = versetext.replace(
        new RegExp(
          this.searchInput.split("'").join(this.APOS_PLACEHOLDER)
            .split('"').join(this.Q_PLACEHOLDER)
            .split('.').join(this.DOT_PLACEHOLDER),
          'gi'
        ),
        '<span class=showYellow>$&</span>'
      );
    } else {
      for (let j = 0; j < searchTerms.length; j++) {
        versetext = versetext.replace(
          new RegExp(
            searchTerms[j].split("'").join(this.APOS_PLACEHOLDER)
              .split('"').join(this.Q_PLACEHOLDER)
              .split('.').join(this.DOT_PLACEHOLDER),
            'gi'
          ),
          '###$&@@@'
        );
      }
    }

    // Restore placeholders and apply special markup
    versetext = versetext.split(this.APOS_PLACEHOLDER).join('&apos;')
      .split(this.Q_PLACEHOLDER).join('&quot;')
      .split(this.DOT_PLACEHOLDER).join('.');
    versetext = versetext.split('###').join('<span class=showYellow>')
      .split('@@@').join('</span>');

    // Bible-specific markup passes (deduplicated)
    versetext = versetext.split('*').join('')
      .split('␢').join('')
      .split('§').join('')
      .split('(p)').join('')
      .split('(P)').join('')
      .split('#').join('')
      .split('$').join('')
      .split('ṟ').join('')
      .split('Ṟ').join('')
      .split('ḇ').join("<span class='boldtext'>")
      .split('Ḇ').join('</span>')
      .split('⒫').join('')
      .split('⒯').join('');

    if (row.bibleid == 2) {
      versetext = versetext.split('[').join(
        '<span class="' + this.authservice.globalfont + 'Italic Italic">'
      ).split(']').join('</span>');
    } else if (row.bibleid == 3) {
      const chosen = this.authservice.BSINumberShow == '1' ? 'textgrey>[' : 'textgrey-hide>[';
      versetext = versetext.split('[').join('<span class=' + chosen).split(']').join(']</span>');
    }

    return versetext;
  }
  scrollTo() {
    setTimeout(() => {
      let b = document.getElementById('item1');
      if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }
  gotoPrevPage() {
    if (this.currentpage > 1) {
      this.currentpage--;
      this.searchText = this.searchInput;
      this.searchBible();
    }
    else this.authservice.showAlert('', '', 'Beginning of page');
  }
  gotoNextPage() {
    if (this.currentpage < this.totalpages) {
      this.currentpage++;
      this.searchText = this.searchInput;
      this.searchBible();
    }
    else this.authservice.showAlert('', '', 'End of page');
  }
  gotoPageNumber() {
    // Dismiss keyboard when enter is pressed or Go button is clicked
    Keyboard.hide();

    if (this.gotoPage.toString().indexOf('.') != -1)
      this.authservice.showAlert('', '', 'Enter valid page number');
    else if (this.gotoPage == '')
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    else if (
      parseInt(this.gotoPage) < 0 ||
      parseInt(this.gotoPage) > this.totalpages
    ) {
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    } else {
      this.currentpage = parseInt(this.gotoPage, 10);
      this.searchText = this.searchInput;
      this.searchBible();
    }
  }
  selectItemFromSearch(bibleid, booknumber, cnumber, vnumber) {
    // Save the current reading position before navigating to search results
    if (!this.authservice.isViewingSearchResult) {
      this.authservice.saveReadingState();
    }

    // Set flag that we're viewing a search result
    this.authservice.isViewingSearchResult = true;
    this.authservice.searchResultReference = this.getBookReference(
      booknumber,
      cnumber,
      vnumber
    );

    this.database
      .executeSql("update bibles set defaultbible = '0'", [])
      .then((data) => {
        this.database
          .executeSql("update bibles set defaultbible = '1' where id = ? ", [
            bibleid,
          ])
          .then((data) => {
            this.authservice.defaultBibleId = bibleid;

            this.authservice.defaultBibleId = bibleid;
            this.authservice.defaultBookNumber = booknumber;
            this.authservice.defaultChapterNumber = cnumber;
            this.authservice.defaultVersNumber = vnumber;

            this.database
              .executeSql('SELECT * FROM bibles where id = ?', [bibleid])
              .then((data) => {
                console.log('Books count ' + data.rows.length);
                if (data.rows.length >= 0) {
                  this.authservice.defaultBibleVersionText =
                    data.rows.item(0).title;
                  this.authservice.defaultBibleLanguage =
                    data.rows.item(0).language;
                }
                console.log('Set vnumbe ' + vnumber);
                this.authservice.readMode = 'VERSE';
                this.authservice.scrollmode = '';
                this.authservice.dataLoaded = 0;
                this.authservice.appstartesstae = '1';
                this.authservice.compareBibleId = bibleid;
                this.authservice.dataLoadedCompare = 0;
                this.navctrl.navigateRoot('/tabslink/read');
              });
          });
      });
  }

  // Helper method to get a formatted reference for the search result
  getBookReference(booknumber, cnumber, vnumber) {
    // Find the book name from the search results
    for (let item of this.verseList) {
      if (item.booknumber === booknumber && item.cnumber === cnumber) {
        // Extract the book name from the verse data
        const match = item.verseData.match(
          /<span class='black-color'>([^<]+)&nbsp;/
        );
        if (match && match[1]) {
          return `${match[1]} ${cnumber}:${vnumber}`;
        }
      }
    }
    return `${booknumber}:${cnumber}:${vnumber}`;
  }

  // Handle focus event specifically for Tamil input
  handleInputFocus() {
    console.log('Input focus - enabling Tamil keyboard support');
    // Ensure keyboard is properly configured for Tamil input
    this.platform.ready().then(() => {
      Keyboard.setScroll({ isDisabled: false });

      // Reset the input field state to ensure proper IME handling
      setTimeout(() => {
        this.ngZone.run(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.tagName === 'ION-INPUT') {
            // Force native keyboard to properly handle Tamil input
            const tmpValue = this.searchText;
            this.searchText = '';
            setTimeout(() => {
              this.searchText = tmpValue;
            }, 10);
          }
        });
      }, 50);
    });
  }
}
