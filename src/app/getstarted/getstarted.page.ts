import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController } from '@ionic/angular';
import { DatabaseImportService } from 'src/app/services/database-import.service';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { AppComponent } from '../../app/app.component';
// Replace Cordova ScreenOrientation with our Capacitor service
// import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { ScreenOrientationService } from '../services/screen-orientation.service';

@Component({
  selector: 'app-getstarted',
  templateUrl: './getstarted.page.html',
  styleUrls: ['./getstarted.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class GetstartedPage {
  public orientation: any;
  public fileSeq: any = 1;
  public totalImports: any = 13;
  public progress: any = 0;
  public database: DatabaseConnection;
  bibleTable: string =
    'create table if not exists bibles(id integer PRIMARY KEY, title TEXT,language TEXT)';
  compareBibleTable: string =
    'create table if not exists comparebibles(id integer PRIMARY KEY, title TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)';
  versTable: string =
    'create table if not exists vers(vid integer PRIMARY KEY AUTOINCREMENT,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)';
  versTempTable: string =
    'create table if not exists versTemp(vid integer,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)';
  verseFilledTable: string =
    'create table if not exists versefilled(id integer PRIMARY KEY, versefillesstatus TEXT)';
  booksTable: string =
    'create table if not exists books(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)';
  booksEtbTable: string =
    'create table if not exists books_etb(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)';
  fontsTable: string =
    'create table if not exists fonts(id integer, language TEXT, font_family TEXT, sample_text TEXT, isset integer)';
  configTable: string =
    'create table if not exists config(id integer, caption TEXT, value TEXT)';
  public cIdx = 0;
  public bibleData: any = [];
  public readyMesasge: any = 'Getting ready... Please wait...';
  private isImportInProgress = false;

  constructor(
    // Update to use ScreenOrientationService instead of ScreenOrientation
    public screenorientation: ScreenOrientationService,
    public appComponent: AppComponent,
    public authservice: AuthserviceProvider,
    public http: HttpClient,
    public sqlporter: DatabaseImportService,
    public databaseService: DatabaseService,
    public platform: Platform,
    public navctrl: NavController
  ) {
    console.log('Constructor fired');
    if (authservice._IS_UPDATE_BIBLE == 0) {
      this.authservice.selectedTheme = '1';
      this.authservice.paragraphMode = '0';
      this.authservice.versenumberShow = '1';
      this.authservice.BSINumberShow = '0';
      this.authservice.BSIRedLettersShow = '0';
      this.authservice.TextHighlightShow = '0';
      this.authservice.verseNumberSize = 'versenosmall';
      this.authservice.lineSpacing = 'linespacing_1';
      this.authservice.lineSpacingText = '1x';
      this.authservice.verseSpacing = 'versespacing_1';
      this.authservice.textSize = '3';
      this.authservice.dailyVerse = 'TAMIL';
      this.authservice.readSpeed = '1';
      this.appComponent.play_speed = '1';
      this.authservice.dailyQuiz = 'ENGLISH';
      this.authservice.dailyQuote = 'TAMIL';

      console.log(
        'paragraph mode from get started ' + this.authservice.paragraphMode
      );
      console.log(
        'verse number showfrom get started ' + this.authservice.versenumberShow
      );
      console.log(
        'verse number size get started ' + this.authservice.verseNumberSize
      );
      console.log(
        'Daly verse language number size get started ' +
          this.authservice.dailyVerse
      );
    }
    this.platform.ready().then(() => {
      // Use the type property from our service instead of directly accessing type
      if (
        this.screenorientation.type.toUpperCase().indexOf('LANDSCAPE') != -1
      ) {
        this.orientation = 'logo-landscape';
      } else {
        this.orientation = 'logo';
      }
    });
  }
  ionViewWillEnter() {
    console.log('ionViewWillEnter fired');
  }
  ionViewDidEnter() {
    console.log('ionViewDidEnter fired');
    this.platform.ready().then(() => {
      if (
        this.screenorientation.type.toUpperCase().indexOf('LANDSCAPE') != -1
      ) {
        this.authservice.orientation = 'landscape';
        this.orientation = 'logo-landscape';
      } else {
        this.authservice.orientation = 'portrait';
        this.orientation = 'logo';
      }

      // Use the onChange method from our service
      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (
          this.screenorientation.type.toUpperCase().indexOf('LANDSCAPE') != -1
        ) {
          this.authservice.orientation = 'landscape';
          this.orientation = 'logo-landscape';
        } else {
          this.authservice.orientation = 'portrait';
          this.orientation = 'logo';
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
          this.ensureSchema()
            .then(() => {
              if (this.authservice._IS_UPDATE_BIBLE == 0)
                this.database
                  .executeSql('update bibles set defaultbible=0', [])
                  .then((res) => {
                    console.log('Default bible reset');
                    var qry =
                      'update bibles set defaultbible=1 where id=' +
                      this.authservice.default_bibleid;

                    console.log('Default bible set : ' + qry);
                    this.database
                      .executeSql(qry, [])
                      .then((res) => {
                        console.log('Default bible set');
                      })
                      .catch((err) => {
                        console.log('Error in updating  default bibleid ');
                        console.log(JSON.stringify(err));
                      });
                  })
                  .catch((err) => {
                    console.log('Error in restting default bibleid ');
                    console.log(JSON.stringify(err));
                  });
              this.initializeData();
            })
            .catch((err) => {
              console.log('Error in creating get started schema');
              console.log(JSON.stringify(err));
            });
        });
    });
  }
  private async ensureSchema(): Promise<void> {
    const statements = [
      this.bibleTable,
      this.compareBibleTable,
      this.versTable,
      this.versTempTable,
      this.verseFilledTable,
      this.booksTable,
      this.booksEtbTable,
      this.fontsTable,
      this.configTable,
    ];

    for (const statement of statements) {
      await this.database.executeSql(statement, []);
    }
  }

  initializeData() {
    if (this.authservice._IS_UPDATE_BIBLE == 0)
      this.database
        .executeSql('delete from vers', [])
        .then((res) => {
          this.cIdx++;

          this.deletetVerseFilledTable();
        })
        .catch((err) => {
          console.log('Error in get started verse initialize');
          console.log(JSON.stringify(err));
        });
    else this.deletetVerseFilledTable();
  }
  deletetVerseFilledTable() {
    this.database
      .executeSql('delete from versefilled', [])
      .then((res) => {
        this.cIdx++;

        this.fillDatabase();
      })
      .catch((err) => {
        console.log('Error in delete versefilled table');
        console.log(JSON.stringify(err));
        this.isImportInProgress = false;
      });
  }
  insertVerseFilledTable() {
    this.database
      .executeSql(
        'insert into versefilled(versefillesstatus) values("filled")',
        []
      )
      .then((res) => {
        this.cIdx++;
        this.isImportInProgress = false;
        this.authservice.bibleImportInProgress = false;
        this.authservice._IS_UPDATE_BIBLE = 0;
        this.appComponent.initializeData();
        this.navctrl.navigateRoot('/tabslink/home');
      })
      .catch((err) => {
        console.log('Error in insert versefilled table------');
        console.log(JSON.stringify(err));
      });
  }
  // tamil b
  fillDatabase() {
    if (this.isImportInProgress) {
      return;
    }

    this.isImportInProgress = true;
    this.authservice.bibleImportInProgress = true;

    //this.loadBibile_4();
    //this.BackgroundMode.enable();
    //this.BackgroundMode.on("activate").subscribe(()=>{
    if (this.authservice._IS_UPDATE_BIBLE == 0) {
      this.database
        .executeSql('delete from vers', [])
        .then((res) => {
          this.importData();
        })
        .catch((err) => {
          console.log('Error in delete verse table------');
          console.log(JSON.stringify(err));
          this.isImportInProgress = false;
          this.authservice.bibleImportInProgress = false;
        });
    } else {
      this.database
        .executeSql('delete from versTemp', [])
        .then((res) => {
          this.database
            .executeSql(
              "insert into versTemp select * from vers where  ifnull(textHighlight,'') <> '' or ifnull(notes,'') <> '' or ifnull(bookMark,'0') <> '0'",
              []
            )
            .then((res) => {
              this.database
                .executeSql('delete from vers', [])
                .then((res) => {
                  this.importData();
                })
                .catch((err) => {
                  console.log('Error in delete verse table------');
                  console.log(JSON.stringify(err));
                  this.isImportInProgress = false;
                  this.authservice.bibleImportInProgress = false;
                });
            })
            .catch((err) => {
              console.log('Error in insert versTemp temp table------');
              console.log(JSON.stringify(err));
              this.isImportInProgress = false;
              this.authservice.bibleImportInProgress = false;
            });
        })
        .catch((err) => {
          console.log('Error in delete versTemp verse temp table------');
          console.log(JSON.stringify(err));
          this.isImportInProgress = false;
          this.authservice.bibleImportInProgress = false;
        });
    }
    //});
  }

  importData() {
    // Calculate progress at the start of the method
    const startProgress = ((this.fileSeq - 1) / this.totalImports) * 100;
    const targetProgress = (this.fileSeq / this.totalImports) * 100;

    const setProgress = (value: number) => {
      this.progress = Math.max(0, Math.min(100, Number(value.toFixed(1))));
    };

    // Update to initial progress for current step
    setProgress(startProgress);

    if (this.authservice._IS_UPDATE_BIBLE == 1) {
      if (
        (this.fileSeq == 1 ||
          this.fileSeq == 2 ||
          this.fileSeq == 3 ||
          this.fileSeq == 4 ||
          this.fileSeq == 6 ||
          this.fileSeq == 13) &&
        this.fileSeq != 9
      ) {
        // Small progress update to show HTTP request started
        setTimeout(() => {
          setProgress(startProgress + (targetProgress - startProgress) * 0.3);
        }, 100);

        this.http
          .get('assets/data/' + this.fileSeq + '.ts', { responseType: 'text' })
          .pipe(timeout(60000))
          .subscribe(
            (jsonRaw) => {
              let jsonData: unknown;
              try {
                jsonData = JSON.parse(jsonRaw);
              } catch (e) {
                this.handleImportError(this.fileSeq, e);
                return;
              }

              // Update progress to show data was received
              setProgress(
                startProgress + (targetProgress - startProgress) * 0.6
              );

              console.log('Json fetch : ' + jsonData);
              this.sqlporter
                .importJsonToDb(this.database, jsonData, ({ ratio }) => {
                  const stepProgress = 0.6 + ratio * 0.4;
                  setProgress(
                    Math.min(
                      targetProgress,
                      startProgress +
                        (targetProgress - startProgress) * stepProgress
                    )
                  );
                })
                .then((data) => {
                  //this.readyMesasge = "Initialization completed!";
                  console.log('Version ' + this.fileSeq + ' Uploaded');

                  // Final progress update for this step
                  setProgress(Math.min(targetProgress, 100));
                  this.fileSeq++;

                  if (this.fileSeq <= this.totalImports) {
                    // Short delay before starting next import for smoother UI
                    setTimeout(() => {
                      this.importData();
                    }, 200);
                  } else {
                    //this.loadBibile_3();
                    console.log('All versions uploaded');
                    //this.insertVerseFilledTable();

                    this.restoreVerseOldData();
                    //this.updateDefaultLanguage();
                    //this.navctrl.navigateRoot("/tabslink/home");
                  }
                })
                .catch((e) => this.handleImportError(this.fileSeq, e));
            },
            (e) => this.handleImportError(this.fileSeq, e)
          );
      } else {
        console.log('Version ' + this.fileSeq + ' skiped');

        // For skipped versions, update progress with animation
        setTimeout(() => {
          setProgress(Math.min(targetProgress, 100));
        }, 200);

        this.fileSeq++;

        if (this.fileSeq <= this.totalImports) {
          setTimeout(() => {
            this.importData();
          }, 300);
        } else {
          console.log('All versions uploaded');
          this.restoreVerseOldData();
        }
      }
    } else {
      // Skip file 9.ts (quiz of the day data)
      if (this.fileSeq == 9) {
        console.log('Version ' + this.fileSeq + ' (quiz of the day) skipped');

        // For skipped versions, update progress with animation
        setTimeout(() => {
          this.progress = Math.min(targetProgress, 100);
        }, 200);

        this.fileSeq++;

        if (this.fileSeq <= this.totalImports) {
          setTimeout(() => {
            this.importData();
          }, 300);
        } else {
          console.log('All versions uploaded');
          this.insertVerseFilledTable();
        }
      } else {
        // Small progress update to show HTTP request started
        setTimeout(() => {
          setProgress(startProgress + (targetProgress - startProgress) * 0.3);
        }, 100);

        this.http
          .get('assets/data/' + this.fileSeq + '.ts', { responseType: 'text' })
          .pipe(timeout(60000))
          .subscribe(
            (jsonRaw) => {
              let jsonData: unknown;
              try {
                jsonData = JSON.parse(jsonRaw);
              } catch (e) {
                this.handleImportError(this.fileSeq, e);
                return;
              }

              // Update progress to show data was received
              setProgress(
                startProgress + (targetProgress - startProgress) * 0.6
              );

              console.log('Json fetch : ' + jsonData);
              this.sqlporter
                .importJsonToDb(this.database, jsonData, ({ ratio }) => {
                  const stepProgress = 0.6 + ratio * 0.4;
                  setProgress(
                    Math.min(
                      targetProgress,
                      startProgress +
                        (targetProgress - startProgress) * stepProgress
                    )
                  );
                })
                .then((data) => {
                  //this.readyMesasge = "Initialization completed!";
                  console.log('Version ' + this.fileSeq + ' Uploaded');

                  // Final progress update for this step
                  setProgress(Math.min(targetProgress, 100));
                  this.fileSeq++;

                  if (this.fileSeq <= this.totalImports) {
                    // Short delay before starting next import for smoother UI
                    setTimeout(() => {
                      this.importData();
                    }, 200);
                  } else {
                    console.log('All versions uploaded');
                    this.insertVerseFilledTable();
                  }
                })
                .catch((e) => this.handleImportError(this.fileSeq, e));
            },
            (e) => this.handleImportError(this.fileSeq, e)
          );
      }
    }
  }

  private handleImportError(version: number, error: unknown) {
    console.error(`Data import failed for version ${version}`, error);
    this.isImportInProgress = false;
    this.authservice.bibleImportInProgress = false;
    this.authservice._IS_UPDATE_BIBLE = 0;
    const errorText = this.describeImportError(error);
    this.readyMesasge = `Initialization failed at version ${version}. ${errorText} Close and reopen the app to retry.`;
  }

  private describeImportError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return `Error: ${error.message.substring(0, 180)}. `;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return `Error: ${serialized.substring(0, 180)}. `;
      }
    } catch {
      // Ignore and use fallback below.
    }

    return '';
  }

  navigateToHome() {
    this.navctrl.navigateRoot('/tabslink/home');
  }
  restoreVerseOldData() {
    var qry;
    this.database
      .executeSql(
        'insert into versefilled(versefillesstatus) values("filled")',
        []
      )
      .then((res) => {
        //qry = 'update a set a.textHighlight=b.textHighlight, a.bookMark=b.bookMark, a.notes=b.notes, a.highlightOn=b.highlightOn, a.bookMarkOn=b.bookMarkOn, a.notesOn=b.notesOn from vers a, versTemp b where a.bibleid=b.bibleid and a.booknumber=b.booknumber and a.cnumber = b.cnumber and a.vnumber=b.vnumber';
        qry =
          'update vers set textHighlight=(select textHighlight from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber), ';
        qry +=
          'bookMark=(select bookMark from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber), ';
        qry +=
          'notes=(select notes from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber), ';
        qry +=
          'highlightOn=(select highlightOn from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber), ';
        qry +=
          'bookMarkOn=(select bookMarkOn from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber), ';
        qry +=
          'notesOn=(select notesOn from versTemp where vers.bibleid=versTemp.bibleid and vers.booknumber=versTemp.booknumber and vers.cnumber = versTemp.cnumber and vers.vnumber=versTemp.vnumber)';
        console.log('verse temp  : ' + qry);
        this.database
          .executeSql(qry, [])
          .then((res) => {
            this.database
              .executeSql(
                'update config set value = ' +
                  this.authservice._DB_VERSION +
                  ' where id=28',
                []
              )
              .then((res) => {
                this.isImportInProgress = false;
                this.authservice.bibleImportInProgress = false;
                this.authservice._IS_UPDATE_BIBLE = 0;
                this.navctrl.navigateRoot('/tabslink/home');
              })
              .catch((err) => {
                console.log(
                  'Error in insert verse temp update config table------'
                );
                console.log(JSON.stringify(err));
              });
          })
          .catch((err) => {
            console.log('Error in insert verse temp to vers table------');
            console.log(JSON.stringify(err));
          });
      })
      .catch((err) => {
        console.log('Error in insert versefilled table------');
        console.log(JSON.stringify(err));
      });
  }
}
