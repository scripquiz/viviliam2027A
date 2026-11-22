import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoreAboutPageRoutingModule } from './more-about-routing.module';

import { MoreAboutPage } from './more-about.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoreAboutPageRoutingModule
  ],
  declarations: [MoreAboutPage]
})
export class MoreAboutPageModule {}
