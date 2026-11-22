import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { NavController } from '@ionic/angular';

import { StartupPage } from './startup.page';

describe('StartupPage', () => {
  let component: StartupPage;
  let fixture: ComponentFixture<StartupPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StartupPage ],
      imports: [PageTestingModule],
      providers: [{
        provide: NavController,
        useFactory: () => {
          const nav = jasmine.createSpyObj<NavController>('NavController', ['navigateRoot']);
          nav.navigateRoot.and.resolveTo(true);
          return nav;
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(StartupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
