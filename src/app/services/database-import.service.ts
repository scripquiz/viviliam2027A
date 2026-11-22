import { Injectable } from '@angular/core';
import { DatabaseConnection } from 'src/app/services/database.service';

type InsertRows = Record<string, unknown>[];
type InsertMap = Record<string, InsertRows>;

interface DatabaseImportPayload {
    data: {
        inserts: InsertMap;
    };
}

interface ExecuteSetStatement {
    statement: string;
    values: unknown[];
}

interface ImportResult {
    changes: {
        changes: number;
    };
}

interface ImportProgress {
    processedRows: number;
    totalRows: number;
    ratio: number;
}

@Injectable({
    providedIn: 'root',
})
export class DatabaseImportService {
    async importJsonToDb(
        database: DatabaseConnection,
        jsonData: unknown,
        onProgress?: (progress: ImportProgress) => void
    ): Promise<ImportResult> {
        const inserts = this.getInserts(jsonData);
        const totalRows = Object.values(inserts).reduce((sum, rows) => sum + rows.length, 0);

        let totalChanges = 0;
        let processedRows = 0;

        for (const [tableName, tableRows] of Object.entries(inserts)) {
            if (!Array.isArray(tableRows) || tableRows.length === 0) {
                continue;
            }

            const setChunks = this.buildInsertChunks(tableName, tableRows);

            for (const chunk of setChunks) {
                totalChanges += await this.executeChunkFastWithFallback(database, chunk, tableName);
                processedRows += chunk.length;

                if (onProgress && totalRows > 0) {
                    onProgress({
                        processedRows,
                        totalRows,
                        ratio: Math.min(processedRows / totalRows, 1),
                    });
                }
            }
        }

        return { changes: { changes: totalChanges } };
    }

    private async executeChunkFastWithFallback(
        database: DatabaseConnection,
        chunk: ExecuteSetStatement[],
        tableName: string
    ): Promise<number> {
        try {
            const result = await this.executeSetWithRetry(database, chunk);
            return result.changes?.changes ?? chunk.length;
        } catch {
            // Fallback keeps initialization robust on devices where batch mode is unstable.
            return this.executeChunkIndividually(database, chunk, tableName);
        }
    }

    private getInserts(jsonData: unknown): InsertMap {
        const payload = jsonData as DatabaseImportPayload;
        const inserts = payload?.data?.inserts;

        if (!inserts || typeof inserts !== 'object') {
            throw new Error('Invalid JSON import format. Expected data.inserts object.');
        }

        return inserts;
    }

    private buildInsertChunks(tableName: string, rows: InsertRows): ExecuteSetStatement[][] {
        const chunkSize = 400;
        const firstRow = rows[0];
        const columns = Object.keys(firstRow);

        if (columns.length === 0) {
            return [];
        }

        const columnList = columns.map((column) => `"${column}"`).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const statement = `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`;

        const sets: ExecuteSetStatement[][] = [];

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunkRows = rows.slice(i, i + chunkSize);
            const chunkSet = chunkRows.map((row) => ({
                statement,
                values: columns.map((column) => row[column] ?? null),
            }));
            sets.push(chunkSet);
        }

        return sets;
    }

    private async executeChunkIndividually(
        database: DatabaseConnection,
        chunk: ExecuteSetStatement[],
        tableName: string
    ): Promise<number> {
        let rowChanges = 0;

        for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
            const rowStatement = chunk[rowIndex];
            try {
                const result = await this.executeSqlWithRetry(
                    database,
                    rowStatement.statement,
                    rowStatement.values as any[]
                );
                rowChanges += result.rowsAffected;
            } catch (rowError) {
                const rowMessage = this.errorMessage(rowError);
                throw new Error(
                    `Import failed for table ${tableName} at row ${rowIndex + 1}/${chunk.length}. ` +
                    `statement=${rowStatement.statement}. values=${JSON.stringify(rowStatement.values)}. error=${rowMessage}`
                );
            }
        }

        return rowChanges;
    }

    private async executeSqlWithRetry(
        database: DatabaseConnection,
        statement: string,
        values: any[]
    ) {
        const maxAttempts = 5;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await database.executeSql(statement, values);
            } catch (error) {
                const message = this.errorMessage(error).toLowerCase();
                const isLockError =
                    message.includes('locked') ||
                    message.includes('busy') ||
                    message.includes('sqlit_busy');

                if (!isLockError || attempt === maxAttempts) {
                    throw error;
                }

                await this.sleep(attempt * 80);
            }
        }

        throw new Error('Unexpected retry loop exit.');
    }

    private async executeSetWithRetry(
        database: DatabaseConnection,
        chunk: ExecuteSetStatement[]
    ) {
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await database.connection.executeSet(chunk, false);
            } catch (error) {
                const message = this.errorMessage(error).toLowerCase();
                const isLockError =
                    message.includes('locked') ||
                    message.includes('busy') ||
                    message.includes('sqlit_busy');

                if (!isLockError || attempt === maxAttempts) {
                    throw error;
                }

                await this.sleep(attempt * 60);
            }
        }

        throw new Error('Unexpected executeSet retry loop exit.');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private errorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }
}
