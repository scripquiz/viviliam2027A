import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StartupDefaultBiblePageRoutingModule } from './startup-default-bible-routing.module';

import { StartupDefaultBiblePage } from './startup-default-bible.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StartupDefaultBiblePageRoutingModule
  ],
  declarations: [StartupDefaultBiblePage]
})
export class StartupDefaultBiblePageModule {}
