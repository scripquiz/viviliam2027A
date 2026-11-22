import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookselectorPage } from './bookselector.page';

const routes: Routes = [
  {
    path: '',
    component: BookselectorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookselectorPageRoutingModule {}
