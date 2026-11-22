import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePageRoutingModule } from './home-routing.module';
import { DailyBibleVerseComponent } from '../components/daily-bible-verse/daily-bible-verse.component';
import { DailyBibleQuoteComponent } from '../components/daily-bible-quote/daily-bible-quote.component';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePageModule { }
