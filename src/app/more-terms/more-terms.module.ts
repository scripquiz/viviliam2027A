import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoreTermsPageRoutingModule } from './more-terms-routing.module';

import { MoreTermsPage } from './more-terms.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoreTermsPageRoutingModule
  ],
  declarations: [MoreTermsPage]
})
export class MoreTermsPageModule {}
