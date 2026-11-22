import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { LifeEventsPageRoutingModule } from './life-events-routing.module';
import { LifeEventsPage } from './life-events.page';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, LifeEventsPageRoutingModule],
    declarations: [LifeEventsPage],
})
export class LifeEventsPageModule { }
