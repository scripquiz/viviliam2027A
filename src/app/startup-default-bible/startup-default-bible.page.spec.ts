import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { StartupDefaultBiblePage } from './startup-default-bible.page';

describe('StartupDefaultBiblePage', () => {
  let component: StartupDefaultBiblePage;
  let fixture: ComponentFixture<StartupDefaultBiblePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StartupDefaultBiblePage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StartupDefaultBiblePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
