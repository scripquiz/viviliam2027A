import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MorePrivatePolicyPageRoutingModule } from './more-private-policy-routing.module';

import { MorePrivatePolicyPage } from './more-private-policy.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MorePrivatePolicyPageRoutingModule
  ],
  declarations: [MorePrivatePolicyPage]
})
export class MorePrivatePolicyPageModule {}
