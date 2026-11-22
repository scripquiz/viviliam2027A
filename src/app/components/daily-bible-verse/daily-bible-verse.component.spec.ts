import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../../testing/page-testing.module';

import { DailyBibleVerseComponent } from './daily-bible-verse.component';

describe('DailyBibleVerseComponent', () => {
  let component: DailyBibleVerseComponent;
  let fixture: ComponentFixture<DailyBibleVerseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PageTestingModule, DailyBibleVerseComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyBibleVerseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
