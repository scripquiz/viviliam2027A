import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, 'src', 'assets', 'data');
const outDir = path.join(repoRoot, 'src', 'assets', 'databases');
const outFile = path.join(outDir, 'viviliamSQLite.db');

const schemaStatements = [
    'CREATE TABLE IF NOT EXISTS bibles ( id integer PRIMARY KEY, title TEXT, description TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)',
    'CREATE TABLE IF NOT EXISTS comparebibles(id integer PRIMARY KEY, title TEXT,language TEXT, defaultbible TEXT, color TEXT, isshow integer, seq integer)',
    'CREATE TABLE IF NOT EXISTS vers(vid integer PRIMARY KEY AUTOINCREMENT,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)',
    'CREATE TABLE IF NOT EXISTS versTemp(vid integer,bibleid integer, booknumber integer,bookname TEXT, cnumber integer, vnumber real, vers TEXT, textHighlight TEXT, bookMark TEXT, notes TEXT, highlightOn TEXT, bookMarkOn TEXT, notesOn TEXT)',
    'CREATE TABLE IF NOT EXISTS versefilled(id integer PRIMARY KEY, versefillesstatus TEXT)',
    'CREATE TABLE IF NOT EXISTS books(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)',
    'CREATE TABLE IF NOT EXISTS books_etb(bnumber integer, fullname_tamil TEXT, shortname_tamil TEXT, fullname_english TEXT, shortname_english TEXT, chapters TEXT)',
    'CREATE TABLE IF NOT EXISTS fonts(id integer, language TEXT, font_family TEXT, sample_text TEXT, isset integer)',
    'CREATE TABLE IF NOT EXISTS config(id integer, caption TEXT, value TEXT)',
    'CREATE TABLE IF NOT EXISTS verseoftheday(id integer PRIMARY KEY AUTOINCREMENT, Mnth integer, Date integer, Tvrs TEXT, Tref TEXT, Eref TEXT, Evrs TEXT)',
    'CREATE TABLE IF NOT EXISTS quizoftheday(id integer PRIMARY KEY AUTOINCREMENT, Mnth integer, Date int, Tque TEXT, Tans TEXT, Tref TEXT, Eref TEXt, eans TEXT, eque TEXT)',
    'CREATE TABLE IF NOT EXISTS quoteoftheday(id integer PRIMARY KEY AUTOINCREMENT, mnth integer, date int, quot TEXT, athr TEXT, tquot TEXT)',
    'CREATE TABLE IF NOT EXISTS notifications(id integer PRIMARY KEY, type TEXT,place TEXT, icon TEXT, startdate TEXT , enddate TEXT , subtitle TEXT, content TEXT, url TEXT,imgurl TEXT, url_text TEXT, footer1 TEXT, footer2 TEXT, read int, comments TEXT, like TEXT, duration TEXT,active TEXT, urlplace TEXT, version TEXT)',
    'CREATE TABLE IF NOT EXISTS events(id integer PRIMARY KEY, type TEXT,frequency TEXT, icon TEXT, startdate TEXT , enddate TEXT, startday TEXT, starttime TEXT, endday TEXT, endtime TEXT , subtitle TEXT, content TEXT, url TEXT, url_text TEXT, footer1 TEXT, footer2 TEXT, read int, active TEXT,urlplace TEXT,instructiontext TEXT, instructionurl TEXT,  visibility TEXT, whenvisible TEXT)',
    'CREATE TABLE IF NOT EXISTS notificationsread(id integer PRIMARY KEY)',
    'CREATE TABLE IF NOT EXISTS eventsread(id integer PRIMARY KEY)',
    'CREATE TABLE IF NOT EXISTS eventinstructions(id integer PRIMARY KEY, type TEXT, instruction TEXT)',
    'CREATE TABLE IF NOT EXISTS bible_topics(id integer PRIMARY KEY AUTOINCREMENT, title TEXT, title_tamil TEXT, display_order integer)',
    'CREATE TABLE IF NOT EXISTS bible_topic_refs(id integer PRIMARY KEY AUTOINCREMENT, topic_id integer, ref_order integer, booknumber integer, start_chapter integer, start_verse integer, end_chapter integer, end_verse integer, book_name_english TEXT, book_name_tamil TEXT)',
];

