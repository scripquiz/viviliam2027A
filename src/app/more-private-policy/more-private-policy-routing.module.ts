import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MorePrivatePolicyPage } from './more-private-policy.page';

const routes: Routes = [
  {
    path: '',
    component: MorePrivatePolicyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MorePrivatePolicyPageRoutingModule {}
