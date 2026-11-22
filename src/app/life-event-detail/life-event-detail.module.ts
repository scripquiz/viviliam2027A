import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { LifeEventDetailPageRoutingModule } from './life-event-detail-routing.module';
import { LifeEventDetailPage } from './life-event-detail.page';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, LifeEventDetailPageRoutingModule],
    declarations: [LifeEventDetailPage],
})
export class LifeEventDetailPageModule { }
