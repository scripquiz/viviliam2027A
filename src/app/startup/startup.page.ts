import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Platform, NavController } from '@ionic/angular';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { MenuController } from '@ionic/angular';
@Component({
  selector: 'app-startup',
  templateUrl: './startup.page.html',
  styleUrls: ['./startup.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StartupPage {
  private database: DatabaseConnection;
  bibleData = [];
  bibleTable: string =
    'create table if not exists bibles ( id integer PRIMARY KEY, title TEXT, description TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)';
  compareBibleTable: string =
    'create table if not exists comparebibles(id integer PRIMARY KEY, title TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)';
  versTable: string =
    'create table if not exists vers(vid integer PRIMARY KEY AUTOINCREMENT,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)';
  versTempTable: string =
    'create table if not exists versTemp(vid integer,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)';
  versTableFilled: string =
    'create table if not exists versefilled(id integer PRIMARY KEY, versefillesstatus TEXT)';
  booksTable: string =
    'create table if not exists books(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)';
  booksTable_ETB: string =
    'create table if not exists books_etb(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)';
  fontsTable: string =
    'create table if not exists fonts(id integer, language TEXT, font_family TEXT, sample_text TEXT, isset integer)';
  configTable: string =
    'create table if not exists config(id integer, caption TEXT, value TEXT)';
  verseOfTheDayTable: string =
    'create table if not exists verseoftheday(id integer PRIMARY KEY AUTOINCREMENT, Mnth integer, Date integer, Tvrs TEXT, Tref TEXT, Eref TEXT, Evrs TEXT)';
  quizOfTheDayTable: string =
    'create table if not exists quizoftheday(id integer PRIMARY KEY AUTOINCREMENT, Mnth integer, Date int, Tque TEXT, Tans TEXT, Tref TEXT, Eref TEXt, eans TEXT, eque TEXT)';
  quoteOfTheDayTable: string =
    'create table if not exists quoteoftheday(id integer PRIMARY KEY AUTOINCREMENT, mnth integer, date int, quot TEXT, athr TEXT, tquot TEXT)';
  notificationsTable: string =
    'create table if not exists notifications(id integer PRIMARY KEY, type TEXT,place TEXT, icon TEXT, startdate TEXT , enddate TEXT , subtitle TEXT, content TEXT, url TEXT,imgurl TEXT, url_text TEXT, footer1 TEXT, footer2 TEXT, read int, comments TEXT, like TEXT, duration TEXT,active TEXT, urlplace TEXT, version TEXT)';
  eventsTable: string =
    'create table if not exists events(id integer PRIMARY KEY, type TEXT,frequency TEXT, icon TEXT, startdate TEXT , enddate TEXT, startday TEXT, starttime TEXT, endday TEXT, endtime TEXT , subtitle TEXT, content TEXT, url TEXT, url_text TEXT, footer1 TEXT, footer2 TEXT, read int, active TEXT,urlplace TEXT,instructiontext TEXT, instructionurl TEXT,  visibility TEXT, whenvisible TEXT)';
  notificationsReadTable: string =
    'create table if not exists notificationsread(id integer PRIMARY KEY)';
  eventsReadTable: string =
    'create table if not exists eventsread(id integer PRIMARY KEY)';
  eventsInstructions: string =
    'create table if not exists eventinstructions(id integer PRIMARY KEY, type TEXT, instruction TEXT)';
  constructor(
    private menuCtrl: MenuController,
    private databaseService: DatabaseService,
    private platform: Platform,
    private navctrl: NavController,
    private authservice: AuthserviceProvider
  ) {
    // this.router.navigateByUrl("/tabslink/home");
    console.log('App started...');
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then(
          (db: DatabaseConnection) => {
            this.database = db;
            console.log('Starting DB initializing...');
            this.createBibleTable();
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
  createBibleTable() {
    console.log('DB creating started');
    this.database
      .executeSql(this.bibleTable, [])
      .then(() => this.createCompareBibleTable())
      .catch((e) => alert('table create error: ' + JSON.stringify(e)));
  }
  createCompareBibleTable() {
    console.log('Bible table created');
    this.database
      .executeSql(this.compareBibleTable, [])
      .then(() => this.createVerseTable())
      .catch((e) => alert('table create error: ' + JSON.stringify(e)));
  }
  createVerseTable() {
    console.log('Verse table created');
    this.database
      .executeSql(this.versTable, [])
      .then(() => this.createVerseTempTable())
      .catch((e) => alert('Verse create error: ' + JSON.stringify(e)));
  }
  createVerseTempTable() {
    console.log('Verse temp table created');
    this.database
      .executeSql(this.versTempTable, [])
      .then(() => this.createVerseFilledTable())
      .catch((e) => alert('Verse temp create error: ' + JSON.stringify(e)));
  }
  createVerseFilledTable() {
    console.log('Verse filled 1 table created');
    this.database
      .executeSql(this.versTableFilled, [])
      .then(() => this.createFontsTable())
      .catch((e) => alert('Verse Filled 1 create error: ' + JSON.stringify(e)));
  }
  createFontsTable() {
    console.log('Fonts filled table created');
    this.database
      .executeSql(this.fontsTable, [])
      .then(() => this.createConfigTable())
      .catch((e) => alert('Fonts table create error: ' + JSON.stringify(e)));
  }
  createConfigTable() {
    console.log('Config filled table created');
    this.database
      .executeSql(this.configTable, [])
      .then(() => this.createVerseOfTheDayTable())
      .catch((e) => alert('Fonts table create error: ' + JSON.stringify(e)));
  }
  createVerseOfTheDayTable() {
    console.log('Verse of the day table created');
    this.database
      .executeSql(this.verseOfTheDayTable, [])
      .then(() => this.createQuizOfTheDayTable())
      .catch((e) =>
        alert('Verse of the day table create error: ' + JSON.stringify(e))
      );
  }
  createQuizOfTheDayTable() {
    console.log('Quiz of the day table created');
    this.database
      .executeSql(this.quizOfTheDayTable, [])
      .then(() => this.createQuoteOfTheDayTable())
      .catch((e) =>
        alert('quiz of the day table create error: ' + JSON.stringify(e))
      );
  }
  createQuoteOfTheDayTable() {
    console.log('Quote of the day table created');
    this.database
      .executeSql(this.quoteOfTheDayTable, [])
      .then(() => this.createNotificationsTable())
      .catch((e) =>
        alert('quote of the day table create error: ' + JSON.stringify(e))
      );
  }
  createNotificationsTable() {
    console.log('Notifications read table created');
    this.database
      .executeSql(this.notificationsTable, [])
      .then(() => this.createNotificationsReadTable())
      .catch((e) =>
        alert('Notifications table create error: ' + JSON.stringify(e))
      );
  }
  createNotificationsReadTable() {
    console.log('Notifications read table created');
    this.database
      .executeSql(this.notificationsReadTable, [])
      .then(() => this.createEventsTable())
      .catch((e) =>
        alert('Notificationsread table create error: ' + JSON.stringify(e))
      );
  }

  createEventsTable() {
    console.log('Events read table created');
    this.database
      .executeSql(this.eventsTable, [])
      .then(() => this.createEventssReadTable())
      .catch((e) => alert('Events table create error: ' + JSON.stringify(e)));
  }
  createEventssReadTable() {
    console.log('Events read table created');
    this.database
      .executeSql(this.eventsReadTable, [])
      .then(() => this.createEventInstructionsTable())
      .catch((e) =>
        alert('Events read table create error: ' + JSON.stringify(e))
      );
  }
  createEventInstructionsTable() {
    console.log('Events read table created');
    this.database
      .executeSql(this.eventsInstructions, [])
      .then(() => this.createBooks_ETB())
      .catch((e) =>
        alert('Events instructions table create error: ' + JSON.stringify(e))
      );
  }
  createBooks_ETB() {
    console.log('Notifications read table created');
    this.database
      .executeSql(this.booksTable_ETB, [])
      .then(() => this.createBookTable())
      .catch((e) =>
        alert('Books_ETB table create error: ' + JSON.stringify(e))
      );
  }
  createBookTable() {
    console.log('Indexes started');
    this.database
      .executeSql(this.booksTable, [])
      .then(() => this.hotFixes())
      .catch((e) => alert('Book table create error: ' + JSON.stringify(e)));
  }
  hotFixes() {
    /*     this.database.executeSql("alter table events add whenvisible TEXT", [])
      .then(() => console.log("whenvisible column in eventy updated"))
      .catch(e => {
        console.log("Hot fixes alter column  whenvisible column in events error: " + JSON.stringify(e))

      }); */

    /*     this.database
      .executeSql('alter table quoteoftheday add tquot TEXT', [])
      .then(() => console.log('tquote column in quoteoftheday updated'))
      .catch((e) => {
        console.log(
          'Hot fixes alter column  tquote column in quoteoftheday error: ' +
            JSON.stringify(e)
        );
      }); */

    this.database
      .executeSql("update bibles set title ='WEB' where id = 1", [])
      .then(() => console.log('WEB bible id updated'))
      .catch((e) => {
        console.log('Hot fixes update WEB error: ' + JSON.stringify(e));
      });

    /*     console.log('Hot fixes started');
    this.database
      .executeSql('alter table notifications add icon TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes icon error: ' + JSON.stringify(e));
      });
    this.database
      .executeSql('alter table notifications add version TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes version error: ' + JSON.stringify(e));
      });

    this.database
      .executeSql('alter table notifications add active TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes active error: ' + JSON.stringify(e));
        console.log('done');
      }); */
    /*     this.database.executeSql("alter table notifications add imgurl TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes imgurl error: " + JSON.stringify(e))
        console.log("done")
      }); */
    /*     this.database.executeSql("alter table notifications add place TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes place error: " + JSON.stringify(e))
        console.log("done")
      });
    this.database.executeSql("alter table notifications add comments TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes comments error: " + JSON.stringify(e))
        console.log("done")
      }); */
    /*     this.database.executeSql("alter table notifications add like TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes like error: " + JSON.stringify(e))
        console.log("done")
      });
    this.database.executeSql("alter table notifications add duration TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes duration error: " + JSON.stringify(e))
        console.log("done")
      }); */
    /*     this.database
      .executeSql('alter table vers add textHighlight TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes textHighlight error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('alter table vers add bookMark TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes bookmark error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('alter table vers add notes TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes notes error: ' + JSON.stringify(e));
        console.log('done');
      }); */

    /*     this.database.executeSql("alter table events add instructionurl TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes events instructionurl error: " + JSON.stringify(e))
        console.log("done")
      });

    this.database.executeSql("alter table events add instructiontext TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes events instructiontext error: " + JSON.stringify(e))
        console.log("done")
      });

    this.database.executeSql("alter table events add visibility TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes events visibility error: " + JSON.stringify(e))
        console.log("done")
      });
    this.database.executeSql("alter table events add urlplace TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes events urlplace error: " + JSON.stringify(e))
        console.log("done")
      });

    this.database.executeSql("alter table notifications add urlplace TEXT", [])
      .then(() => console.log("done"))
      .catch(e => {
        console.log("Hot fixes notifications urlplace error: " + JSON.stringify(e))
        console.log("done")
      }); */

    /*     this.database
      .executeSql('alter table vers add highlightOn TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes highlightOn error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('alter table vers add bookMarkOn TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes bookMarkOn error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('alter table vers add notesOn TEXT', [])
      .then(() => console.log('done'))
      .catch((e) => {
        console.log('Hot fixes notesOn error: ' + JSON.stringify(e));
        console.log('done');
      }); */
    this.database
      .executeSql('SELECT * FROM config where id = 15', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(15, 'LAST_READ_BIBLE', ''), (16, 'LAST_READ_BOOK', ''), (17, 'LAST_READ_CHAPTER', ''), (18, 'LAST_READ_VERSIONTEXT', ''), (19, 'LAST_READ_VERSESCROLL', '0'), (20, 'LAST_READ_VERSNUMBER', '')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config addition insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 21', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(21, 'EVENTSREFRESH','2022/01/01'), (22, 'BIBLELASTUPDATED', 0)",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config addition last bible read insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 24', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(24, 'BACKUP','2022/01/01')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config addition last bible read insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('SELECT * FROM config where id = 23', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(23, 'GUESTID','2022/01/01')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config addition last bible read insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.database
      .executeSql('SELECT * FROM config where id = 25', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(25, 'BSINUMBERSHOW','0')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config addition last bible read insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 26', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(26, 'USERID','')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config USERID insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 27', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(27, 'USERNAME','')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config USERNAME insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 28', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(28, 'DBVERSION','')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config DBVERSION insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 30', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(30, 'COMPARELABELSHOW','1')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config COMPARELABELSHOW insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 31', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(31, 'FULLSCREENMODE','1')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config COMPARELABELSHOW insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 32', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(32, 'TEXTHIGHLIGHT','0')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config TEXTHIGHLIGHT insert error: ' +
                  JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 33', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(33, 'AUDIOSPEED','1')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config AUDIOSPEED insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 29', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(29, 'BSIREDLETTERSSHOW','0')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config DBVERSION insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes place error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 21', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(21, 'EVENTSREFRESHED', '2021/11/1')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config EVENTS insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes EVENTS error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 23', [])
      .then((data) => {
        if (data.rows.length == 0) {
          var uuid;
          uuid = this.uuid();
          console.log('UID' + uuid);
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(23, 'GUESTID', '" +
                uuid +
                "')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config guestid insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        } else if (data.rows.item(0).value == '') {
          uuid = this.uuid();
          this.database
            .executeSql(
              "update  CONFIG set value ='" + uuid + "' where id=23",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes update guestid  error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes EVENTS error: ' + JSON.stringify(e));
        console.log('done');
      });

    this.database
      .executeSql('SELECT * FROM config where id = 24', [])
      .then((data) => {
        if (data.rows.length == 0) {
          this.database
            .executeSql(
              "INSERT INTO CONFIG(id, caption, value) values(24, 'BACKUP', '')",
              []
            )
            .then(() => console.log('done'))
            .catch((e) => {
              console.log(
                'Hot fixes config EVENTS insert error: ' + JSON.stringify(e)
              );
              console.log('done');
            });
        }
      })
      .catch((e) => {
        console.log('Hot fixes EVENTS error: ' + JSON.stringify(e));
        console.log('done');
      });
    this.initializeIndexes();
  }

  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
  initializeIndexes() {
    console.log('Indexing started...');
    /*this.database.executeSql(this.id1 , [])
    .then(() => 
    {
    if(this.crrentIndex<=this.totalIndexes)
    {
      console.log("Index " + this.crrentIndex + " created");
  
      this.crrentIndex++;
      console.log("done") 
    }
    else
    this.initializeBibles();
    }
      )
    .catch(e => alert("Index " + this.crrentIndex+" create error: " + JSON.stringify(e)));*/
    this.initializeBibles();
  }

  initializeBibles() {
    console.log('Books table created');
    this.bibleData = [];

    var resultData;
    var availableBibles;
    console.log('Bible initialization started');
    this.database.executeSql('SELECT * FROM bibles', []).then(
      (data) => {
        console.log('Books count ' + data.rows.length);
        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).defaultbible == '1') {
            this.authservice.defaultBibleId = data.rows.item(j).id;
            this.authservice.defaultBibleVersionText = data.rows.item(j).title;
          }
          this.authservice.bibleList.push({
            id: data.rows.item(j).id,
            title: data.rows.item(j).title,
            language: data.rows.item(j).language,
            defaultbible: data.rows.item(j).defaultbible,
          });
        }
        availableBibles = data.rows.length;

        fetch('assets/data/bibles.ts')
          .then((res) => res.json())
          .then((json) => {
            this.bibleData = json;
            console.log('Available Bibles in Json' + this.bibleData.length);
            if (availableBibles < this.bibleData.length) {
              console.log('Bible updating...');
              this.updateBibles();
            } else {
              console.log('Verse initializing...');
              this.initializeVers();
            }
          })
          .catch((error) => {
            console.log(
              'bibles.ts not available in packaged assets, skipping runtime bible sync'
            );
            console.log(JSON.stringify(error));
            this.initializeVers();
          });
      },
      (e) => {
        console.log('select : ' + JSON.stringify(e));
        resultData = -1;
      }
    );
  }
  initializeVers() {
    console.log('Bible initialization started');
    this.database
      .executeSql('SELECT COUNT(*) as count FROM versefilled', [])
      .then((data) => {
        const verseFilledCount = Number(data.rows.item(0)?.count ?? 0);
        this.database
          .executeSql('SELECT COUNT(*) as count FROM vers', [])
          .then((verseData) => {
            const verseCount = Number(verseData.rows.item(0)?.count ?? 0);
            console.log('Verse readiness marker count ' + verseFilledCount);
            console.log('Verse table row count ' + verseCount);

            if (verseFilledCount > 0 || verseCount > 0) {
              if (verseFilledCount === 0 && verseCount > 0) {
                this.database
                  .executeSql(
                    "insert into versefilled(versefillesstatus) values('filled')",
                    []
                  )
                  .catch((insertErr) => {
                    console.log('Unable to backfill versefilled marker');
                    console.log(JSON.stringify(insertErr));
                  });
              }
              this.setFonts();
              return;
            }

            this.navctrl.navigateRoot('/getstarted');
            // Removing startup-language page from navigation flow
            // this.navctrl.navigateRoot("/startup-language");
          })
          .catch((verseCountErr) => {
            console.log(
              'Verse count fetch error: ' + JSON.stringify(verseCountErr)
            );
            this.navctrl.navigateRoot('/getstarted');
          });
      })
      .catch((e) => {
        alert('Verse Filled 2 fetch table error: ' + JSON.stringify(e));
        console.log('Verse Filled table fetch error: ' + JSON.stringify(e));
      });
  }
  setFonts() {
    this.database.executeSql('SELECT * FROM fonts', []).then((data) => {
      console.log('Books count ' + data.rows.length);

      for (var j = 0; j < data.rows.length; j++) {
        if (data.rows.item(j).language == 'Tamil') {
          if (data.rows.item(j).isset == '1')
            this.authservice.fontFamilyTamil = data.rows.item(j).font_family;
        } else {
          if (data.rows.item(j).isset == '1')
            this.authservice.fontFamilyEnglish = data.rows.item(j).font_family;
        }
      }
      this.setDefaultBible();
    });
  }
  setDefaultBible() {
    var db_version;
    console.log('Setting default bible started');
    this.database
      .executeSql("SELECT * FROM bibles where defaultbible = '1'", [])
      .then((data) => {
        console.log('Default bible count ' + data.rows.length);
        if (data.rows.length > 0) {
          this.authservice.defaultBibleLanguage = data.rows.item(0).language;
          this.authservice.defaultBibleVersionText = data.rows.item(0).title;
          this.authservice.defaultBibleId = data.rows.item(0).id;
        }
        //this.appComponent.initializeData();
        console.log(
          'Default bible version text  ' +
            this.authservice.defaultBibleVersionText
        );
        this.database
          .executeSql('select * from config WHERE id = 28', [])
          .then((data) => {
            console.log('DB version query result: ', JSON.stringify(data.rows));

            // Initialize db_version
            if (data.rows && data.rows.length > 0) {
              db_version = data.rows.item(0).value;
            } else {
              db_version = '';
            }

            console.log('DB_VERSION from DB: ' + db_version);
            console.log(
              'authservice._DB_VERSION: ' + this.authservice._DB_VERSION
            );

            // For first-time install or existing install
            if (
              !db_version ||
              db_version === '' ||
              db_version === this.authservice._DB_VERSION
            ) {
              // Update DB version to current version
              this.database
                .executeSql('UPDATE CONFIG SET value = ? WHERE id = 28', [
                  this.authservice._DB_VERSION,
                ])
                .then(() => {
                  console.log(
                    'DB version updated successfully to ' +
                      this.authservice._DB_VERSION
                  );
                  this.navctrl.navigateRoot('/tabslink/home');
                })
                .catch((e) => {
                  console.error('Error updating DB version:', e);
                  // Fallback to home page even if update fails
                  this.navctrl.navigateRoot('/tabslink/home');
                });
            } else {
              console.log(
                'DB version mismatch. Current: ' +
                  db_version +
                  ', Expected: ' +
                  this.authservice._DB_VERSION
              );
              this.database
                .executeSql('SELECT COUNT(*) as count FROM vers', [])
                .then((versCountResult) => {
                  const versCount = Number(
                    versCountResult.rows.item(0)?.count ?? 0
                  );
                  if (versCount > 0) {
                    console.log(
                      'Prebuilt verses detected; skipping slow update import flow'
                    );
                    this.database
                      .executeSql('UPDATE CONFIG SET value = ? WHERE id = 28', [
                        this.authservice._DB_VERSION,
                      ])
                      .finally(() => {
                        this.navctrl.navigateRoot('/tabslink/home');
                      });
                    return;
                  }

                  this.authservice._IS_UPDATE_BIBLE = 1;
                  this.navctrl.navigateRoot('/getstarted');
                })
                .catch(() => {
                  this.authservice._IS_UPDATE_BIBLE = 1;
                  this.navctrl.navigateRoot('/getstarted');
                });
            }
          })
          .catch((e) => {
            console.error('Config fetch error: ' + JSON.stringify(e));
            // Handle error by navigating to home page
            this.navctrl.navigateRoot('/tabslink/home');
          });
      })
      .catch((e) => {
        console.error('Bible fetch error: ' + JSON.stringify(e));
        // Changed from startup-language to getstarted to maintain consistent flow
        this.navctrl.navigateRoot('/getstarted');
      });
  }
  updateBibles() {
    var qry =
      'REPLACE INTO bibles (id, title, language, description, defaultbible, color, isshow, seq) VALUES';
    var compartableqry =
      'REPLACE INTO comparebibles (id, title, language, defaultbible, color, isshow, seq) VALUES';
    for (var i = 0; i < this.bibleData.length; i++) {
      if (i > 0) {
        qry += ', ';
        compartableqry += ', ';
      }
      qry +=
        '(' +
        this.bibleData[i].id +
        ", '" +
        this.bibleData[i].title +
        "', '" +
        this.bibleData[i].language +
        "', '" +
        this.bibleData[i].description +
        "', 0, '', '1', " +
        this.bibleData[i].seq +
        ')';
      compartableqry +=
        '(' +
        this.bibleData[i].id +
        ", '" +
        this.bibleData[i].title +
        "', '" +
        this.bibleData[i].language +
        "', 0, '', '1', " +
        this.bibleData[i].seq +
        ')';
    }
    console.log('Bible insert  : ' + qry);
    console.log('Compare Bible insert  : ' + compartableqry);

    this.database
      .executeSql(qry, [])
      .then((res) => {
        console.log('Bible inserted ');
        this.database
          .executeSql(compartableqry, [])
          .then((res) => {
            console.log('Compare Bible inserted ');
            //this.navctrl.navigateRoot("/startup-language");
            this.navctrl.navigateRoot('/getstarted');
          })
          .catch((err) => {
            console.log('Error in SaveData comparebibles------');
            console.log(JSON.stringify(err));
          });
      })
      .catch((err) => {
        console.log('Error in bible SaveData------');
        console.log(JSON.stringify(err));
      });

    // if (this.cIdx<this.bibleData.length)
    // {
    //   var resultData;
    //   var defaultBible;
    //   // if(this.cIdx==2)
    //   // {
    //   //    // defaultBible="1";
    //   //     this.authservice.defaultBibleId =  this.bibleData[this.cIdx].id;
    //   //     this.authservice.defaultBookNumber = 1;
    //   //     this.authservice.defaultVersNumber=1;
    //   //     this.authservice.defaultBibleVersionText = this.bibleData[this.cIdx].title;
    //   //     this.authservice.defaultBibleLanguage = this.bibleData[this.cIdx].language;
    //   //     console.log("Default version  " +  this.bibleData[this.cIdx].title + " " + this.bibleData[this.cIdx].language +  " " +   this.bibleData[this.cIdx].id)
    //   // }
    //  // else defaultBible="0";
    //  defaultBible="0";
    //   console.log("Book  " + this.bibleData[this.cIdx].id + "-" + this.bibleData[this.cIdx].title + "-" + this.bibleData[this.cIdx].language + " inserted ");
    //   this.database.executeSql('REPLACE  INTO bibles (id, title, language, description, defaultbible, color, isshow, seq) VALUES(?, ?, ?,  ?, ?,"#fff", "1", '+ this.bibleData[this.cIdx].seq +' )', [this.bibleData[this.cIdx].id, this.bibleData[this.cIdx].title, this.bibleData[this.cIdx].language, this.bibleData[this.cIdx].description, defaultBible])
    //   .then((res) => {
    //     console.log("Bible inserted ");
    //     this.database.executeSql('REPLACE  INTO comparebibles (id, title, language, defaultbible, color, isshow, seq) VALUES(?, ?, ?, ?, ?, "1",'+ this.bibleData[this.cIdx].seq +')', [this.bibleData[this.cIdx].id, this.bibleData[this.cIdx].title, this.bibleData[this.cIdx].language, defaultBible, this.bibleData[this.cIdx].comparecolor])
    //     .then((res) => {
    //         console.log("Compare Bible inserted ");
    //         this.cIdx++;

    //         this.updateBibles()
    //     })
    //     .catch((err) => {
    //         resultData = -1;
    //         console.log('Error in SaveData comparebibles------');
    //         console.log(JSON.stringify(err));
    //     });
    //   })
    //   .catch((err) => {
    //       resultData = -1;
    //       console.log('Error in SaveData------');
    //       console.log(JSON.stringify(err));
    //   });

    // }
    // else
    // {
    //   //this.navctrl.navigateRoot("/getstarted");
    //   this.navctrl.navigateRoot("/startup-language");
    // }
  }
}
