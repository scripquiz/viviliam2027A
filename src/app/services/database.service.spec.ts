import { DatabaseConnection, DatabaseService } from './database.service';

describe('DatabaseConnection', () => {
    it('returns row adapter for read queries', async () => {
        const mockConnection = {
            query: jasmine.createSpy('query').and.resolveTo({
                values: [{ id: 1, title: 'Genesis' }],
            }),
            run: jasmine.createSpy('run'),
        } as any;

        const db = new DatabaseConnection(mockConnection);
        const result = await db.executeSql('select * from bibles where id = ?', [1]);

        expect(mockConnection.query).toHaveBeenCalled();
        expect(mockConnection.run).not.toHaveBeenCalled();
        expect(result.rows.length).toBe(1);
        expect(result.rows.item(0).id).toBe(1);
        expect(result.rowsAffected).toBe(0);
    });

    it('returns change metadata for write queries', async () => {
        const mockConnection = {
            query: jasmine.createSpy('query'),
            run: jasmine.createSpy('run').and.resolveTo({
                changes: {
                    changes: 2,
                    lastId: 99,
                },
            }),
        } as any;

        const db = new DatabaseConnection(mockConnection);
        const result = await db.executeSql('update bibles set title = ? where id = ?', ['Updated', 1]);

        expect(mockConnection.run).toHaveBeenCalled();
        expect(mockConnection.query).not.toHaveBeenCalled();
        expect(result.rows.length).toBe(0);
        expect(result.rowsAffected).toBe(2);
        expect(result.insertId).toBe(99);
    });
});

describe('DatabaseService', () => {
    it('reports healthy schema when required tables and core data exist', async () => {
        const query = jasmine.createSpy('query').and.callFake((sql: string, params: any[]) => {
            if (sql.includes('sqlite_master')) {
                return Promise.resolve({ values: [{ count: 1 }] });
            }
            if (sql.includes('FROM bibles')) {
                return Promise.resolve({ values: [{ count: 5 }] });
            }
            return Promise.resolve({ values: [] });
        });

        const db = new DatabaseConnection({ query, run: jasmine.createSpy('run') } as any);
        const service = new DatabaseService();

        const result = await service.verifyCoreSchema(db);

        expect(result.isReady).toBeTrue();
        expect(result.missingTables).toEqual([]);
        expect(result.coreDataPresent).toBeTrue();
    });

    it('reports missing tables when schema is incomplete', async () => {
        const existingTables = new Set(['config', 'bibles', 'vers']);
        const query = jasmine.createSpy('query').and.callFake((sql: string, params: any[]) => {
            if (sql.includes('sqlite_master')) {
                const tableName = params[0];
                return Promise.resolve({ values: [{ count: existingTables.has(tableName) ? 1 : 0 }] });
            }
            return Promise.resolve({ values: [{ count: 0 }] });
        });

        const db = new DatabaseConnection({ query, run: jasmine.createSpy('run') } as any);
        const service = new DatabaseService();

        const result = await service.verifyCoreSchema(db);

        expect(result.isReady).toBeFalse();
        expect(result.missingTables).toEqual(['versefilled', 'fonts']);
        expect(result.coreDataPresent).toBeFalse();
    });
});
