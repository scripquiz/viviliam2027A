import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MoreAboutPage } from './more-about.page';

describe('MoreAboutPage', () => {
  let component: MoreAboutPage;
  let fixture: ComponentFixture<MoreAboutPage>;

  beforeEach(waitForAsync(() => {
    spyOn(MoreAboutPage.prototype, 'getAppVersion').and.resolveTo();
    TestBed.configureTestingModule({
      declarations: [ MoreAboutPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoreAboutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
