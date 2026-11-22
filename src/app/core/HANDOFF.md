# Audio Cache Implementation Review - Summary & Recommendations

## Current Implementation Overview

The home page (`home.page.ts`) implements a two-tier caching system:

### Tier 1: Capacitor Filesystem Cache (via AudioCacheService)
- **Primary cache**: Uses Capacitor filesystem at `viviliam_audio_cache/`
- **Metadata**: JSON file tracks cached items with URLs, paths, and timestamps
- **Methods available**: 
  - `getFromCache(cacheKey)` - retrieve from cache
  - `downloadAndCache(cacheKey, url, filename)` - download and store
  - `deleteCachedItem(cacheKey)` - remove from cache
  - `checkAndEvictOldest()` - cleanup when storage is full

### Tier 2: localStorage Fallback
- **Fallback cache**: Simple JSON in localStorage with `{content, cacheDate}` structure
- **Used when**: Capacitor filesystem not available or for simpler caching

## Issues Identified

### 🐛 Issue 1: Cache Key Structure Mismatch (HIGH PRIORITY)
**Location**: `audio-cache.service.ts` line 121 vs `home.page.ts` usage
- The service stores files at: `${this.CACHE_DIR}/${cacheKey}/filename`
- Metadata tracks path as relative (e.g., `"viviliam_audio_cache/2026-11-21/song.mp3"`)
- Capacitor's `FileSystem.getInfo()` returns the full path, which works correctly

**Risk**: None critical, but the path structure could be confusing for debugging.

### ⚠️ Issue 2: Eviction Never Triggered (MEDIUM PRIORITY)
**Location**: No calls to `checkAndEvictOldest()` in the codebase
- The service has logic to evict oldest files when storage reaches 90% of 100MB limit
- But `checkAndEvictOldest()` is never called anywhere
- **Result**: Cache will fill up and stop accepting new items

**Fix needed**: Add calls to `checkAndEvictOldest()` after each download OR before `downloadAndCache()`

### ⚠️ Issue 3: Missing Storage Monitoring (MEDIUM PRIORITY)
- After downloading files, storage space is checked BEFORE download (line 124-137)
- But there's no monitoring of actual used space over time
- No notification when cache is approaching limits

**Fix needed**: 
- Add periodic check for storage usage (e.g., in `checkAndEvictOldest()`)
- Optionally add a notification or warning when cache is >80% full

### 📝 Issue 4: File Size Tracking Incomplete (LOW PRIORITY)
**Location**: `getCacheStats()` line 363-368
- Estimates file size based on timestamp pattern, not actual file info
- Metadata doesn't store actual file sizes
- This leads to inaccurate cache statistics

**Fix needed**: Store actual file sizes in metadata when downloading:
```typescript
const fileInfo = await FileSystem.getInfo({ path: localPath });
const fileSize = fileInfo.size || 0; // Add to metadata
```

### 🛡️ Issue 5: Error Recovery Could Be Better (LOW PRIORITY)
**Location**: `downloadAndCache()` catch block line 177-181
- On error, only logs and returns null without cleanup
- If partial writes occurred, corrupted data remains in filesystem

**Fix needed**: Add transactional wrapping or cleanup on failure:
```typescript
try {
  // Download...
  await this.saveMetadata({ [cacheKey]: {...} });
} catch (error) {
  console.error('Error caching audio:', error);
  // Cleanup partial files if they exist
  try {
    await FileSystem.deleteFile({ path: localPath });
  } catch {}
} finally {
  await this.saveMetadata(cachedItems); // Always save current state
}
```

## Recommended Fixes (Priority Order)

1. **Add eviction call** - Hook into `downloadAndCache()` to trigger eviction check if needed
2. **Track actual file sizes** - Store and return size from `FileSystem.getInfo()` in metadata
3. **Improve error handling** - Add rollback on partial failures
4. **Add storage monitoring** - Consider periodic cleanup checks or a manual clear option

## Testing Recommendations

- Test cache persistence across app restarts
- Test eviction logic with large number of cached files
- Test localStorage fallback on webview without filesystem support
- Test recovery from corrupted metadata file

---

*Generated during implementation review session*
Co-Authored-By: Claude Code <noreply@anthropic.com>
