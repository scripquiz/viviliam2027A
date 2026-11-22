import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoreAboutPage } from './more-about.page';

const routes: Routes = [
  {
    path: '',
    component: MoreAboutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoreAboutPageRoutingModule {}
