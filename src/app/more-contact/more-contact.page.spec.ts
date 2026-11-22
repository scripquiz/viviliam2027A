import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { MoreContactPage } from './more-contact.page';

describe('MoreContactPage', () => {
  let component: MoreContactPage;
  let fixture: ComponentFixture<MoreContactPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreContactPage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
