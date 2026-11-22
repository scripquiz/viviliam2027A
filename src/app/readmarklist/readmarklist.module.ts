import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadmarklistPageRoutingModule } from './readmarklist-routing.module';

import { ReadmarklistPage } from './readmarklist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReadmarklistPageRoutingModule
  ],
  declarations: [ReadmarklistPage]
})
export class ReadmarklistPageModule {}
