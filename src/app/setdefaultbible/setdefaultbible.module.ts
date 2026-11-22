import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SetdefaultbiblePageRoutingModule } from './setdefaultbible-routing.module';

import { SetdefaultbiblePage } from './setdefaultbible.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SetdefaultbiblePageRoutingModule
  ],
  declarations: [SetdefaultbiblePage]
})
export class SetdefaultbiblePageModule {}
