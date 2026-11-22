import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform, NavController } from '@ionic/angular';
import { AuthserviceProvider } from '../../providers/authservice/authservice';

@Component({
  selector: 'app-setdefaultbible',
  templateUrl: './setdefaultbible.page.html',
  styleUrls: ['./setdefaultbible.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SetdefaultbiblePage {
  public database: DatabaseConnection;
  public bibleListTamil: Array<{
    id: number;
    title: string;
    language: string;
    description: string;
    isaudioavailable: string;
  }> = [];
  public bibleListEnglish: Array<{
    id: number;
    title: string;
    language: string;
    description: string;
    isaudioavailable: string;
  }> = [];
  constructor(
    public databaseService: DatabaseService,
    public platform: Platform,
    public authservice: AuthserviceProvider,
    public navctrl: NavController
  ) {
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then(
          (db: DatabaseConnection) => {
            this.database = db;
            this.bindBibles();
          },
          (e) => {
            alert('table create error: ' + JSON.stringify(e));
          }
        );
    });
  }
  bindBibles() {
    this.bibleListEnglish = [];
    this.bibleListTamil = [];
    this.database
      .executeSql('SELECT * FROM bibles order by seq', [])
      .then((data) => {
        var isaudioavailable;
        for (var j = 0; j < data.rows.length; j++) {
          if (
            data.rows.item(j).id == '1' ||
            data.rows.item(j).id == '2' ||
            data.rows.item(j).id == '3' ||
            data.rows.item(j).id == '5'
          )
            isaudioavailable = '1';
          else isaudioavailable = '0';
          if (data.rows.item(j).language == 'Tamil') {
            this.bibleListTamil.push({
              id: data.rows.item(j).id,
              language: data.rows.item(j).language,
              title: data.rows.item(j).title,
              description: data.rows.item(j).description,
              isaudioavailable: isaudioavailable,
            });
          } else {
            this.bibleListEnglish.push({
              id: data.rows.item(j).id,
              language: data.rows.item(j).language,
              title: data.rows.item(j).title,
              description: data.rows.item(j).description,
              isaudioavailable: isaudioavailable,
            });
          }
        }
      });
  }

  setBible(bibleid, versiontext, language) {
    //this.database.executeSql("update bibles set defaultbible = '0'", []).then((data) => {
    //this.database.executeSql("update bibles set defaultbible = '1' where id = ? ", [bibleid]).then((data) => {
    //this.database.executeSql("select id from bibles where defaultbible = '1'", []).then((data) => {
    this.database
      .executeSql('select id from bibles where id=' + bibleid, [])
      .then((data) => {
        this.authservice.actualDefaultBibleId = data.rows.item(0).id;
        console.log('set bible : ' + bibleid);
        this.authservice.defaultBibleId = bibleid;
        this.authservice.defaultBibleVersionText = versiontext;
        this.authservice.defaultBibleLanguage = language;
        this.authservice.dataLoaded = 0;
        this.authservice.dataLoadedCompare = 0;
        this.authservice.compareBibleId = bibleid;
        if (this.authservice.backToPage == 'compare') {
          this.navctrl.navigateRoot('/tabslink/compare');
          //this.authservice.compareBibleId = bibleid;
        } else this.navctrl.navigateRoot('/tabslink/read');
      });

    //  });
    //  });
  }
  goBack() {
    if (this.authservice.backToPage == 'compare')
      this.navctrl.navigateRoot('/tabslink/compare');
    else this.navctrl.navigateRoot('/tabslink/read');
  }
}
