import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StartupDefaultBiblePage } from './startup-default-bible.page';

const routes: Routes = [
  {
    path: '',
    component: StartupDefaultBiblePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StartupDefaultBiblePageRoutingModule {}
