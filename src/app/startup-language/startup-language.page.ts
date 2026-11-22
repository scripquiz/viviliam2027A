import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { MenuController } from '@ionic/angular';
@Component({
  selector: 'app-startup-language',
  templateUrl: './startup-language.page.html',
  styleUrls: ['./startup-language.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StartupLanguagePage {
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private authservice: AuthserviceProvider
  ) {}

  navigateto_defaultbible(defaultlanguage) {
    this.authservice.default_language = defaultlanguage;
    this.authservice.defaultBibleLanguage = defaultlanguage;
    this.router.navigateByUrl('/startup-default-bible');
  }
  ionViewWillEnter() {
    console.log('View will enter');
    this.menuCtrl.enable(false);
  }
}
