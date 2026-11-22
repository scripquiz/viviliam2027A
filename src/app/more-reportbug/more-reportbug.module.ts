import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoreReportbugPageRoutingModule } from './more-reportbug-routing.module';

import { MoreReportbugPage } from './more-reportbug.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoreReportbugPageRoutingModule
  ],
  declarations: [MoreReportbugPage]
})
export class MoreReportbugPageModule {}
