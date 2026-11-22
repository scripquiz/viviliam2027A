import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReadmarklistPage } from './readmarklist.page';

const routes: Routes = [
  {
    path: '',
    component: ReadmarklistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReadmarklistPageRoutingModule {}
