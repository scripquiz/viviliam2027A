import { Component, ChangeDetectionStrategy } from '@angular/core';
// import {
//       NativePageTransitions,
//       NativeTransitionOptions,
//     } from '@ionic-native/native-page-transitions/ngx'
@Component({
  selector: 'app-tabslink',
  templateUrl: './tabslink.page.html',
  styleUrls: ['./tabslink.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TabslinkPage {
  //Look the index to see which direction to go (if you have more than 3 tabs)
  // private getAnimationDirection(e: any): string {
  //     var currentIndex = this.tabIndex
  //     this.tabIndex = e.index
  //     // or
  //     // this.tabIndex = Object.keys(this.tabs).indexOf(e.tab)
  //     console.log("Tab index : " + e.index);
  //     switch (true) {
  //       case currentIndex < e.index:
  //         return 'left'
  //       case currentIndex > e.index:
  //         return 'right'
  //     }
  //   }
  //   transition(e: any): void {
  //     let options: NativeTransitionOptions = {
  //       direction: this.getAnimationDirection(e),
  //       duration: 600,
  //       slowdownfactor: -1,
  //       slidePixels: 0,
  //       iosdelay: 20,
  //       androiddelay: 0,
  //       fixedPixelsTop: 48,
  //       fixedPixelsBottom: 48,
  //     }
  //     if (!this.loaded) {
  //       this.loaded = true
  //       return
  //     }
  //     this.nativePageTransitions.fade(options)
  //   }
  //     ionViewWillLeave() {
  //       let options: NativeTransitionOptions = {
  //         direction: 'left',
  //         duration: 500,
  //         slowdownfactor: 3,
  //         slidePixels: 20,
  //         iosdelay: 100,
  //         androiddelay: 150,
  //         fixedPixelsTop: 0,
  //         fixedPixelsBottom: 60
  //       }
  //       this.nativePageTransitions.slide(options);
  //     }
}
