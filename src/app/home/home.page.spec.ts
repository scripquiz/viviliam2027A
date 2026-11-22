import { ComponentFixture, TestBed, fakeAsync, flush, discardPeriodicTasks } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';
import { DailyBibleVerseComponent } from '../components/daily-bible-verse/daily-bible-verse.component';
import { DailyBibleQuoteComponent } from '../components/daily-bible-quote/daily-bible-quote.component';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(fakeAsync(() => {
    spyOn(HomePage.prototype, 'getAppVersionInfo').and.resolveTo();
    spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify([{ bibleids: '2,3,5' }])));
    TestBed.configureTestingModule({
      declarations: [ HomePage ],
      imports: [PageTestingModule, DailyBibleVerseComponent, DailyBibleQuoteComponent],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flush();
    discardPeriodicTasks();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
