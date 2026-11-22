import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import {
    CapacitorSQLite,
    SQLiteConnection,
    SQLiteDBConnection,
} from '@capacitor-community/sqlite';

export type SqlParam = string | number | boolean | null;

export type DatabaseQueryResultRow = any;

export interface DatabaseExecuteResult<T = DatabaseQueryResultRow> {
    rows: DatabaseRows<T>;
    rowsAffected: number;
    insertId?: number;
}

export interface DatabaseHealthReport {
    isReady: boolean;
    missingTables: string[];
    coreDataPresent: boolean;
}

export class DatabaseRows<T = DatabaseQueryResultRow> {
    constructor(private readonly values: T[]) { }

    get length(): number {
        return this.values.length;
    }

    item(index: number): T {
        return this.values[index];
    }
}

export class DatabaseConnection {
    constructor(public readonly connection: SQLiteDBConnection) { }

    async executeSql<T = DatabaseQueryResultRow>(
        statement: string,
        params: SqlParam[] = []
    ): Promise<DatabaseExecuteResult<T>> {
        const sql = statement.trim();
        const isReadQuery = /^(select|pragma|with)\b/i.test(sql);

        if (isReadQuery) {
            const result = await this.connection.query(sql, params);
            const values = (result.values ?? []) as T[];

            return {
                rows: new DatabaseRows(values),
                rowsAffected: 0,
                insertId: undefined,
            };
        }

        const result = await this.connection.run(sql, params);

        return {
            rows: new DatabaseRows<T>([]),
            rowsAffected: result.changes?.changes ?? 0,
            insertId: result.changes?.lastId,
        };
    }
}

@Injectable({
    providedIn: 'root',
})
export class DatabaseService {
    private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
    private readonly openedConnections = new Map<string, SQLiteDBConnection>();
    private readonly pendingConnections = new Map<string, Promise<SQLiteDBConnection>>();
    private readonly pendingOpenOperations = new Map<string, Promise<void>>();
    private prebuiltCopyPromise?: Promise<void>;

    private logger = inject(LoggerService);

    async create(options: { name: string; location?: string }): Promise<DatabaseConnection> {
        await this.ensurePrebuiltDatabaseCopied();

        const dbName = options.name;

        let connection = this.openedConnections.get(dbName);
        if (!connection) {
            let pendingConnection = this.pendingConnections.get(dbName);
            if (!pendingConnection) {
                pendingConnection = (async () => {
                    const hasConnection = await this.sqlite.isConnection(dbName, false);
                    if (hasConnection.result) {
                        return this.sqlite.retrieveConnection(dbName, false);
                    }

                    return this.sqlite.createConnection(
                        dbName,
                        false,
                        'no-encryption',
                        1,
                        false
                    );
                })();

                this.pendingConnections.set(dbName, pendingConnection);
            }

            try {
                connection = await pendingConnection;
            } finally {
                this.pendingConnections.delete(dbName);
            }
            this.openedConnections.set(dbName, connection);
        }

        const isOpen = await connection.isDBOpen();
        if (!isOpen.result) {
            let pendingOpen = this.pendingOpenOperations.get(dbName);
            if (!pendingOpen) {
                pendingOpen = (async () => {
                    const recheck = await connection.isDBOpen();
                    if (!recheck.result) {
                        await connection.open();
                    }
                })();

                this.pendingOpenOperations.set(dbName, pendingOpen);
            }

            try {
                await pendingOpen;
            } finally {
                this.pendingOpenOperations.delete(dbName);
            }
        }

        return new DatabaseConnection(connection);
    }

    private async ensurePrebuiltDatabaseCopied(): Promise<void> {
        if (!this.prebuiltCopyPromise) {
            this.prebuiltCopyPromise = (async () => {
                try {
                    const sqliteAny = this.sqlite as any;
                    if (typeof sqliteAny.copyFromAssets === 'function') {
                        await sqliteAny.copyFromAssets(false);
                    }
                } catch (error) {
                    // Ignore copy failures and fall back to runtime import path.
                    this.logger.warn('Prebuilt database copy skipped:', error);
                }
            })();
        }

        await this.prebuiltCopyPromise;
    }

    async verifyCoreSchema(connection: DatabaseConnection): Promise<DatabaseHealthReport> {
        const requiredTables = ['config', 'bibles', 'vers', 'versefilled', 'fonts'];
        const missingTables: string[] = [];

        for (const tableName of requiredTables) {
            const tableCheck = await connection.executeSql<{ count: number }>(
                "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?",
                [tableName]
            );

            const exists = (tableCheck.rows.item(0)?.count ?? 0) > 0;
            if (!exists) {
                missingTables.push(tableName);
            }
        }

        let coreDataPresent = false;
        if (missingTables.length === 0) {
            const biblesCount = await connection.executeSql<{ count: number }>(
                'SELECT COUNT(*) as count FROM bibles',
                []
            );
            coreDataPresent = (biblesCount.rows.item(0)?.count ?? 0) > 0;
        }

        return {
            isReady: missingTables.length === 0,
            missingTables,
            coreDataPresent,
        };
    }
}
