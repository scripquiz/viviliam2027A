import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BibleTopicDetailPage } from './bible-topic-detail.page';

const routes: Routes = [
    {
        path: '',
        component: BibleTopicDetailPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BibleTopicDetailPageRoutingModule { }
