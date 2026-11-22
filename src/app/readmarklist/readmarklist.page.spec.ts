import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { AppComponent } from '../app.component';

import { ReadmarklistPage } from './readmarklist.page';

describe('ReadmarklistPage', () => {
  let component: ReadmarklistPage;
  let fixture: ComponentFixture<ReadmarklistPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadmarklistPage ],
      imports: [PageTestingModule],
      providers: [{ provide: AppComponent, useFactory: () => ({ drawer: 'drawerhide' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReadmarklistPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
