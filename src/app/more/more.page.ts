import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { Platform } from '@ionic/angular';
import { IonicSafeString } from '@ionic/angular';
import { ShareService } from '../providers/share.service';
import { IonLoaderService } from '../ion-loader.service';
import { AlertController } from '@ionic/angular';
//import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser/ngx';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MorePage {
  public database: DatabaseConnection;
  public backupDate: string;
  public totalBackupRecords: any = 100;
  public backupProgressIndex: any = 0;
  public progress: any = 0;
  public isbackup: any = 0;
  public backuData: any;
  public total_records_torestore: any;
  public restore_index = 0;
  public restoreData: any;
  public appversionText: any = '';
  constructor(
    public alertController: AlertController,
    public ionLoaderService: IonLoaderService,
    public shareService: ShareService,
    public platform: Platform,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    public menuCtrl: MenuController,
    public authservice: AuthserviceProvider
  ) {
    this.authservice.currentPage = 'MORE';
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;

          var qry = 'select * from config where id =24';
          this.database.executeSql(qry, []).then((data) => {
            if (data.rows.length > 0) {
              this.backupDate = data.rows.item(0).value;
              if (this.backupDate == '') this.backupDate = this.backupDate;
            }
          });
        });
    });
  }
  async getAppVersion() {
    try {
      const info = await App.getInfo();
      this.appversionText = info.version;
      console.log('Version loaded:', this.appversionText);
    } catch (error) {
      // Fallback version in case the plugin fails
      this.appversionText = '4.8.9';
      console.error('Error getting version:', error);
    }
  }
  ionViewWillEnter() {
    console.log('View will enter - loading version');
    this.menuCtrl.enable(false);
    this.getAppVersion();
  }
  openSettings() {
    this.authservice.backToPage = 'more';
    this.navctrl.navigateRoot('/settings');
  }
  openMore(pagename) {
    this.navctrl.navigateRoot('/' + pagename);
  }
  backupData() {
    if (this.authservice.userId == '') {
      this.authservice.showAlert(
        '',
        '',
        'Please login to proceed with Backup & Restore'
      );
    } else {
      this.ionLoaderService.simpleLoader('Pease wait...');
      var params =
        'get_lastbackup?userid=' + this.authservice.userId + '&device=android';

      this.authservice.execute_api(params, this.lastBackupDateResult, this);
    }
  }
  lastBackupDateResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.alertController
          .create({
            header: 'Confirmation',
            subHeader:
              'You are about to replace the backup data with your current data. All Bookmarks, Highlights and Notes in backup will be replaced with your current data. This operation cannot be reversed.',
            message: new IonicSafeString(
              'Last backup: <b>' +
                objAllData[0]['backupdate'] +
                '</b><br>Do you wish to continue?'
            ),
            cssClass: 'custom-confirm',
            buttons: [
              {
                text: 'Yes',
                cssClass: 'cancel-button',
                handler: () => {
                  objThis.backupDataAction(objThis);
                },
              },
              {
                text: 'No',
                cssClass: 'cc',
                handler: () => {},
              },
            ],
          })
          .then((res) => {
            res.present();
          });
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
  backupDataAction(objThis) {
    if (objThis.authservice.userId == '') {
      objThis.authservice.showAlert(
        '',
        '',
        'Please login to proceed with Backup & Restore'
      );
    } else {
      var qry =
        "select CURRENT_TIMESTAMP backupdate, vid,bibleid, booknumber, cnumber, vnumber, ifnull(textHighlight,'') texthighlight, ifnull(notes,'') notes, ifnull(bookMark,'0') bookmark, bookMarkOn bookmarkon, highlightOn highlighton, notesOn noteson from vers where ifnull(textHighlight,'') <> '' or  ifnull(notes,'') <> '' or  ifnull(bookMark,'0') <> '0'";
      objThis.database.executeSql(qry, []).then((data) => {
        if (data.rows.length > 0) {
          objThis.totalBackupRecords = data.rows.length;
          objThis.backuData = data;
          objThis.backupProgressIndex = 0;
          objThis.progress = 0;
          objThis.ionLoaderService.simpleLoader(
            'Backup in progress! Pease wait...'
          );
          objThis.initiateBackup(objThis, 'DELETE');
        } else {
          objThis.authservice.showAlert(
            '',
            '',
            "Backup not created. Couldn't find any Bookmarks / Highlights / Notes."
          );
          objThis.ionLoaderService.dismissLoader();
        }
      });
    }
  }
  backupToCloud() {
    if (this.authservice.userId == '') {
      this.authservice.showAlert(
        '',
        '',
        'Please login to proceed with Backup & Restore'
      );
    } else {
      var qry =
        "select CURRENT_TIMESTAMP backupdate, vid,bibleid, booknumber, cnumber, vnumber, ifnull(textHighlight,'') texthighlight, ifnull(notes,'') notes, ifnull(bookMark,'0') bookmark, bookMarkOn bookmarkon, highlightOn highlighton, notesOn noteson from vers where ifnull(textHighlight,'') <> '' or  ifnull(notes,'') <> '' or  ifnull(bookMark,'0') <> '0'";
      this.database.executeSql(qry, []).then((data) => {
        if (data.rows.length > 0) {
          this.totalBackupRecords = data.rows.length;
          this.backuData = data;
          this.backupProgressIndex = 0;
          this.progress = 0;
          this.initiateBackup(this, 'DELETE');
        } else {
          this.authservice.showAlert(
            '',
            '',
            "Backup not created. Couldn't find any Bookmarks / Highlights / Notes."
          );
        }
      });
    }
  }
  cancelBackup() {
    this.isbackup = 0;
  }

  initiateBackup(objthis, deleteFlag) {
    var params =
      'backup_data?userid=' +
      objthis.authservice.userId +
      '&bibleid=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['bibleid'] +
      '&booknumber=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['booknumber'] +
      '&cnumber=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['cnumber'] +
      '&vnumber=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['vnumber'] +
      '&texthighlight=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)[
        'texthighlight'
      ] +
      '&notes=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['notes'] +
      '&bookmark=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['bookmark'] +
      '&highlighton=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['highlighton'] +
      '&noteson=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['noteson'] +
      '&bookmarkon=' +
      objthis.backuData.rows.item(objthis.backupProgressIndex)['bookmarkon'] +
      '&deleteflag=' +
      deleteFlag;
    objthis.authservice.execute_api(params, objthis.backupResult, objthis);
  }
  backupResult(status, objAllData, objThis) {
    if (status) {
      if (objAllData[0]['status'] == '0') {
        console.log(objAllData[0]['message']);
      } else {
        objThis.backupProgressIndex++;
        if (objThis.backupProgressIndex < objThis.totalBackupRecords) {
          objThis.progress = Math.floor(
            (objThis.backupProgressIndex / objThis.totalBackupRecords) * 100.0
          );
          objThis.initiateBackup(objThis, 'NODELETE');
        } else {
          objThis.authservice.showAlert(
            '',
            '',
            'Backup completed successfully.'
          );
          objThis.ionLoaderService.dismissLoader();
          objThis.isbackup = 0;
        }
      }
    }
  }
  restoredata() {
    if (this.authservice.userId == '') {
      this.authservice.showAlert(
        '',
        '',
        'Please login to proceed with Backup & Restore'
      );
    } else {
      this.ionLoaderService.simpleLoader('Pease wait...');
      var params =
        'get_lastbackup?userid=' + this.authservice.userId + '&device=android';

      this.authservice.execute_api(
        params,
        this.lastBackupDateResultForRestore,
        this
      );
    }
  }
  lastBackupDateResultForRestore(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.alertController
          .create({
            header: 'Confirmation',
            subHeader:
              'You are about to restore the data from backup file. All current Bookmarks, Highlights and Notes will be replaced by your last backup. This operation cannot be reversed.',
            message: new IonicSafeString(
              'Last backup: <b>' +
                objAllData[0]['backupdate'] +
                '</b><br>Do you wish to continue?'
            ),
            cssClass: 'custom-confirm',
            buttons: [
              {
                text: 'Yes',
                cssClass: 'cancel-button',
                handler: () => {
                  objThis.restoredataAction(objThis);
                },
              },
              {
                text: 'No',
                cssClass: 'cc',
                handler: () => {},
              },
            ],
          })
          .then((res) => {
            res.present();
          });
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }

  restoredataAction(objThis) {
    if (objThis.authservice.userId == '') {
      objThis.authservice.showAlert(
        '',
        '',
        'Please login to proceed with Backup & Restore.'
      );
    } else {
      objThis.ionLoaderService.simpleLoader('Restoring data, please wait...');
      var params =
        'restoredata?userid=' +
        objThis.authservice.userId +
        '&method=method&device=Android';
      objThis.authservice.execute_api(params, objThis.restoreResult, objThis);
    }
  }
  restoreResult(status, objAllData, objThis) {
    if (status) {
      if (objAllData[0]['status'] == '0') {
        objThis.ionLoaderService.dismissLoader();
        console.log(objAllData[0]['message']);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.total_records_torestore = objAllData.length;
        objThis.restore_index = 0;
        objThis.restoreData = objAllData;
        var qry = 'update vers set textHighlight=NULL';
        qry += ', notes=NULL';
        qry += ', bookMark=NULL';
        qry += ', highlightOn=NULL';
        qry += ', notesOn=NULL';
        qry += ', bookMarkOn=NULL';

        objThis.database.executeSql(qry, []).then((data) => {
          objThis.initiateRestoreData(objThis);
        });
      }
    }
  }
  initiateRestoreData(objThis) {
    var qry =
      "update vers set textHighlight='" +
      objThis.restoreData[objThis.restore_index]['texthighlight'] +
      "'";
    qry +=
      ", notes='" + objThis.restoreData[objThis.restore_index]['notes'] + "'";
    qry +=
      ", bookMark='" +
      objThis.restoreData[objThis.restore_index]['bookmark'] +
      "'";
    qry +=
      ", highlightOn='" +
      objThis.restoreData[objThis.restore_index]['highlighton'] +
      "'";
    qry +=
      ", notesOn='" +
      objThis.restoreData[objThis.restore_index]['noteson'] +
      "'";
    qry +=
      ", bookMarkOn='" +
      objThis.restoreData[objThis.restore_index]['bookmarkon'] +
      "'";
    qry +=
      " where bibleid='" +
      objThis.restoreData[objThis.restore_index]['bibleid'] +
      "'";
    qry +=
      " and booknumber='" +
      objThis.restoreData[objThis.restore_index]['booknumber'] +
      "'";
    qry +=
      " and cnumber='" +
      objThis.restoreData[objThis.restore_index]['cnumber'] +
      "'";
    qry +=
      " and vnumber='" +
      objThis.restoreData[objThis.restore_index]['vnumber'] +
      "'";

    this.database.executeSql(qry, []).then((data) => {
      objThis.restore_index++;
      if (objThis.restore_index < objThis.total_records_torestore) {
        objThis.initiateRestoreData(objThis);
      } else {
        objThis.ionLoaderService.dismissLoader();
        objThis.authservice.dataLoaded = 0;
        objThis.authservice.showAlert('', '', 'Data restored successfully.');
      }
    });
  }

  async rateApp() {
    try {
      await Browser.open({
        url: 'https://play.google.com/store/apps/details?id=com.fredfrank.viviliam',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening Play Store:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open Play Store. Please check your connection.'
      );
    }
  }

  /*   async openChangelog() {
    try {
      await Browser.open({
        url: 'https://app.viviliam.com/changelog',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening changelog:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open Changelog page. Please check your connection.'
      );
    }
  } */

  async openYouTube() {
    try {
      await Browser.open({
        url: 'https://viviliam.in/misc/youtube',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening YouTube:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open YouTube page. Please check your connection.'
      );
    }
  }

  async openWhatsApp() {
    try {
      await Browser.open({
        url: 'https://app.viviliam.com/whatsapp-group',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening WhatsApp URL:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open WhatsApp page. Please check your connection.'
      );
    }
  }

  async shareApp() {
    try {
      await this.shareService.share({
        text: 'Hi, I would like to introduce Viviliam, Tamil Bible app. You can Read, Search, Compare the scriptures and do much more.',
        url: 'https://app.viviliam.com',
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  async openReport() {
    try {
      await Browser.open({
        url: 'https://app.viviliam.com/report',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening report page:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open Report page. Please check your connection.'
      );
    }
  }

  async openContact() {
    try {
      await Browser.open({
        url: 'https://app.viviliam.com/contact',
        presentationStyle: 'popover',
      });
    } catch (error) {
      console.error('Error opening contact page:', error);
      this.authservice.showAlert(
        'Error',
        '',
        'Failed to open Contact page. Please check your connection.'
      );
    }
  }
}
