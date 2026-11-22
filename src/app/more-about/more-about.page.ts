import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { App } from '@capacitor/app';
//import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

@Component({
  selector: 'app-more-about',
  templateUrl: './more-about.page.html',
  styleUrls: ['./more-about.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MoreAboutPage {
  public appversionText: any;
  constructor(public navctrl: NavController) {
    // Get app version using Capacitor App plugin
    this.getAppVersion();
  }

  async getAppVersion() {
    try {
      const info = await App.getInfo();
      this.appversionText = info.version;
    } catch (err) {
      alert(err);
    }
  }

  navBack() {
    this.navctrl.back();
  }
  openMore(pagename) {
    this.navctrl.navigateRoot('/' + pagename);
  }
}
