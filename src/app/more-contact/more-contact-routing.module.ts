import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoreContactPage } from './more-contact.page';

const routes: Routes = [
  {
    path: '',
    component: MoreContactPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoreContactPageRoutingModule {}
