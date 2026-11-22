import { DatabaseImportService } from './database-import.service';

describe('DatabaseImportService', () => {
    let service: DatabaseImportService;

    beforeEach(() => {
        service = new DatabaseImportService();
    });

    function createFakeDb(
        executeSetImpl?: (chunk: any[]) => Promise<any>,
        executeSqlImpl?: (sql: string, params: any[]) => Promise<any>
    ) {
        const fakeDb = {
            executeSql: jasmine.createSpy('executeSql').and.callFake((sql: string, params: any[]) => {
                if (executeSqlImpl) {
                    return executeSqlImpl(sql, params);
                }
                return Promise.resolve({ rows: { length: 0, item: () => undefined }, rowsAffected: 1 });
            }),
            connection: {
                executeSet: jasmine
                    .createSpy('executeSet')
                    .and.callFake((chunk: any[]) => (executeSetImpl ? executeSetImpl(chunk) : Promise.resolve({ changes: { changes: chunk.length } }))),
            },
        } as any;

        return fakeDb;
    }

    it('imports valid JSON and commits transaction', async () => {
        const db = createFakeDb();

        const payload = {
            data: {
                inserts: {
                    vers: [
                        { bibleid: '1', booknumber: '1', cnumber: '1', vnumber: '1', vers: 'v1' },
                        { bibleid: '1', booknumber: '1', cnumber: '1', vnumber: '2', vers: 'v2' },
                    ],
                },
            },
        };

        const result = await service.importJsonToDb(db, payload);

        expect(db.connection.executeSet).toHaveBeenCalledTimes(1);
        expect(db.executeSql).not.toHaveBeenCalled();
        expect(result.changes.changes).toBe(2);
    });

    it('throws on invalid payload format', async () => {
        const db = createFakeDb();

        await expectAsync(service.importJsonToDb(db, { foo: 'bar' })).toBeRejectedWithError(
            'Invalid JSON import format. Expected data.inserts object.'
        );

        expect(db.executeSql).not.toHaveBeenCalled();
    });

    it('falls back to row-by-row inserts when executeSet fails', async () => {
        const db = createFakeDb(() => Promise.reject(new Error('executeSet failed')));

        const payload = {
            data: {
                inserts: {
                    vers: [{ bibleid: '1', booknumber: '1', cnumber: '1', vnumber: '1', vers: 'v1' }],
                },
            },
        };

        const result = await service.importJsonToDb(db, payload);
        expect(db.connection.executeSet).toHaveBeenCalledTimes(1);
        expect(db.executeSql).toHaveBeenCalledWith(
            'INSERT INTO "vers" ("bibleid", "booknumber", "cnumber", "vnumber", "vers") VALUES (?, ?, ?, ?, ?)',
            ['1', '1', '1', '1', 'v1']
        );
        expect(result.changes.changes).toBe(1);
    });

    it('inserts rows sequentially for each chunk when falling back', async () => {
        const db = createFakeDb();

        const payload = {
            data: {
                inserts: {
                    vers: [{ bibleid: '1', booknumber: '1', cnumber: '1', vnumber: '1', vers: 'v1' }],
                },
            },
        };

        await service.importJsonToDb(db, payload);
        expect(db.connection.executeSet).toHaveBeenCalledTimes(1);
    });

    it('rejects when a row insert fails', async () => {
        const db = createFakeDb(() => Promise.reject(new Error('executeSet failed')), (sql: string) => {
            if (sql.startsWith('INSERT INTO "vers"')) {
                return Promise.reject(new Error('row execute failed'));
            }
            return Promise.resolve({ rows: { length: 0, item: () => undefined }, rowsAffected: 1 });
        });

        const payload = {
            data: {
                inserts: {
                    vers: [{ bibleid: '1', booknumber: '1', cnumber: '1', vnumber: '1', vers: 'v1' }],
                },
            },
        };

        await expectAsync(service.importJsonToDb(db, payload)).toBeRejected();
    });

    it('chunks large inserts into multiple row inserts', async () => {
        const db = createFakeDb();
        const rows = Array.from({ length: 450 }, (_, idx) => ({
            bibleid: '1',
            booknumber: '1',
            cnumber: '1',
            vnumber: `${idx + 1}`,
            vers: `v${idx + 1}`,
        }));

        const payload = {
            data: {
                inserts: {
                    vers: rows,
                },
            },
        };

        await service.importJsonToDb(db, payload);

        expect(db.connection.executeSet).toHaveBeenCalledTimes(2);
    });
});
