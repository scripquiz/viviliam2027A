import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LifeEventDetailPage } from './life-event-detail.page';

const routes: Routes = [
    {
        path: '',
        component: LifeEventDetailPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LifeEventDetailPageRoutingModule { }
