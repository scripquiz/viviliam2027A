import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { HttpTestingController } from '@angular/common/http/testing';

import { MyaccountPage } from './myaccount.page';

describe('MyaccountPage', () => {
  let component: MyaccountPage;
  let fixture: ComponentFixture<MyaccountPage>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyaccountPage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MyaccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushMicrotasks();
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.viviliam.com/api/signup_details?userid=&device=ANDROID')
      .flush([{
        status: '1',
        name: 'Test User',
        mobile: '',
        email: 'test@example.com',
        location: '',
        gender: 'M',
        dob: '2000-01-01',
      }]);
    flush();
    fixture.detectChanges();
  }));

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.name).toBe('Test User');
  });
});
