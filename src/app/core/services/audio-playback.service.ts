import { Injectable, NgZone } from '@angular/core';
import { WakeLockService } from '../../services/wake-lock.service';
import { AudioFocusService } from '../../services/audio-focus.service';
import { LoggerService } from '../../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AudioPlaybackService {
  // Expose as public observable properties for direct mutation
  public currentAudioIndex: number = -1;
  public audioPlaying: boolean = false;
  public playAll: boolean = false;
  public repeatStateAll: number = 0;
  public repeatPlayedCountAll: number = 0;

  constructor(
    private wakeLockService: WakeLockService,
    private audioFocusService: AudioFocusService,
    private logger: LoggerService,
    private ngZone: NgZone
  ) {}

  setAudioPlaying(value: boolean) { this.audioPlaying = value; }
  setPlayAll(value: boolean) { this.playAll = value; }
  setCurrentAudioIndex(index: number) { this.currentAudioIndex = index; }
  setRepeatStateAll(value: number) { this.repeatStateAll = value; }
  setRepeatPlayedCountAll(value: number) { this.repeatPlayedCountAll = value; }

  async startAudioDirect(
    idx: number,
    audioElement: any,
    todayAudioFiles: any[]
  ): Promise<void> {
    this.audioFocusService.requestFocus('home');

    // Stop previous track only when NOT in Play All mode (Play All handles transitions via handleAudioEnded)
    if (this.audioPlaying && !this.playAll) {
      await this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
    }

    this.currentAudioIndex = idx;

    // ✅ FIX ISSUE #4: Expose current audio URL for template binding
    const currentAudioUrl = todayAudioFiles[idx]?.url || '';

    // Log URL for debugging - should contain full API path like: /assets/audio/files/2025-11/...
    this.logger.log(`Setting audio source: ${currentAudioUrl}`);

    // Reset all items to pause state first (preserve per-item repeat for individual playback)
    for (let i = 0; i < todayAudioFiles.length; i++) {
      todayAudioFiles[i].state = 'pause';
    }

    // Enable repeat state if this track is in repeat mode
    const trackRepeatState = todayAudioFiles[idx]?.repeat_state;
    todayAudioFiles[idx].state = 'play';

    // Handle wake lock properly - await and log result without suppressing errors
    try {
      await this.wakeLockService.keepAwake();
      this.logger.log('Wake lock acquired for audio playback');
    } catch (error) {
      this.logger.error('Wake lock acquisition failed:', error);
      // Continue anyway - audio can play even without wake lock
    }

    // ✅ FIX: Check if audioElement has valid HTMLMediaElement properties first
    if (!audioElement || typeof audioElement.pause !== 'function' || typeof audioElement.play !== 'function') {
      this.logger.error('Invalid audio element passed to startAudioDirect');
      console.log('audioElement:', audioElement);
      console.log('Has pause method:', typeof audioElement.pause === 'function');
      console.log('Has play method:', typeof audioElement.play === 'function');
      return;
    }

    audioElement.preload = 'auto';
    audioElement.src = todayAudioFiles[idx].url;
    audioElement.load();

    const canPlay = new Promise<void>((resolve) => {
      const onCanPlay = () => {
        audioElement.removeEventListener('canplaythrough', onCanPlay);
        resolve();
      };
      audioElement.addEventListener('canplaythrough', onCanPlay, { once: true });
    });

    const readyTimeout = new Promise<void>((resolve) => {
      setTimeout(resolve, 2000);
    });

    await Promise.race([canPlay, readyTimeout]);

    audioElement.onloadedmetadata = () => {
      const actualDuration = audioElement.duration;
      // Only update duration if not already set (preserve API-sourced values)
      if (!todayAudioFiles[idx].duration || isNaN(todayAudioFiles[idx].duration)) {
        todayAudioFiles[idx].duration = actualDuration;
        todayAudioFiles[idx].durationintime = this.convertHMS(
          Math.floor(actualDuration)
        );
      }
    };

    audioElement.currentTime = todayAudioFiles[idx].ctime;

    // ✅ FIX: Only set currentTime if audio element has duration (valid metadata loaded)
    const audioHasDuration = typeof audioElement.duration === 'number' && audioElement.duration > 0;
    if (audioHasDuration && !isNaN(todayAudioFiles[idx].ctime)) {
      audioElement.currentTime = todayAudioFiles[idx].ctime;
    }

    try {
      await audioElement.play();
    } catch (error: any) {
      this.logger.error('Error starting audio playback:', error);
      console.log('play() error:', error.message);
    }

    this.audioPlaying = true;
    this.wakeLockService.resetActivity();

    // Store the known duration for fallback detection
    const knownDuration = todayAudioFiles[idx]?.duration || audioElement.duration || 0;

    // ✅ FIX: Duration-based timeout as fallback for Capacitor WebView where 'ended' may not fire
    const PLAY_END_THRESHOLD_MS = 1500; // Consider ended if time is within 1.5s of end or past end

    let completionChecked = false;

    const durationFallback = () => {
      if (completionChecked) return;

      const currentTime = audioElement.currentTime;
      const actualDuration = audioElement.duration || knownDuration;
      const timeRemaining = actualDuration - currentTime;

      // Fire if: past end, or within threshold of end AND playing/paused
      const isPastEnd = timeRemaining <= 0;
      const isNearEnd = timeRemaining > 0 && timeRemaining <= (PLAY_END_THRESHOLD_MS / 1000);
      const isPlayingOrPaused = audioElement.readyState >= 2; // HAVE_CURRENT_DATA

      if ((isPastEnd || isNearEnd) && isPlayingOrPaused) {
        completionChecked = true;
        this.logger.log(`Duration-based completion detected for track ${idx}: currentTime=${currentTime.toFixed(1)}, duration=${actualDuration.toFixed(1)}`);
        this.ngZone.run(() => this.handleAudioEnded(audioElement, todayAudioFiles));
      }
    };

    // Set up the 'ended' event listener (primary mechanism)
    let endedFired = false;
    audioElement.addEventListener('ended', () => {
      if (endedFired) return;
      endedFired = true;
      completionChecked = true;
      this.ngZone.run(() => this.handleAudioEnded(audioElement, todayAudioFiles));
    }, { once: true });

    // Duration-based fallback timer — fires when playback should be complete
    const durationCheckInterval = setInterval(() => {
      if (completionChecked) {
        clearInterval(durationCheckInterval);
        return;
      }
      durationFallback();
    }, 500);

    // Cleanup interval after a safe window past expected end
    const safetyTimeout = setTimeout(() => {
      if (!completionChecked) {
        completionChecked = true;
        clearInterval(durationCheckInterval);
        this.logger.warn(`Safety timeout for track ${idx} — forcing ended`);
        this.ngZone.run(() => this.handleAudioEnded(audioElement, todayAudioFiles));
      }
    }, Math.max((knownDuration * 1000) + 3000, 15000)); // duration + 3s or at least 15s

    // Store cleanup refs for potential future use
    (audioElement as any).__endedFired = () => endedFired;
    (audioElement as any).__cleanupDuration = () => {
      clearInterval(durationCheckInterval);
      clearTimeout(safetyTimeout);
    };
  }

  async handleAudioEnded(
    audioElement: any,
    todayAudioFiles: any[]
  ): Promise<void> {
    // Reset states at the start of this handler - CRITICAL for preventing stuck loops
    const prevAudioPlaying = this.audioPlaying;
    const prevPlayAll = this.playAll;  // ✅ PRESERVE original playAll state before resetting

    // Clear playing state temporarily - will be re-established by subsequent logic
    this.audioPlaying = false;
    const activePlayAll = this.playAll;
    this.playAll = false;

    // In Play All mode, the 'ended' event confirms completion — don't block on buffer state
    let shouldAdvance = activePlayAll;
    const currentPos = audioElement.currentTime;

    if (!shouldAdvance) {
      const isBufferedComplete = audioElement.buffered && audioElement.buffered.length > 0;
      const bufferedEnd = isBufferedComplete ? audioElement.buffered.end(audioElement.buffered.length - 1) : null;

      // For individual playback: check buffer to avoid premature replay
      const BUFFER_TOLERANCE = 2;
      const nearEnd = audioElement.duration && (audioElement.duration - currentPos) <= BUFFER_TOLERANCE;
      shouldAdvance =
        !isBufferedComplete ||
        (nearEnd && (!bufferedEnd || bufferedEnd >= currentPos));

      if (!shouldAdvance) {
        this.logger.warn(
          `Audio ended but may not have completed playback fully. Buffer state: currentTime=${currentPos}, bufferedEnd=${bufferedEnd}, duration=${audioElement.duration}`
        );
        return; // Don't replay on incomplete buffer - let user control via UI
      }
    }

    todayAudioFiles[this.currentAudioIndex].ctime = 0;
    todayAudioFiles[this.currentAudioIndex].ctimeintime = '0:00';
    todayAudioFiles[this.currentAudioIndex].durationintime = this.convertHMS(
      parseInt(todayAudioFiles[this.currentAudioIndex].duration)
    );

    if (activePlayAll) {
      if (this.currentAudioIndex < todayAudioFiles.length - 1) {
        this.logger.log(`Moving to next track: ${this.currentAudioIndex + 1}`);
        this.currentAudioIndex++;
        await this.startAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
      } else {
        this.logger.log(`End of playlist reached. Repeat count: ${this.repeatPlayedCountAll}/${this.repeatStateAll}`);
        if (
          this.repeatStateAll > 0 &&
          this.repeatPlayedCountAll < this.repeatStateAll
        ) {
          this.repeatPlayedCountAll++;
          this.logger.log(`Starting repeat ${this.repeatPlayedCountAll}`);
          this.currentAudioIndex = 0;
          await this.startAudioDirect(0, audioElement, todayAudioFiles);
        } else {
          this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
        }
        // Restore Play All state — keep it active after user-initiated playlist completes
        this.playAll = true;
        this.audioPlaying = false;
        this.logger.log('End of playlist - keeping Play All mode');
      }
    } else if (todayAudioFiles[this.currentAudioIndex]?.repeat_state > 0) {
      const currentRepeatCount = todayAudioFiles[this.currentAudioIndex]?.repeat_played_count || 0;
      const targetRepeatCount = todayAudioFiles[this.currentAudioIndex]?.repeat_state || 0;

      if (currentRepeatCount < targetRepeatCount) {
        todayAudioFiles[this.currentAudioIndex].repeat_played_count = currentRepeatCount + 1;
        audioElement.currentTime = 0;

        // Handle wake lock properly - await and log result
        try {
          await this.wakeLockService.keepAwake();
          this.logger.log('Wake lock acquired for repeat playback');
        } catch (error) {
          this.logger.warn('Wake lock acquisition failed during repeat:', error);
        }

        this.wakeLockService.resetActivity();

        try {
          await audioElement.play();
          this.audioPlaying = true; // Set playing state for the repeated playback
        } catch (error: any) {
          this.logger.error('Error replaying audio:', error);
        }
      } else {
        this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
        todayAudioFiles[this.currentAudioIndex].repeat_state = 0;
        todayAudioFiles[this.currentAudioIndex].repeat_played_count = 0;
        this.logger.log('Repeat count reached, stopping playback');
      }
    } else {
      this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
      // NOTE: stopAudioDirect already sets audioPlaying=false and track state='pause'
      // No need to restore audioPlaying — the track finished normally without repeat
    }
  }

  async stopAudioDirect(
    idx: number,
    audioElement: HTMLAudioElement | null,
    todayAudioFiles: any[],
    resetPlayAll: boolean = true
  ): Promise<void> {
    // Pause the specific track
    todayAudioFiles[idx].state = 'pause';

    // Check if audioElement exists before calling pause
    if (audioElement && typeof audioElement.pause === 'function') {
      audioElement.pause();
    } else {
      this.logger.warn('stopAudioDirect: audioElement is not a valid HTMLAudioElement');
      console.log('audioElement type:', typeof audioElement);
      console.log('audioElement:', audioElement);
    }

    this.audioPlaying = false;
    if (resetPlayAll) {
      this.playAll = false;
    }
    this.audioFocusService.releaseFocus('home');

    // Handle wake lock properly - await and log result without suppressing errors
    try {
      await this.wakeLockService.allowSleepAgain();
      this.logger.log('Wake lock released in stopAudioDirect');
    } catch (error) {
      this.logger.error('Error releasing wake lock in stopAudioDirect:', error);
    }
  }

  async playAllAudiosDirect(audioElement: HTMLAudioElement, todayAudioFiles: any[]): Promise<void> {
    // Reset all tracks to pause state and clear repeat counters before starting Play All
    for (let i = 0; i < todayAudioFiles.length; i++) {
      todayAudioFiles[i].repeat_state = 0;
      todayAudioFiles[i].repeat_played_count = 0;
      todayAudioFiles[i].state = 'pause';
      todayAudioFiles[i].ctime = 0;
      todayAudioFiles[i].ctimeintime = '0:00';
      todayAudioFiles[i].durationintime = this.convertHMS(parseInt(todayAudioFiles[i].duration));
    }

    // Enable Play All mode
    this.playAll = true;
    this.currentAudioIndex = 0;
    this.repeatPlayedCountAll = 0;

    // Start the first track with proper state management
    await this.startAudioDirect(0, audioElement, todayAudioFiles);

    // Handle wake lock properly - await and log result without suppressing errors
    try {
      await this.wakeLockService.keepAwake();
      this.logger.log('Wake lock acquired for play-all mode');
    } catch (error) {
      this.logger.error('Wake lock acquisition failed in play-all mode:', error);
    }
  }

  async stopAllAudioDirect(audioElement: HTMLAudioElement, todayAudioFiles: any[]): Promise<void> {
    // Reset all track states to pause with full initialization
    for (let i = 0; i < todayAudioFiles.length; i++) {
      todayAudioFiles[i].repeat_state = 0;
      todayAudioFiles[i].repeat_played_count = 0;
      todayAudioFiles[i].state = 'pause';
      todayAudioFiles[i].ctime = 0;
      todayAudioFiles[i].ctimeintime = '0:00';
      // Handle duration safely - convert to number if it's a string or keep as is
      const safeDuration = typeof todayAudioFiles[i].duration === 'string'
        ? parseInt(todayAudioFiles[i].duration)
        : todayAudioFiles[i].duration;
      todayAudioFiles[i].durationintime = this.convertHMS(safeDuration || 0);
    }

    this.playAll = false;
    this.currentAudioIndex = 0;

    // Pause the audio element
    audioElement.pause();
    this.audioPlaying = false;

    this.audioFocusService.releaseFocus('home');

    // Handle wake lock properly - await and log result without suppressing errors
    try {
      await this.wakeLockService.allowSleepAgain();
      this.logger.log('Wake lock released from stop-all mode');
    } catch (error) {
      this.logger.error('Error releasing wake lock during stop-all:', error);
    }
  }

  async setRepeatStateDirect(
    i: number,
    repeat_state: number,
    audioElement: any,
    todayAudioFiles: any[]
  ): Promise<void> {
    // Stop current playback before updating repeat state (preserve playAll for Play All mode)
    await this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles, false);

    const currentRepeatState = Number(todayAudioFiles[i]?.repeat_state) || 0;
    const nextRepeatState = currentRepeatState >= 3 ? 0 : currentRepeatState + 1;

    // Only reset per-item repeat counters (preserve repeatStateAll for Play All mode)
    this.repeatPlayedCountAll = 0;

    // Update the repeat state for this track
    todayAudioFiles[i].repeat_state = nextRepeatState;
    todayAudioFiles[i].repeat_played_count = 0;

    this.logger.log(`Track ${i} repeat set to ${nextRepeatState}`);
  }

  private clearPerItemRepeatStates(exceptIndex: number = -1) {
    // Note: This needs to be updated to accept the array or be a class member
  }

  public convertHMS(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
