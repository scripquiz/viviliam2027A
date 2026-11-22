import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  DatabaseConnection,
  DatabaseService,
} from 'src/app/services/database.service';

interface TopicReference {
  book: string;
  start: {
    chapter: number;
    verse: number | null;
  };
  end: {
    chapter: number;
    verse: number | null;
  };
}

interface LifeEventItem {
  event: string;
  event_tamil?: string;
  reference?: TopicReference;
  references?: TopicReference[];
}

interface VerseRow {
  vnumber: number;
  vers: string;
}

interface LifeEventSection {
  referenceLabel: string;
  verses: VerseRow[];
}

interface BookRow {
  booknumber: number;
  nameEnglish: string;
  nameTamil: string;
}

@Component({
  selector: 'app-life-event-detail',
  templateUrl: './life-event-detail.page.html',
  styleUrls: ['./life-event-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LifeEventDetailPage {
  private readonly BSI_BIBLE_ID = 3;
  private readonly KJV_BIBLE_ID = 2;
  private database: DatabaseConnection;

  public selectedLanguage: 'ta' | 'en' = 'ta';
  public selectedTitle = '';
  public sections: LifeEventSection[] = [];
  public isLoadingVerses = false;

  private eventId = 0;
  private eventItem: LifeEventItem | null = null;

  constructor(
    private navctrl: NavController,
    private route: ActivatedRoute,
    private platform: Platform,
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {}

  async ionViewWillEnter() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id') || 0);
    const lang = this.route.snapshot.queryParamMap.get('lang');
    this.selectedLanguage = lang === 'en' ? 'en' : 'ta';

    await this.platform.ready();
    this.database = await this.databaseService.create({
      name: 'viviliam.db',
      location: 'default',
    });

    await this.loadEvent();
    await this.loadVerses();
  }

  navBack() {
    this.navctrl.back();
  }

  async onLanguageChange(value: string | null | undefined) {
    this.selectedLanguage = value === 'en' ? 'en' : 'ta';
    this.updateTitle();
    await this.loadVerses();
  }

  private async loadEvent() {
    const raw = await firstValueFrom(
      this.http.get('assets/data/15.ts', { responseType: 'text' })
    );
    const source = JSON.parse(raw) as LifeEventItem[];
    this.eventItem = source?.[this.eventId] || null;
    this.updateTitle();
  }

  private updateTitle() {
    if (!this.eventItem) {
      this.selectedTitle =
        this.selectedLanguage === 'ta' ? 'வாழ்க்கை நிகழ்வுகள்' : 'Life Events';
      return;
    }

    if (this.selectedLanguage === 'ta') {
      this.selectedTitle = String(
        this.eventItem.event_tamil || this.eventItem.event || ''
      ).trim();
      return;
    }

    this.selectedTitle = String(
      this.eventItem.event || this.eventItem.event_tamil || ''
    ).trim();
  }

  private getSelectedBibleId(): number {
    return this.selectedLanguage === 'ta'
      ? this.BSI_BIBLE_ID
      : this.KJV_BIBLE_ID;
  }

  private normalizeReferences(item: LifeEventItem): TopicReference[] {
    if (Array.isArray(item.references) && item.references.length > 0) {
      return item.references;
    }

    if (item.reference) {
      return [item.reference];
    }

    return [];
  }

  private normalizeBookName(bookName: string): string {
    return String(bookName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private async loadBooksMap(): Promise<Map<string, BookRow>> {
    const data = await this.database.executeSql(
      'SELECT bnumber, fullname_english, fullname_tamil FROM books',
      []
    );

    const map = new Map<string, BookRow>();
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows.item(i);
      const book: BookRow = {
        booknumber: Number(row.bnumber),
        nameEnglish: String(row.fullname_english || ''),
        nameTamil: String(row.fullname_tamil || ''),
      };

      map.set(this.normalizeBookName(book.nameEnglish), book);
    }

    return map;
  }

  private resolveBook(
    map: Map<string, BookRow>,
    rawName: string
  ): BookRow | undefined {
    const key = this.normalizeBookName(rawName);
    if (map.has(key)) {
      return map.get(key);
    }

    const aliases: { [key: string]: string[] } = {
      psalm: ['psalms'],
      psalms: ['psalm'],
      songofsolomon: ['songofsongs', 'songofsongs'],
      songofsongs: ['songofsolomon'],
    };

    const options = aliases[key] || [];
    for (const alias of options) {
      if (map.has(alias)) {
        return map.get(alias);
      }
    }

    return undefined;
  }

  private buildReferenceLabel(
    reference: TopicReference,
    book?: BookRow
  ): string {
    const bookName =
      this.selectedLanguage === 'ta'
        ? String(book?.nameTamil || book?.nameEnglish || reference.book)
        : String(book?.nameEnglish || book?.nameTamil || reference.book);

    const startChapter = Number(reference.start.chapter);
    const endChapter = Number(reference.end.chapter);
    const hasStartVerse =
      reference.start.verse !== null && reference.start.verse !== undefined;
    const hasEndVerse =
      reference.end.verse !== null && reference.end.verse !== undefined;

    if (startChapter === endChapter && !hasStartVerse && !hasEndVerse) {
      return `${bookName} ${startChapter}`;
    }

    if (
      startChapter === endChapter &&
      hasStartVerse &&
      hasEndVerse &&
      Number(reference.start.verse) === Number(reference.end.verse)
    ) {
      return `${bookName} ${startChapter}:${reference.start.verse}`;
    }

    if (startChapter === endChapter && hasStartVerse && hasEndVerse) {
      return `${bookName} ${startChapter}:${reference.start.verse}-${reference.end.verse}`;
    }

    const startPart = hasStartVerse
      ? `${startChapter}:${reference.start.verse}`
      : `${startChapter}`;
    const endPart = hasEndVerse
      ? `${endChapter}:${reference.end.verse}`
      : `${endChapter}`;

    return `${bookName} ${startPart} - ${endPart}`;
  }

  private async loadVerses() {
    this.sections = [];
    if (!this.eventItem) {
      return;
    }

    this.isLoadingVerses = true;
    try {
      const map = await this.loadBooksMap();
      const refs = this.normalizeReferences(this.eventItem);
      const built: LifeEventSection[] = [];

      for (const reference of refs) {
        const book = this.resolveBook(map, reference.book);
        if (!book?.booknumber) {
          continue;
        }

        const startVerse =
          reference.start.verse == null ? 0 : Number(reference.start.verse);
        const endVerse =
          reference.end.verse == null ? 999 : Number(reference.end.verse);

        const sql =
          'SELECT a.vnumber, a.vers FROM vers a WHERE a.bibleid = ? AND a.booknumber = ? AND (a.cnumber > ? OR (a.cnumber = ? AND a.vnumber >= ?)) AND (a.cnumber < ? OR (a.cnumber = ? AND a.vnumber <= ?)) ORDER BY a.booknumber, a.cnumber, a.vnumber';

        const data = await this.database.executeSql(sql, [
          this.getSelectedBibleId(),
          book.booknumber,
          Number(reference.start.chapter),
          Number(reference.start.chapter),
          startVerse,
          Number(reference.end.chapter),
          Number(reference.end.chapter),
          endVerse,
        ]);

        const verses: VerseRow[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          verses.push({
            vnumber: Number(data.rows.item(i).vnumber),
            vers: String(data.rows.item(i).vers || '').replace(/[ṟṞḇḆ]/g, ''),
          });
        }

        built.push({
          referenceLabel: this.buildReferenceLabel(reference, book),
          verses,
        });
      }

      this.sections = built.filter((section) => section.verses.length > 0);
    } finally {
      this.isLoadingVerses = false;
    }
  }
}
