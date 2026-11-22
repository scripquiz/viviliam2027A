import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  DatabaseConnection,
  DatabaseService,
} from 'src/app/services/database.service';

interface TopicRow {
  id: number;
  title: string;
  title_tamil: string;
}

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

interface TopicSourceItem {
  event: string;
  event_tamil?: string;
  eventTamil?: string;
  event_ta?: string;
  reference?: TopicReference;
  references?: TopicReference[];
}

interface BookFilterOption {
  booknumber: number;
  nameEnglish: string;
  nameTamil: string;
}

@Component({
  selector: 'app-bible-topics',
  templateUrl: './bible-topics.page.html',
  styleUrls: ['./bible-topics.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class BibleTopicsPage {
  private readonly STORAGE_LANGUAGE_KEY = 'bible_topics_language';
  private readonly STORAGE_SCOPE_KEY = 'bible_topics_scope';
  private database: DatabaseConnection;

  public topics: TopicRow[] = [];
  public selectedScope = 'all';
  public filterBooks: BookFilterOption[] = [];
  private topicBookNumbers = new Map<number, Set<number>>();
  public selectedLanguage: 'ta' | 'en' = 'ta';

  constructor(
    private navctrl: NavController,
    private platform: Platform,
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {}

  async ionViewWillEnter() {
    this.restoreUiState();

    await this.platform.ready();

    this.database = await this.databaseService.create({
      name: 'viviliam.db',
      location: 'default',
    });

    await this.ensureTopicsSchemaAndSeed();
    await this.loadTopics();
    await this.loadFilterBooks();
    await this.loadTopicBookNumbers();
    this.normalizeScopeAfterLoad();
  }

  navBack() {
    this.navctrl.back();
  }

  async onLanguageChange(value: string | null | undefined) {
    this.selectedLanguage = value === 'en' ? 'en' : 'ta';
    this.persistUiState();
  }

  async onScopeChange(value: string | null | undefined) {
    this.selectedScope = value || 'all';
    this.persistUiState();
  }

  get filteredTopics(): TopicRow[] {
    if (this.selectedScope === 'all') {
      return this.topics;
    }

    if (this.selectedScope === 'ot') {
      return this.topics.filter((topic) =>
        this.matchesTestament(topic.id, 'ot')
      );
    }

    if (this.selectedScope === 'nt') {
      return this.topics.filter((topic) =>
        this.matchesTestament(topic.id, 'nt')
      );
    }

    if (this.selectedScope.startsWith('book:')) {
      const booknumber = Number(this.selectedScope.replace('book:', ''));
      return this.topics.filter((topic) =>
        this.matchesBook(topic.id, booknumber)
      );
    }

    return this.topics;
  }

  getScopeText(value: string): string {
    if (value === 'all') {
      return this.selectedLanguage === 'ta' ? 'முழு வேதாகமம்' : 'All Books';
    }

    if (value === 'ot') {
      return this.selectedLanguage === 'ta' ? 'பழைய ஏற்பாடு' : 'Old Testament';
    }

    if (value === 'nt') {
      return this.selectedLanguage === 'ta' ? 'புதிய ஏற்பாடு' : 'New Testament';
    }

    if (value.startsWith('book:')) {
      const booknumber = Number(value.replace('book:', ''));
      const item = this.filterBooks.find(
        (book) => book.booknumber === booknumber
      );
      if (item) {
        return this.selectedLanguage === 'ta'
          ? item.nameTamil || item.nameEnglish
          : item.nameEnglish || item.nameTamil;
      }
    }

    return this.selectedLanguage === 'ta' ? 'வடிகட்டி' : 'Filter';
  }

  openTopic(topic: TopicRow) {
    if (!topic) {
      return;
    }

    this.navctrl.navigateForward(
      `/bible-topics/${topic.id}?lang=${this.selectedLanguage}`
    );
  }

  getTopicLabel(topic: TopicRow): string {
    if (this.selectedLanguage === 'ta') {
      return topic.title_tamil || topic.title;
    }

    return topic.title || topic.title_tamil;
  }

  private async ensureTopicsSchemaAndSeed() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS bible_topics(id integer PRIMARY KEY AUTOINCREMENT, title TEXT, title_tamil TEXT, display_order integer)',
      []
    );

    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS bible_topic_refs(id integer PRIMARY KEY AUTOINCREMENT, topic_id integer, ref_order integer, booknumber integer, start_chapter integer, start_verse integer, end_chapter integer, end_verse integer, book_name_english TEXT, book_name_tamil TEXT)',
      []
    );

    await this.ensureOptionalColumns();
    await this.backfillLanguageFields();

    const countData = await this.database.executeSql(
      'SELECT COUNT(1) AS total FROM bible_topics',
      []
    );
    const total = Number(countData.rows.item(0)?.total ?? 0);

    if (total > 0) {
      return;
    }

    await this.seedTopicsFromAsset();
  }

  private async seedTopicsFromAsset() {
    const raw = await firstValueFrom(
      this.http.get('assets/data/14.ts', { responseType: 'text' })
    );
    const source = JSON.parse(raw) as TopicSourceItem[];

    const booksMap = await this.loadBooksMap();

    await this.database.executeSql('DELETE FROM bible_topic_refs', []);
    await this.database.executeSql('DELETE FROM bible_topics', []);

    for (let topicIndex = 0; topicIndex < source.length; topicIndex++) {
      const item = source[topicIndex];
      if (!item?.event) {
        continue;
      }

      const tamilTitle =
        String(
          item.event_tamil || item.eventTamil || item.event_ta || ''
        ).trim() || item.event;

      await this.database.executeSql(
        'INSERT INTO bible_topics(title, title_tamil, display_order) VALUES(?, ?, ?)',
        [item.event, tamilTitle, topicIndex + 1]
      );

      const topicIdResult = await this.database.executeSql(
        'SELECT last_insert_rowid() AS topicId',
        []
      );
      const topicId = Number(topicIdResult.rows.item(0)?.topicId ?? 0);
      if (!topicId) {
        continue;
      }

      const references = this.normalizeReferences(item);
      let refOrder = 1;

      for (const reference of references) {
        const bookKey = this.normalizeBookName(reference.book);
        const bookData = booksMap.get(bookKey);
        const booknumber = bookData?.booknumber;

        if (
          !booknumber ||
          !reference.start?.chapter ||
          !reference.end?.chapter
        ) {
          continue;
        }

        await this.database.executeSql(
          'INSERT INTO bible_topic_refs(topic_id, ref_order, booknumber, start_chapter, start_verse, end_chapter, end_verse, book_name_english, book_name_tamil) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            topicId,
            refOrder,
            booknumber,
            reference.start.chapter,
            reference.start.verse,
            reference.end.chapter,
            reference.end.verse,
            bookData?.nameEnglish || reference.book,
            bookData?.nameTamil || reference.book,
          ]
        );

        refOrder++;
      }
    }
  }

  private async loadBooksMap(): Promise<
    Map<string, { booknumber: number; nameEnglish: string; nameTamil: string }>
  > {
    const booksData = await this.database.executeSql(
      'SELECT bnumber, fullname_english, fullname_tamil FROM books',
      []
    );

    const map = new Map<
      string,
      { booknumber: number; nameEnglish: string; nameTamil: string }
    >();
    for (let i = 0; i < booksData.rows.length; i++) {
      const row = booksData.rows.item(i);
      map.set(this.normalizeBookName(row.fullname_english), {
        booknumber: Number(row.bnumber),
        nameEnglish: String(row.fullname_english || ''),
        nameTamil: String(row.fullname_tamil || ''),
      });
    }

    return map;
  }

  private normalizeReferences(item: TopicSourceItem): TopicReference[] {
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

  private async loadTopics() {
    const data = await this.database.executeSql(
      'SELECT id, title, title_tamil FROM bible_topics ORDER BY display_order, id',
      []
    );

    const topics: TopicRow[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      topics.push({
        id: Number(data.rows.item(i).id),
        title: data.rows.item(i).title,
        title_tamil: data.rows.item(i).title_tamil || '',
      });
    }

    this.topics = topics;
  }

  private async loadFilterBooks() {
    const data = await this.database.executeSql(
      'SELECT bnumber, fullname_english, fullname_tamil FROM books ORDER BY bnumber',
      []
    );

    const list: BookFilterOption[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      list.push({
        booknumber: Number(data.rows.item(i).bnumber),
        nameEnglish: String(data.rows.item(i).fullname_english || ''),
        nameTamil: String(data.rows.item(i).fullname_tamil || ''),
      });
    }

    this.filterBooks = list;
  }

  private async loadTopicBookNumbers() {
    const data = await this.database.executeSql(
      'SELECT topic_id, booknumber FROM bible_topic_refs',
      []
    );

    const map = new Map<number, Set<number>>();
    for (let i = 0; i < data.rows.length; i++) {
      const topicId = Number(data.rows.item(i).topic_id);
      const booknumber = Number(data.rows.item(i).booknumber);

      if (!map.has(topicId)) {
        map.set(topicId, new Set<number>());
      }

      map.get(topicId)?.add(booknumber);
    }

    this.topicBookNumbers = map;
  }

  private matchesBook(topicId: number, booknumber: number): boolean {
    if (!booknumber) {
      return true;
    }

    const books = this.topicBookNumbers.get(topicId);
    return !!books && books.has(booknumber);
  }

  private matchesTestament(topicId: number, testament: 'ot' | 'nt'): boolean {
    const books = this.topicBookNumbers.get(topicId);
    if (!books || books.size === 0) {
      return false;
    }

    for (const booknumber of books) {
      if (testament === 'ot' && booknumber >= 1 && booknumber <= 39) {
        return true;
      }

      if (testament === 'nt' && booknumber >= 40) {
        return true;
      }
    }

    return false;
  }

  private async ensureOptionalColumns() {
    await this.addColumnIfMissing('bible_topics', 'title_tamil', 'TEXT');
    await this.addColumnIfMissing(
      'bible_topic_refs',
      'book_name_tamil',
      'TEXT'
    );
  }

  private async backfillLanguageFields() {
    await this.database.executeSql(
      "UPDATE bible_topics SET title_tamil = title WHERE IFNULL(title_tamil, '') = ''",
      []
    );

    await this.database.executeSql(
      "UPDATE bible_topic_refs SET book_name_tamil = book_name_english WHERE IFNULL(book_name_tamil, '') = ''",
      []
    );
  }

  private async addColumnIfMissing(
    tableName: string,
    columnName: string,
    type: string
  ) {
    try {
      await this.database.executeSql(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}`,
        []
      );
    } catch (_error) {
      // Ignore when column already exists.
    }
  }

  private restoreUiState() {
    try {
      const savedLanguage = localStorage.getItem(this.STORAGE_LANGUAGE_KEY);
      const savedScope = localStorage.getItem(this.STORAGE_SCOPE_KEY);

      if (savedLanguage === 'ta' || savedLanguage === 'en') {
        this.selectedLanguage = savedLanguage;
      }

      if (savedScope && savedScope.trim().length > 0) {
        this.selectedScope = savedScope;
      }
    } catch (_error) {
      // Ignore storage errors and continue with defaults.
    }
  }

  private persistUiState() {
    try {
      localStorage.setItem(this.STORAGE_LANGUAGE_KEY, this.selectedLanguage);
      localStorage.setItem(this.STORAGE_SCOPE_KEY, this.selectedScope);
    } catch (_error) {
      // Ignore storage errors.
    }
  }

  private normalizeScopeAfterLoad() {
    if (
      this.selectedScope === 'all' ||
      this.selectedScope === 'ot' ||
      this.selectedScope === 'nt'
    ) {
      return;
    }

    if (!this.selectedScope.startsWith('book:')) {
      this.selectedScope = 'all';
      this.persistUiState();
      return;
    }

    const booknumber = Number(this.selectedScope.replace('book:', ''));
    const exists = this.filterBooks.some(
      (book) => book.booknumber === booknumber
    );
    if (!exists) {
      this.selectedScope = 'all';
      this.persistUiState();
    }
  }
}
