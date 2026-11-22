import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import {
  DatabaseConnection,
  DatabaseService,
} from 'src/app/services/database.service';

interface VerseRow {
  vnumber: number;
  vers: string;
}

interface TopicSection {
  referenceLabel: string;
  verses: VerseRow[];
}

@Component({
  selector: 'app-bible-topic-detail',
  templateUrl: './bible-topic-detail.page.html',
  styleUrls: ['./bible-topic-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class BibleTopicDetailPage {
  private readonly BSI_BIBLE_ID = 3;
  private readonly KJV_BIBLE_ID = 2;
  private database: DatabaseConnection;

  public selectedLanguage: 'ta' | 'en' = 'ta';
  public selectedTopicId = 0;
  public selectedTopicTitle = '';
  public topicSections: TopicSection[] = [];
  public isLoadingVerses = false;

  constructor(
    private navctrl: NavController,
    private route: ActivatedRoute,
    private platform: Platform,
    private databaseService: DatabaseService
  ) {}

  async ionViewWillEnter() {
    this.selectedTopicId = Number(this.route.snapshot.paramMap.get('id') || 0);
    const lang = this.route.snapshot.queryParamMap.get('lang');
    this.selectedLanguage = lang === 'en' ? 'en' : 'ta';

    await this.platform.ready();
    this.database = await this.databaseService.create({
      name: 'viviliam.db',
      location: 'default',
    });

    await this.loadTopic();
    await this.loadSections();
  }

  navBack() {
    this.navctrl.back();
  }

  async onLanguageChange(value: string | null | undefined) {
    this.selectedLanguage = value === 'en' ? 'en' : 'ta';
    await this.loadTopic();
    await this.loadSections();
  }

  private getSelectedBibleId(): number {
    return this.selectedLanguage === 'ta'
      ? this.BSI_BIBLE_ID
      : this.KJV_BIBLE_ID;
  }

  private async loadTopic() {
    const data = await this.database.executeSql(
      'SELECT id, title, title_tamil FROM bible_topics WHERE id = ?',
      [this.selectedTopicId]
    );

    if (data.rows.length === 0) {
      this.selectedTopicTitle =
        this.selectedLanguage === 'ta' ? 'தலைப்பு இல்லை' : 'Topic Not Found';
      return;
    }

    const row = data.rows.item(0);
    this.selectedTopicTitle =
      this.selectedLanguage === 'ta'
        ? String(row.title_tamil || row.title || '')
        : String(row.title || row.title_tamil || '');
  }

  private formatReferenceLabel(ref: any): string {
    const book =
      this.selectedLanguage === 'ta'
        ? ref.book_name_tamil || ref.book_name_english
        : ref.book_name_english;
    const startChapter = Number(ref.start_chapter);
    const endChapter = Number(ref.end_chapter);

    const hasStartVerse =
      ref.start_verse !== null && ref.start_verse !== undefined;
    const hasEndVerse = ref.end_verse !== null && ref.end_verse !== undefined;

    if (startChapter === endChapter && !hasStartVerse && !hasEndVerse) {
      return `${book} ${startChapter}`;
    }

    if (
      startChapter === endChapter &&
      hasStartVerse &&
      hasEndVerse &&
      Number(ref.start_verse) === Number(ref.end_verse)
    ) {
      return `${book} ${startChapter}:${ref.start_verse}`;
    }

    if (startChapter === endChapter && hasStartVerse && hasEndVerse) {
      return `${book} ${startChapter}:${ref.start_verse}-${ref.end_verse}`;
    }

    const startPart = hasStartVerse
      ? `${startChapter}:${ref.start_verse}`
      : `${startChapter}`;
    const endPart = hasEndVerse
      ? `${endChapter}:${ref.end_verse}`
      : `${endChapter}`;

    return `${book} ${startPart} - ${endPart}`;
  }

  private async loadReferenceVerses(ref: any): Promise<VerseRow[]> {
    const booknumber = Number(ref.booknumber);
    const startChapter = Number(ref.start_chapter);
    const endChapter = Number(ref.end_chapter);
    const startVerse =
      ref.start_verse === null || ref.start_verse === undefined
        ? 0
        : Number(ref.start_verse);
    const endVerse =
      ref.end_verse === null || ref.end_verse === undefined
        ? 999
        : Number(ref.end_verse);

    const query =
      'SELECT a.vnumber, a.vers FROM vers a WHERE a.bibleid = ? AND a.booknumber = ? AND (a.cnumber > ? OR (a.cnumber = ? AND a.vnumber >= ?)) AND (a.cnumber < ? OR (a.cnumber = ? AND a.vnumber <= ?)) ORDER BY a.booknumber, a.cnumber, a.vnumber';

    const data = await this.database.executeSql(query, [
      this.getSelectedBibleId(),
      booknumber,
      startChapter,
      startChapter,
      startVerse,
      endChapter,
      endChapter,
      endVerse,
    ]);

    const verses: VerseRow[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      verses.push({
        vnumber: Number(data.rows.item(i).vnumber),
        vers: String(data.rows.item(i).vers || '').replace(/[ṟṞḇḆ]/g, ''),
      });
    }

    return verses;
  }

  private async loadSections() {
    this.isLoadingVerses = true;
    this.topicSections = [];

    try {
      const refsData = await this.database.executeSql(
        'SELECT id, booknumber, start_chapter, start_verse, end_chapter, end_verse, book_name_english, book_name_tamil FROM bible_topic_refs WHERE topic_id = ? ORDER BY ref_order, id',
        [this.selectedTopicId]
      );

      const sections: TopicSection[] = [];
      for (let i = 0; i < refsData.rows.length; i++) {
        const ref = refsData.rows.item(i);
        const verses = await this.loadReferenceVerses(ref);

        sections.push({
          referenceLabel: this.formatReferenceLabel(ref),
          verses,
        });
      }

      this.topicSections = sections.filter(
        (section) => section.verses.length > 0
      );
    } finally {
      this.isLoadingVerses = false;
    }
  }
}
