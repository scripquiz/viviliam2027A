import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { AppComponent } from '../app.component';

import { GetstartedPage } from './getstarted.page';

describe('GetstartedPage', () => {
  let component: GetstartedPage;
  let fixture: ComponentFixture<GetstartedPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GetstartedPage ],
      imports: [PageTestingModule],
      providers: [{ provide: AppComponent, useFactory: () => ({ play_speed: '1' }) }]
    }).compileComponents();

    fixture = TestBed.createComponent(GetstartedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
