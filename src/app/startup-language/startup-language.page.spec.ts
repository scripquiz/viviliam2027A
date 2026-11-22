import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { StartupLanguagePage } from './startup-language.page';

describe('StartupLanguagePage', () => {
  let component: StartupLanguagePage;
  let fixture: ComponentFixture<StartupLanguagePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StartupLanguagePage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StartupLanguagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
