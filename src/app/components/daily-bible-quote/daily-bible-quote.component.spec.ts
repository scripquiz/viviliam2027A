import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../../testing/page-testing.module';

import { DailyBibleQuoteComponent } from './daily-bible-quote.component';

describe('DailyBibleQuoteComponent', () => {
  let component: DailyBibleQuoteComponent;
  let fixture: ComponentFixture<DailyBibleQuoteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PageTestingModule, DailyBibleQuoteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyBibleQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
