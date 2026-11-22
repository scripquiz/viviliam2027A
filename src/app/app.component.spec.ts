import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { PageTestingModule } from '../testing/page-testing.module';

describe('AppComponent', () => {

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      imports: [PageTestingModule, AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    spyOn(AppComponent.prototype, 'initializeCapacitor').and.resolveTo();
    spyOn(AppComponent.prototype, 'connectDB');
    TestBed.compileComponents();
  }));

  it('should create the app', waitForAsync(async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.initializeCapacitor).toHaveBeenCalled();
    expect(app.connectDB).toHaveBeenCalled();
  }));

});
