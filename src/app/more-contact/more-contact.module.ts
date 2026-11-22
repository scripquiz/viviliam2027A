import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoreContactPageRoutingModule } from './more-contact-routing.module';

import { MoreContactPage } from './more-contact.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoreContactPageRoutingModule
  ],
  declarations: [MoreContactPage]
})
export class MoreContactPageModule {}
