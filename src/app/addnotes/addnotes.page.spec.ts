import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { AppComponent } from '../app.component';

import { AddnotesPage } from './addnotes.page';

describe('AddnotesPage', () => {
  let component: AddnotesPage;
  let fixture: ComponentFixture<AddnotesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddnotesPage ],
      imports: [PageTestingModule],
      providers: [{ provide: AppComponent, useFactory: () => ({ drawer: 'drawerhide' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(AddnotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
