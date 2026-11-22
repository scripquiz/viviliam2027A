import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { ViewEncapsulation } from '@angular/core';
import { NavController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-startup-default-bible',
  templateUrl: './startup-default-bible.page.html',
  styleUrls: ['./startup-default-bible.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StartupDefaultBiblePage {
  bibleData = [];
  public default_language: any;
  public Bibles_In_Language: Array<{
    id: number;
    title: string;
    language: string;
    description: string;
    isselected: string;
  }> = [];
  public Sample_Verse: Array<{ id: number; verse: string }> = [];
  public sampleVerse: any = '';
  public selected_versiontext: any = '';

  constructor(
    private menuCtrl: MenuController,
    private authserivce: AuthserviceProvider,
    private navctrl: NavController
  ) {}

  ionViewDidEnter() {
    this.default_language = this.authserivce.default_language;
    this.Sample_Verse.push({
      id: 1,
      verse:
        "<span class='font-bold'>Genesis 1:1 </span><p class='font-size18'>In the beginning God created the heavens and the earth.</p>",
    });
    this.Sample_Verse.push({
      id: 2,
      verse:
        "<span class='font-bold'>Genesis 1:1 </span><p class='font-size18'>In the beginning God created the heaven and the earth.</p>",
    });
    this.Sample_Verse.push({
      id: 3,
      verse:
        "<span class='font-bold'>ஆதியாகமம் 1:1 </span><p class='font-size18'>ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்.</p>",
    });
    this.Sample_Verse.push({
      id: 4,
      verse:
        "<span class='font-bold'>ஆதியாகமம் 1:1 </span><p class='font-size18'>துவக்கத்தில் தேவன் வானத்தையும் பூமியையும் படைத்தார்.</p>",
    });
    this.Sample_Verse.push({
      id: 5,
      verse:
        "<span class='font-bold'>தொடக்கநூல் 1:1 </span><p class='font-size18'>தொடக்கத்தில் கடவுள் விண்ணுலகையும், மண்ணுலகையும் படைத்தபொழுது,</p>",
    });

    this.menuCtrl.enable(false);

    fetch('assets/data/bibles.ts')
      .then((res) => res.json())
      .then((json) => {
        this.bibleData = json;
        console.log('Available Bibles in Json' + this.bibleData.length);
        for (var i = 0; i < this.bibleData.length; i++) {
          this.Bibles_In_Language.push({
            id: this.bibleData[i].id,
            title: this.bibleData[i]['title'],
            language: this.bibleData[i].language,
            description: this.bibleData[i].description,
            isselected: '0',
          });
        }
      });
  }
  setBible(id) {
    for (var i = 0; i < this.Bibles_In_Language.length; i++) {
      if (this.Bibles_In_Language[i].id == id) {
        this.Bibles_In_Language[i].isselected = '1';
        this.sampleVerse = this.Sample_Verse[i].verse;
        this.authserivce.default_bibleid = id;
        this.authserivce.defaultBibleId = id;
        this.authserivce.defaultBibleVersionText =
          this.Bibles_In_Language[i].title;
        this.selected_versiontext = this.Bibles_In_Language[i].title;
        console.log('Default file set : ' + id);
      } else {
        this.Bibles_In_Language[i].isselected = '0';
      }
    }
  }
  navBack() {
    this.navctrl.back();
  }
  navigateto_defaultbible() {
    this.navctrl.navigateRoot('/getstarted');
  }
}
