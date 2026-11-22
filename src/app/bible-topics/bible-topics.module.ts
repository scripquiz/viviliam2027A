import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BibleTopicsPageRoutingModule } from './bible-topics-routing.module';

import { BibleTopicsPage } from './bible-topics.page';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, BibleTopicsPageRoutingModule],
    declarations: [BibleTopicsPage],
})
export class BibleTopicsPageModule { }