const indexStatements = [
    'CREATE INDEX IF NOT EXISTS idx_bibles_id ON bibles (id);',
    'CREATE INDEX IF NOT EXISTS idx_verse_data ON vers (bibleid, booknumber, cnumber, vnumber);',
    'CREATE INDEX IF NOT EXISTS idx_books_booknumber ON books (bnumber);',
    'CREATE INDEX IF NOT EXISTS idx_books_id ON books (fullname_tamil);',
    'CREATE INDEX IF NOT EXISTS idx_books_id2 ON books (fullname_english);',
    'CREATE INDEX IF NOT EXISTS idx_books_etb_booknumber ON books_etb (bnumber);',
    'CREATE INDEX IF NOT EXISTS idx_books_etb_id ON books_etb (fullname_tamil);',
    'CREATE INDEX IF NOT EXISTS idx_books_etb_id2 ON books_etb (fullname_english);',
    'CREATE INDEX IF NOT EXISTS idx_comparebibles_id ON comparebibles (id, isshow);',
    'CREATE INDEX IF NOT EXISTS idx_bibles_defaultid ON bibles (defaultbible);',
    'CREATE INDEX IF NOT EXISTS idx_bible_topics_order ON bible_topics (display_order);',
    'CREATE INDEX IF NOT EXISTS idx_bible_topic_refs_topic ON bible_topic_refs (topic_id, ref_order);',
];

function normalizeBookName(name) {
    return String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseTopicsFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
}

function buildBooksMap(db) {
    const result = db.exec('SELECT bnumber, fullname_english, fullname_tamil FROM books');
    const map = new Map();

    if (!result.length) {
        return map;
    }

    const rows = result[0].values;
    for (const row of rows) {
        const bnumber = Number(row[0]);
        const fullnameEnglish = String(row[1] ?? '');
        const fullnameTamil = String(row[2] ?? '');
        if (!Number.isNaN(bnumber) && fullnameEnglish) {
            map.set(normalizeBookName(fullnameEnglish), {
                booknumber: bnumber,
                nameEnglish: fullnameEnglish,
                nameTamil: fullnameTamil,
            });
        }
    }

    return map;
}

function seedBibleTopics(db, topics) {
    if (!Array.isArray(topics) || topics.length === 0) {
        return;
    }

    const booksMap = buildBooksMap(db);
    db.run('DELETE FROM bible_topic_refs');
    db.run('DELETE FROM bible_topics');

    db.run('BEGIN');
    let displayOrder = 1;

    for (const topic of topics) {
        const title = String(topic?.event ?? '').trim();
        const titleTamil = String(topic?.event_tamil ?? topic?.eventTamil ?? topic?.event_ta ?? '').trim() || title;
        if (!title) {
            continue;
        }

        db.run('INSERT INTO bible_topics (title, title_tamil, display_order) VALUES (?, ?, ?)', [title, titleTamil, displayOrder]);
        const topicIdResult = db.exec('SELECT last_insert_rowid()');
        const topicId = Number(topicIdResult[0]?.values?.[0]?.[0] ?? 0);
        displayOrder += 1;

        if (!topicId) {
            continue;
        }

        const references = Array.isArray(topic.references)
            ? topic.references
            : topic.reference
                ? [topic.reference]
                : [];

        let refOrder = 1;
        for (const reference of references) {
            const bookName = String(reference?.book ?? '').trim();
            const startChapter = Number(reference?.start?.chapter);
            const endChapter = Number(reference?.end?.chapter);
            const startVerse = reference?.start?.verse == null ? null : Number(reference.start.verse);
            const endVerse = reference?.end?.verse == null ? null : Number(reference.end.verse);
            const bookData = booksMap.get(normalizeBookName(bookName));
            const bookNumber = bookData?.booknumber;

            if (!bookNumber || Number.isNaN(startChapter) || Number.isNaN(endChapter)) {
                continue;
            }

            db.run(
                'INSERT INTO bible_topic_refs (topic_id, ref_order, booknumber, start_chapter, start_verse, end_chapter, end_verse, book_name_english, book_name_tamil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    topicId,
                    refOrder,
                    bookNumber,
                    startChapter,
                    Number.isNaN(startVerse) ? null : startVerse,
                    endChapter,
                    Number.isNaN(endVerse) ? null : endVerse,
                    bookData?.nameEnglish || bookName,
                    bookData?.nameTamil || bookName,
                ]
            );

            refOrder += 1;
        }
    }

    db.run('COMMIT');
}

function quoteIdentifier(name) {
    return `"${String(name).replace(/"/g, '""')}"`;
}

function parseDataFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.data?.inserts ?? {};
}

function parseBibleCatalog(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
}

