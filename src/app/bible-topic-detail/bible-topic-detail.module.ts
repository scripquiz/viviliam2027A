import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { BibleTopicDetailPageRoutingModule } from './bible-topic-detail-routing.module';
import { BibleTopicDetailPage } from './bible-topic-detail.page';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, BibleTopicDetailPageRoutingModule],
    declarations: [BibleTopicDetailPage],
})
export class BibleTopicDetailPageModule { }
