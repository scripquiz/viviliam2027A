import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { MoreTermsPage } from './more-terms.page';

describe('MoreTermsPage', () => {
  let component: MoreTermsPage;
  let fixture: ComponentFixture<MoreTermsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreTermsPage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreTermsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
