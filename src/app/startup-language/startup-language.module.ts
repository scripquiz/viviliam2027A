import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StartupLanguagePageRoutingModule } from './startup-language-routing.module';

import { StartupLanguagePage } from './startup-language.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StartupLanguagePageRoutingModule
  ],
  declarations: [StartupLanguagePage]
})
export class StartupLanguagePageModule {}
