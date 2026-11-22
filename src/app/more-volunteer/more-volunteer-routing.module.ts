import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoreVolunteerPage } from './more-volunteer.page';

const routes: Routes = [
  {
    path: '',
    component: MoreVolunteerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoreVolunteerPageRoutingModule {}
