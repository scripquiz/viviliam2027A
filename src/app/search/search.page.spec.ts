import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { AppComponent } from '../app.component';

import { SearchPage } from './search.page';

describe('SearchPage', () => {
  let component: SearchPage;
  let fixture: ComponentFixture<SearchPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchPage ],
      imports: [PageTestingModule],
      providers: [{ provide: AppComponent, useFactory: () => jasmine.createSpyObj<AppComponent>('AppComponent', ['initializeData']) }]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
