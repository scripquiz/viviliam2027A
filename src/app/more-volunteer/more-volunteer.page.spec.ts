import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { MoreVolunteerPage } from './more-volunteer.page';

describe('MoreVolunteerPage', () => {
  let component: MoreVolunteerPage;
  let fixture: ComponentFixture<MoreVolunteerPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreVolunteerPage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreVolunteerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
