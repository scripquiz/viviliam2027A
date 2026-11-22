import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StartupLanguagePage } from './startup-language.page';

const routes: Routes = [
  {
    path: '',
    component: StartupLanguagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StartupLanguagePageRoutingModule {}
