import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LifeEventsPage } from './life-events.page';

const routes: Routes = [
    {
        path: '',
        component: LifeEventsPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LifeEventsPageRoutingModule { }