function importTableRows(db, tableName, rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return 0;
    }

    const columns = Object.keys(rows[0]);
    if (columns.length === 0) {
        return 0;
    }

    const quotedColumns = columns.map((column) => quoteIdentifier(column)).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO ${quoteIdentifier(tableName)} (${quotedColumns}) VALUES (${placeholders})`;

    db.run('BEGIN');
    for (const row of rows) {
        const values = columns.map((column) => row[column] ?? null);
        db.run(insertSql, values);
    }
    db.run('COMMIT');

    return rows.length;
}

function upsertDbVersion(db) {
    db.run('DELETE FROM config WHERE id = 28');
    db.run('INSERT INTO config (id, caption, value) VALUES (28, ?, ?)', ['DB_VERSION', '40809']);
}

function seedBibleCatalog(db, bibles) {
    if (!Array.isArray(bibles) || bibles.length === 0) {
        return;
    }

    db.run('DELETE FROM bibles');
    db.run('DELETE FROM comparebibles');

    db.run('BEGIN');
    for (const bible of bibles) {
        const id = Number.parseInt(String(bible.id ?? '0'), 10) || 0;
        const seq = Number.parseInt(String(bible.seq ?? '0'), 10) || 0;
        const title = String(bible.title ?? '');
        const language = String(bible.language ?? '');
        const description = String(bible.description ?? '');
        const defaultBible = String(bible.defaultbible ?? '0');
        const compareColor = String(bible.comparecolor ?? '');

        db.run(
            'INSERT INTO bibles (id, title, description, language, defaultbible, color, isshow, seq) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, language, defaultBible, '', 1, seq]
        );

        db.run(
            'INSERT INTO comparebibles (id, title, language, defaultbible, color, isshow, seq) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, title, language, defaultBible, compareColor, 1, seq]
        );
    }
    db.run('COMMIT');
}

function seedStartupReadiness(db) {
    db.run('DELETE FROM versefilled');
    db.run('INSERT INTO versefilled (id, versefillesstatus) VALUES (1, ?)', ['filled']);

    const defaultBibleRows = db.exec("SELECT id FROM bibles WHERE defaultbible = '1' OR defaultbible = 1 LIMIT 1");
    const hasDefault = defaultBibleRows.length > 0 && defaultBibleRows[0].values.length > 0;

    if (!hasDefault) {
        db.run('UPDATE bibles SET defaultbible = 0');
        const preferredRows = db.exec('SELECT id FROM bibles WHERE id = 3 LIMIT 1');
        const hasPreferred = preferredRows.length > 0 && preferredRows[0].values.length > 0;

        if (hasPreferred) {
            db.run('UPDATE bibles SET defaultbible = 1 WHERE id = 3');
        } else {
            db.run('UPDATE bibles SET defaultbible = 1 WHERE id = (SELECT id FROM bibles ORDER BY seq, id LIMIT 1)');
        }
    }
}

async function main() {
    const SQL = await initSqlJs({
        locateFile: (file) => path.join(repoRoot, 'node_modules', 'sql.js', 'dist', file),
    });

    const db = new SQL.Database();
    db.run('PRAGMA journal_mode = MEMORY');
    db.run('PRAGMA synchronous = OFF');
    db.run('PRAGMA temp_store = MEMORY');

    for (const statement of schemaStatements) {
        db.run(statement);
    }

    const dataFiles = fs
        .readdirSync(dataDir)
        .filter((name) => /^\d+\.ts$/i.test(name))
        .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

    const topicFileName = '14.ts';
    const bibleDataFiles = dataFiles.filter((name) => name !== topicFileName);

    const bibleCatalog = parseBibleCatalog(path.join(dataDir, 'bibles.ts'));
    seedBibleCatalog(db, bibleCatalog);

    let totalRows = 0;

    for (const fileName of bibleDataFiles) {
        const inserts = parseDataFile(path.join(dataDir, fileName));
        const tableNames = Object.keys(inserts);

        for (const tableName of tableNames) {
            totalRows += importTableRows(db, tableName, inserts[tableName]);
        }
    }

    const topics = parseTopicsFile(path.join(dataDir, topicFileName));
    seedBibleTopics(db, topics);

    upsertDbVersion(db);
    seedStartupReadiness(db);

    for (const statement of indexStatements) {
        db.run(statement);
    }

    // Rebuild database pages tightly to minimize packaged DB size.
    db.run('VACUUM');

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(db.export()));

    console.log(`Prebuilt database written to ${outFile}`);
    console.log(`Imported rows: ${totalRows}`);
}

main().catch((error) => {
    console.error('Failed to build prebuilt database:', error);
    process.exitCode = 1;
});
