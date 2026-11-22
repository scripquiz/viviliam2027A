import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookselectorPageRoutingModule } from './bookselector-routing.module';

import { BookselectorPage } from './bookselector.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookselectorPageRoutingModule
  ],
  declarations: [BookselectorPage]
})
export class BookselectorPageModule {}
