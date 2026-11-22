import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SetdefaultbiblePage } from './setdefaultbible.page';

const routes: Routes = [
  {
    path: '',
    component: SetdefaultbiblePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetdefaultbiblePageRoutingModule {}
