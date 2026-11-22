import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TablinksPageRoutingModule } from './tabslink-routing.module';

import { TabslinkPage } from './tabslink.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TablinksPageRoutingModule
  ],
  declarations: [TabslinkPage]
})
export class TabslinkPageModule {}
