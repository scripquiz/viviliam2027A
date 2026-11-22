import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';

/**
 * Interface for cached audio file metadata
 */
export interface CachedItem {
  url: string;          // Cache key/URL identifier
  path: string;         // Filesystem path
  size?: number;        // File size in bytes (from Content-Length header or stat)
  lastModified?: number; // Last modified timestamp (Unix epoch ms)
  etag?: string;        // ETag from HTTP headers if available
}

@Injectable({
  providedIn: 'root',
})
export class AudioCacheService {
  private readonly CACHE_DIR = 'viviliam_audio_cache';
  private readonly METADATA_FILE = 'cache-metadata.json';
  private readonly CACHE_VERSION = '1.0';

  // Storage configuration
  private readonly MAX_STORAGE_MB = 100; // ~10% of typical Android storage
  private readonly STORAGE_WARNING_THRESHOLD_MB = 80; // Warn when at 80% of limit
  private readonly DOWNLOAD_RETRY_LIMIT = 3;
  private readonly MIN_BUFFER_TIME_MS = 5 * 60 * 1000; // 5 minutes before considering cache invalid

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) {
    // Initialize cache directory when app is ready
    this.platform.ready().then(() => {
      this.initCacheDirectories();
    });
  }

  /**
   * Initialize cache directories in Capacitor filesystem
   */
  private async initCacheDirectories(): Promise<void> {
    try {
      // Create cache directory at root of Data filesystem
      await Filesystem.mkdir({
        path: `/${this.CACHE_DIR}`,
        recursive: true,
      });

      const metadataPath = `/${this.METADATA_FILE}`;

      // Create metadata file if it doesn't exist (at root of Data)
      try {
        await Filesystem.readFile({ path: metadataPath });
      } catch (e) {
        // File doesn't exist, create it
        const initialData = JSON.stringify({
          version: this.CACHE_VERSION,
          lastUpdated: Date.now(),
          cachedItems: {},
        });
        await Filesystem.writeFile({
          path: metadataPath,
          data: initialData,
        });
      }

      console.log('AudioCacheService: Cache directories initialized');
    } catch (error) {
      console.error('AudioCacheService: Failed to initialize cache:', error);
    }
  }

  /**
   * Get the audio file from filesystem cache
   */
  async getFromCache(cacheKey: string): Promise<{ url: string; path?: string } | null> {
    try {
      // Check if we have metadata for this item
      const metadata = await this.loadMetadata();
      if (!metadata.cachedItems[cacheKey]) {
        return null;
      }

      const cachedInfo = metadata.cachedItems[cacheKey];

      // Verify the cached file still exists using stat
      const fileInfo = await Filesystem.stat({ path: cachedInfo.path });

      if (!fileInfo || fileInfo.size === 0) {
        console.warn('AudioCacheService: Cached file missing, will reload:', cacheKey);
        return null;
      }

      // Optional: Verify content hash if stored
      if (cachedInfo.etag && fileInfo.mtime) {
        const mtime = new Date(fileInfo.mtime).getTime() / 1000;
        if (Date.now() - mtime < this.MIN_BUFFER_TIME_MS) {
          // Cache still valid
          return { url: cachedInfo.path };
        } else {
          console.warn('AudioCacheService: File timestamp suggests modification, will refresh:', cacheKey);
        }
      }

      return { url: cachedInfo.path };
    } catch (error) {
      console.error('AudioCacheService: Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Download and cache an audio file
   */
  async downloadAndCache(
    cacheKey: string,
    url: string,
    filename?: string
  ): Promise<{ url: string; path: string } | null> {
    let localPath = '';

    try {
      // Check and evict oldest files before downloading if storage is running low
      await this.checkAndEvictIfNeeded();

      const cacheDirPath = `${this.CACHE_DIR}/${cacheKey}`;
      // Create unique filename within cache directory
      localPath = `${this.CACHE_DIR}/${cacheKey}/${filename || Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;

      // Download the file as blob first, then write to filesystem
      const response = await this.http.get(url, { responseType: 'blob' });

      if (response instanceof Blob) {
        // Get the directory path for the file
        const dirPath = localPath.substring(0, localPath.lastIndexOf('/') + 1);

        // Create directory if needed
        await Filesystem.mkdir({
          path: dirPath,
          recursive: true,
        });

        // Write file to filesystem
        await Filesystem.writeFile({
          path: localPath,
          data: response,
        });

        console.log('AudioCacheService: Cached audio:', cacheKey);

        return { url: localPath, path: localPath };
      } else {
        console.error('AudioCacheService: Failed to download audio:', cacheKey);
        return null;
      }
    } catch (error) {
      console.error('AudioCacheService: Error caching audio:', error);

      // Cleanup partial files on failure if they exist
      try {
        // Use empty string as fallback since localPath might be undefined after failed write
        const dirPath = localPath || '';
        if (dirPath) {
          await Filesystem.deleteFile({
            path: `${dirPath}${filename || Date.now()}-${Math.random().toString(36).substring(7)}.mp3`,
            directory: Directory.Data,
          }).catch(() => {}); // Ignore delete errors
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      return null;
    } finally {
      // Always save current metadata state in finally for consistency
      try {
        const metadata = await this.loadMetadata();
        const cachedItems = Object.values(metadata.cachedItems);
        const totalSizeBytes = cachedItems.reduce((total, item) => total + (item.size || 0), 0);

        if (totalSizeBytes / (1024 * 1024) >= this.STORAGE_WARNING_THRESHOLD_MB) {
          console.warn(
            `AudioCacheService: Storage warning - ${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB used (${((totalSizeBytes / (1024 * 1024) / this.MAX_STORAGE_MB) * 100).toFixed(0)}% of limit)`
          );
        }
      } catch (e) {
        // Ignore errors in finally block
      }
    }
  }

  private _lastFileSizeHint = 0;

  /**
   * Get file size hint from HTTP headers using blob to capture headers during download
   */
  private async getFileSizeHint(url: string): Promise<{ size?: number }> {
    try {
      // Use a single request that captures the response header via tap
      const observable$ = this.http.get(url, { observe: 'response', responseType: 'blob' });

      // Subscribe to capture headers and return as promise
      await new Promise<void>((resolve) => {
        observable$.subscribe({
          next: (response: any) => {
            const contentLengthHeader = response.headers.get('Content-Length');
            if (contentLengthHeader) {
              this._lastFileSizeHint = parseInt(contentLengthHeader, 10);
            }
            resolve();
          },
          error: () => resolve(),
        });
      });

      return { size: this._lastFileSizeHint };
    } catch (error) {
      console.warn('AudioCacheService: Could not get file size:', error);
      return {};
    }
  }

  /**
   * Load metadata from filesystem
   */
  private async loadMetadata(): Promise<{ version: string; cachedItems: Record<string, CachedItem>; lastUpdated?: number }> {
    try {
      const metadataPath = `/${this.METADATA_FILE}`;
      const readFileResult = await Filesystem.readFile({ path: metadataPath });

      // Handle different return types from Capacitor
      let contentText: string;
      if (typeof readFileResult.data === 'string') {
        contentText = readFileResult.data;
      } else if (readFileResult.data instanceof Uint8Array) {
        contentText = new TextDecoder().decode(readFileResult.data);
      } else if (readFileResult.data instanceof ArrayBuffer) {
        contentText = new TextDecoder().decode(new Uint8Array(readFileResult.data));
      } else if (typeof readFileResult.data === 'object') {
        // Handle Blob type properly - convert to ArrayBuffer first
        const blobData = readFileResult.data;
        if ('arrayBuffer' in blobData) {
          // Blob has arrayBuffer method, use it
          const abPromise: Promise<ArrayBuffer> = (blobData as any).arrayBuffer();
          contentText = new TextDecoder().decode(new Uint8Array(await abPromise));
        } else {
          // Fallback for other object types
          try {
            const buffer = JSON.parse(readFileResult.data.toString()) as { arrayBuffer: () => ArrayBuffer };
            contentText = new TextDecoder().decode(new Uint8Array(await buffer.arrayBuffer()));
          } catch {
            contentText = '';
          }
        }
      } else {
        contentText = '';
      }

      const metadata = JSON.parse(contentText) as Record<string, any>;

      // Properly type and validate cachedItems using bracket notation for index signature access
      const typedCachedItems: Record<string, CachedItem> = {};
      if (metadata['cachedItems']) {
        for (const [key, value] of Object.entries(metadata['cachedItems'] || {})) {
          if (typeof value === 'object' && value !== null) {
            typedCachedItems[key] = {
              url: (value as any)['url'] || '',
              path: (value as any)['path'] || '',
              size: typeof (value as any)['size'] === 'number' ? (value as any)['size'] : undefined,
              lastModified: typeof (value as any)['lastModified'] === 'number' ? (value as any)['lastModified'] : undefined,
              etag: typeof (value as any)['etag'] === 'string' ? (value as any)['etag'] : undefined,
            };
          }
        }
      }

      return {
        version: metadata['version'] || this.CACHE_VERSION,
        cachedItems: typedCachedItems,
        lastUpdated: metadata['lastUpdated'],
      };
    } catch (error) {
      console.error('AudioCacheService: Error loading metadata:', error);
      return { version: this.CACHE_VERSION, cachedItems: {} };
    }
  }

  /**
   * Save/update metadata
   */
  private async saveMetadata(cachedItems: Record<string, any>): Promise<void> {
    try {
      const currentMetadata = await this.loadMetadata();

      // Merge new items with existing
      currentMetadata.cachedItems = {
        ...currentMetadata.cachedItems,
        ...cachedItems,
      };
      currentMetadata.lastUpdated = Date.now();

      const metadataPath = `/${this.METADATA_FILE}`;
      await Filesystem.writeFile({
        path: metadataPath,
        data: JSON.stringify(currentMetadata),
      });
    } catch (error) {
      console.error('AudioCacheService: Error saving metadata:', error);
    }
  }

  /**
   * Delete cached item
   */
  async deleteCachedItem(cacheKey: string): Promise<void> {
    try {
      const metadata = await this.loadMetadata();

      // Check if item exists in cache
      if (!metadata.cachedItems[cacheKey]) {
        return; // Item not found
      }

      const cachedInfo = metadata.cachedItems[cacheKey];
      const pathToDelete = cachedInfo.path;

      // Remove file from filesystem
      await Filesystem.deleteFile({ path: pathToDelete });

      // Update metadata
      delete metadata.cachedItems[cacheKey];
      await this.saveMetadata(metadata.cachedItems);

      console.log('AudioCacheService: Deleted cached item:', cacheKey);
    } catch (error) {
      console.error('AudioCacheService: Error deleting cached item:', error);
    }
  }

  /**
   * Check if eviction is needed and evict if at threshold
   */
  private async checkAndEvictIfNeeded(): Promise<void> {
    try {
      // Load metadata to get current cache usage
      const metadata = await this.loadMetadata();
      const cachedItems = Object.values(metadata.cachedItems);

      let totalSizeBytes = 0;
      for (const item of cachedItems) {
        totalSizeBytes += item.size || 0;
      }

      // Calculate used MB
      const usedMB = totalSizeBytes / (1024 * 1024);

      console.log(
        'AudioCacheService: Storage check',
        `${usedMB.toFixed(2)} MB used of ${this.MAX_STORAGE_MB} MB limit`
      );

      // Warn at 80% and evict at 90% of max limit
      if (usedMB >= this.MAX_STORAGE_MB * 0.8) {
        console.warn(
          `AudioCacheService: Storage warning - ${usedMB.toFixed(1)} MB used (${((usedMB / this.MAX_STORAGE_MB) * 100).toFixed(0)}% of limit), consider evicting soon`
        );

        // Proactively trigger eviction at 85% to stay under warning threshold
        if (usedMB >= this.MAX_STORAGE_MB * 0.85) {
          console.warn('AudioCacheService: Storage at 85%, triggering proactive eviction');
          await this.checkAndEvictOldest();
        }
      }
    } catch (error) {
      console.error('AudioCacheService: Error checking storage:', error);
    }
  }

  /**
   * Check and evict oldest files when storage is full
   */
  async checkAndEvictOldest(): Promise<number> {
    try {
      const metadata = await this.loadMetadata();
      const cachedItems = Object.values(metadata.cachedItems);

      // Sort by lastModified (oldest first)
      cachedItems.sort((a, b) =>
        (a.lastModified || 0) - (b.lastModified || 0)
      );

      // Evict oldest 10% of items or ~5 MB worth
      const evictCount = Math.max(
        Math.ceil(cachedItems.length * 0.1),
        cachedItems.reduce((total, item) => total + (item.size || 500000), 0) / 500 // ~500MB per item average
      );

      let freedBytes = 0;

      for (let i = 0; i < evictCount && i < cachedItems.length; i++) {
        const item = cachedItems[i];
        await this.deleteCachedItem(item.url);
        freedBytes += item.size || 500000; // Use actual stored size
      }

      console.log('AudioCacheService: Evicted oldest files, freed ~', (freedBytes / (1024 * 1024)).toFixed(2), 'MB');
      return evictCount;
    } catch (error) {
      console.error('AudioCacheService: Error checking storage:', error);
      return 0;
    }
  }

  /**
   * Clear all cached audio files
   */
  async clearAllCache(): Promise<void> {
    try {
      // Delete the metadata file from root
      await Filesystem.deleteFile({ path: `/${this.METADATA_FILE}` });
    } catch (error) {
      console.error('AudioCacheService: Error clearing cache:', error);
    }
  }

  /**
   * Get storage usage percentage as a computed value for UI display
   */
  async getStorageUsagePercentage(): Promise<number> {
    try {
      const metadata = await this.loadMetadata();
      const cachedItems = Object.values(metadata.cachedItems);

      let totalSizeBytes = 0;
      for (const item of cachedItems) {
        totalSizeBytes += item.size || 0;
      }

      const usedMB = totalSizeBytes / (1024 * 1024);
      const percentage = (usedMB / this.MAX_STORAGE_MB) * 100;
      return Math.min(percentage, 100); // Cap at 100%
    } catch (error) {
      console.error('AudioCacheService: Error getting storage usage:', error);
      return 0;
    }
  }

  /**
   * Get formatted storage information for UI display
   */
  async getStorageInfo(): Promise<{
    totalSizeMB: number;
    freeSpaceMB: number;
    usedSizeMB: number;
    usagePercentage: number;
    warningLevelReached: boolean;
    evictionLevelReached: boolean;
  }> {
    try {
      const metadata = await this.loadMetadata();
      const cachedItems = Object.values(metadata.cachedItems);

      let totalSizeBytes = 0;
      for (const item of cachedItems) {
        totalSizeBytes += item.size || 0;
      }

      const totalSizeMB = Math.max(this.MAX_STORAGE_MB, totalSizeBytes / (1024 * 1024));
      const usedSizeMB = totalSizeBytes / (1024 * 1024);
      const usagePercentage = (usedSizeMB / totalSizeMB) * 100;

      return {
        totalSizeMB: Math.round(totalSizeMB),
        freeSpaceMB: Math.max(0, this.MAX_STORAGE_MB - usedSizeMB),
        usedSizeMB: Math.round(usedSizeMB),
        usagePercentage: Math.min(usagePercentage, 100),
        warningLevelReached: usedSizeMB >= this.STORAGE_WARNING_THRESHOLD_MB,
        evictionLevelReached: usedSizeMB >= this.MAX_STORAGE_MB * 0.9,
      };
    } catch (error) {
      console.error('AudioCacheService: Error getting storage info:', error);
      return {
        totalSizeMB: this.MAX_STORAGE_MB,
        freeSpaceMB: Math.max(0, this.MAX_STORAGE_MB),
        usedSizeMB: 0,
        usagePercentage: 0,
        warningLevelReached: false,
        evictionLevelReached: false,
      };
    }
  }

  /**
   * Clear all cached audio files - returns cache stats
   */
  async clearAllCacheStats(): Promise<{
    totalItems: number;
    cachedItemSizeMB: number;
    storageUsedMB: number;
  }> {
    try {
      const metadata = await this.loadMetadata();
      const cachedItems = Object.values(metadata.cachedItems);

      let totalSize = 0;
      for (const item of cachedItems) {
        // Use actual file size tracked in metadata
        totalSize += item.size || 0;
      }

      return {
        totalItems: cachedItems.length,
        cachedItemSizeMB: Math.floor(totalSize / (1024 * 1024)),
        storageUsedMB: Math.floor(totalSize / (1024 * 1024)),
      };
    } catch (error) {
      console.error('AudioCacheService: Error getting cache stats:', error);
      return { totalItems: 0, cachedItemSizeMB: 0, storageUsedMB: 0 };
    }
  }

  /**
   * Validate that all cached items are accessible
   */
  async validateAllCachedItems(): Promise<{ valid: boolean; invalidKeys: string[] }> {
    const metadata = await this.loadMetadata();
    const invalidKeys: string[] = [];

    for (const [key, info] of Object.entries(metadata.cachedItems)) {
      try {
        // Check if file exists using stat
        const fileInfo = await Filesystem.stat({ path: info.path });

        if (!fileInfo || fileInfo.size === 0) {
          // File doesn't exist locally
          invalidKeys.push(key);
        } else if (info.etag && fileInfo.mtime) {
          // File exists but may have changed on server
          const mtime = new Date(fileInfo.mtime).getTime() / 1000;
          if (Date.now() - mtime > this.MIN_BUFFER_TIME_MS) {
            invalidKeys.push(key);
          }
        }
      } catch (error) {
        invalidKeys.push(key);
      }
    }

    return {
      valid: invalidKeys.length === 0,
      invalidKeys,
    };
  }
}
