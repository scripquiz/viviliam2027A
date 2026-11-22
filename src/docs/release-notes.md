# Release Notes

## November 21, 2026

### Fixed: Audio Skipping Issue on Slow Internet

- **Issue:** Daily audio section occasionally skipped to the next track in the middle of playback when internet connection was slow.

- **Root Cause:** The audio completion detection relied on a time-based threshold (`duration - 0.5`) which would trigger prematurely when network issues caused the audio duration to jump mid-playback.

- **Fix Applied:**
  1. Removed unreliable time-based threshold check for audio completion detection
  2. Added buffer validation in `handleAudioEnded()` to verify playback actually completed before advancing to next track
  3. Used native HTML5 Audio `ended` event as the primary signal for audio completion
  4. If buffer is incomplete after audio ends, code now re-triggers playback from current position instead of skipping

- **Testing:** APK rebuilt and tested with network throttling - fix confirmed working.

### Files Changed

- `src/app/home/home.page.ts` - Audio playback logic improvements (33 insertions, 8 deletions)
