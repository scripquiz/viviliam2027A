import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoreVolunteerPageRoutingModule } from './more-volunteer-routing.module';

import { MoreVolunteerPage } from './more-volunteer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoreVolunteerPageRoutingModule
  ],
  declarations: [MoreVolunteerPage]
})
export class MoreVolunteerPageModule {}
