import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BibleTopicsPage } from './bible-topics.page';

const routes: Routes = [
    {
        path: '',
        component: BibleTopicsPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BibleTopicsPageRoutingModule { }
