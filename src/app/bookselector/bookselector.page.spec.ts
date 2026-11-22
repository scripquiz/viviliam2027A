import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PageTestingModule } from '../../testing/page-testing.module';

import { BookselectorPage } from './bookselector.page';

describe('BookselectorPage', () => {
  let component: BookselectorPage;
  let fixture: ComponentFixture<BookselectorPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookselectorPage ],
      imports: [PageTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BookselectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
