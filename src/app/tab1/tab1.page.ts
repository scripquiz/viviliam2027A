import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Platform, NavController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { ShareService } from '../providers/share.service';
import { App } from '@capacitor/app';
// Replace Cordova ScreenOrientation import with our Capacitor service
// import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { NetworkService } from '../services/network.service';
import { Toast } from '@capacitor/toast';
import { WakeLockService } from '../services/wake-lock.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
//import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class Tab1Page {
  dateExample = new Date().toISOString();
  private database: any;
  CopyInputText: string = 'Hello World!';
  PasteText: string = 'Paste Text!';
  public email: any = '';
  public password: any = '';
  bibleTable: string =
    'create table if not exists bibles ( id integer PRIMARY KEY, title TEXT, description TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)';
  public fromid: any = '2';
  public toid: any = '3';
  constructor(
    private navctrl: NavController,
    private databaseService: DatabaseService,
    private plt: Platform,
    private authservice: AuthserviceProvider,
    private wakeLockService: WakeLockService,
    private network: NetworkService,
    // Replace Cordova ScreenOrientation with our service
    private screenOrientation: ScreenOrientationService,
    private shareService: ShareService
  ) {
    // Note: Removed toast from constructor parameters since Capacitor plugins don't need DI

    this.plt.ready().then(() => {
      // Subscribe to network status changes
      this.network.connected$.subscribe(() => {
        console.log('Network connected!');
        // Handle network connected events
      });

      this.network.disconnected$.subscribe(() => {
        console.log('Network disconnected!');
        // Handle network disconnected events
      });

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
  createBibleTable() {
    console.log('DB creating started');
    this.database
      .executeSql(this.bibleTable, [])
      .then(() => console.log('table created'))
      .catch((e: any) => alert('table create error: ' + JSON.stringify(e)));
  }
  copyString() {
    Clipboard.write({
      string: this.CopyInputText,
    });

    // detect orientation changes using the Capacitor service
    this.screenOrientation.onChange().subscribe(() => {
      alert(this.screenOrientation.type);
    });
  }

  // Paste
  pasteText() {
    Clipboard.read().then(
      (resolve: any) => {
        this.PasteText = resolve.value;
        console.log(resolve.value);
      },
      (reject: any) => {
        console.error('Error: ' + reject);
      }
    );
  }
  // Clear
  clearText() {
    Clipboard.write({
      string: '',
    });
  }

  // Check if network is connected using Capacitor NetworkService
  async checkNetworkConnection(): Promise<boolean> {
    try {
      const status = await this.network.getNetworkStatus();
      if (!status.connected) {
        await Toast.show({
          text: this.authservice.noNetWorkMessage,
          duration: 'long',
          position: 'center',
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  // Updated method that checks network before sharing content
  async shareWhatsapp() {
    if (!(await this.checkNetworkConnection())) {
      return; // Exit if no network connection
    }

    let shareText =
      'Hi, I would like to introduce Viviliam, Tamil Bible app. You can Read, Search, Compare the scriptures and do much more. \nhttps://app.viviliam.com';
    try {
      await this.shareService.share({
        text: shareText,
        title: 'Viviliam',
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  async appVersion() {
    try {
      const info = await App.getInfo();
      alert(info.version);
    } catch (err) {
      alert(err);
    }
  }
  orientation() {
    // Using the new Capacitor screen orientation service
    alert(this.screenOrientation.type);
  }
  async showtoast() {
    await Toast.show({
      text: "I'm a toast",
      duration: 'long',
      position: 'center',
    });
  }
  keepAwake() {
    this.wakeLockService.keepAwake().then(
      () => alert('Keep awake success'),
      () => alert('Keep awake error')
    );
  }
  sleepAgain() {
    this.wakeLockService.allowSleepAgain().then(
      () => console.log('Sleep again success'),
      () => console.log('Sleep again error')
    );
  }
  validateLogin() {
    var params =
      'user_login_check?email=' +
      this.email +
      '&password=' +
      this.password +
      '&device=android';
    this.authservice.execute_api(params, this.loginCheckResult, this);
  }
  loginCheckResult(status: any, objAllData: any, objThis: any) {
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.authservice.showAlert('', '', 'Success');
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
  async themablebrowser() {
    await this.openPage('https://app.viviliam.com/', this);
  }

  async openPage(url: string, objThis: any) {
    try {
      await Browser.open({
        url: url,
        presentationStyle: 'popover',
        toolbarColor: '#3366cc',
      });
    } catch (error) {
      console.error('Error opening browser:', error);
      objThis.authservice.showAlert(
        'Error',
        '',
        'Failed to open page. Please check your connection.'
      );
    }
  }

  start() {
    this.navctrl.navigateRoot('/startup');
  }
  setFromBookId(selectedValue: any) {
    alert(parseInt(selectedValue.currentTarget.value));
    this.toid = '5';
  }
}
