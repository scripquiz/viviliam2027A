import { Injectable } from '@angular/core';
import { WakeLockService } from '../../services/wake-lock.service';
import { AudioFocusService } from '../../services/audio-focus.service';
import { LoggerService } from '../../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AudioPlaybackService {
  // Expose as public observable properties for direct mutation
  public currentAudioIndex: number = 0;
  public audioPlaying: boolean = false;
  public playAll: boolean = false;
  public repeatStateAll: number = 0;
  public repeatPlayedCountAll: number = 0;

  constructor(
    private wakeLockService: WakeLockService,
    private audioFocusService: AudioFocusService,
    private logger: LoggerService
  ) {}

  setAudioPlaying(value: boolean) { this.audioPlaying = value; }
  setPlayAll(value: boolean) { this.playAll = value; }
  setCurrentAudioIndex(index: number) { this.currentAudioIndex = index; }
  setRepeatStateAll(value: number) { this.repeatStateAll = value; }
  setRepeatPlayedCountAll(value: number) { this.repeatPlayedCountAll = value; }

  async startAudioDirect(
    idx: number,
    audioElement: HTMLAudioElement,
    todayAudioFiles: any[]
  ): Promise<void> {
    this.audioFocusService.requestFocus('home');

    this.currentAudioIndex = idx;
    for (let i = 0; i < todayAudioFiles.length; i++) {
      todayAudioFiles[i].state = 'pause';
    }
    todayAudioFiles[idx].state = 'play';

    await this.wakeLockService.keepAwake().then(
      () => this.logger.log('Wake lock acquired for audio playback'),
      () => this.logger.log('Wake lock acquisition failed')
    );

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
      todayAudioFiles[idx].duration = actualDuration;
      todayAudioFiles[idx].durationintime = this.convertHMS(
        Math.floor(actualDuration)
      );
    };

    audioElement.currentTime = todayAudioFiles[idx].ctime;
    try {
      await audioElement.play();
    } catch (error: any) {
      this.logger.error('Error starting audio playback:', error);
    }

    this.audioPlaying = true;
    this.wakeLockService.resetActivity();
    audioElement.onended = () => {
      this.handleAudioEnded(audioElement, todayAudioFiles);
    };
  }

  async handleAudioEnded(
    audioElement: HTMLAudioElement,
    todayAudioFiles: any[]
  ): Promise<void> {
    const isBufferedComplete = audioElement.buffered && audioElement.buffered.length > 0;
    const bufferedEnd = isBufferedComplete ? audioElement.buffered.end(audioElement.buffered.length - 1) : null;
    const currentPos = audioElement.currentTime;

    const shouldAdvance =
      !isBufferedComplete || // No buffered data - likely ended normally
      (bufferedEnd === currentPos && bufferedEnd < audioElement.duration); // Buffered to actual end

    if (!shouldAdvance) {
      this.logger.warn(
        `Audio ended but may not have completed playback fully. Buffer state: currentTime=${currentPos}, bufferedEnd=${bufferedEnd}, duration=${audioElement.duration}`
      );
      try {
        await audioElement.play();
        this.logger.log('Replaying audio due to incomplete buffer');
      } catch (error: any) {
        this.logger.error('Error replaying audio:', error);
      }
      return;
    }

    todayAudioFiles[this.currentAudioIndex].ctime = 0;
    todayAudioFiles[this.currentAudioIndex].ctimeintime = '0:00';
    todayAudioFiles[this.currentAudioIndex].durationintime = this.convertHMS(
      parseInt(todayAudioFiles[this.currentAudioIndex].duration)
    );

    if (this.playAll) {
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
          this.playAll = false;
          this.logger.log('PlayAll: false');
        }
      }
    } else if (todayAudioFiles[this.currentAudioIndex].repeat_state > 0) {
      if (
        todayAudioFiles[this.currentAudioIndex].repeat_played_count <
        todayAudioFiles[this.currentAudioIndex].repeat_state
      ) {
        todayAudioFiles[this.currentAudioIndex].repeat_played_count++;
        audioElement.currentTime = 0;
        try {
          await audioElement.play();
        } catch (error: any) {
          this.logger.error('Error replaying audio:', error);
        }
        await this.wakeLockService.keepAwake();
        this.wakeLockService.resetActivity();
      } else {
        this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
        todayAudioFiles[this.currentAudioIndex].repeat_state = 0;
        todayAudioFiles[this.currentAudioIndex].repeat_played_count = 0;
      }
    } else {
      this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
    }
  }

  async stopAudioDirect(
    idx: number,
    audioElement: HTMLAudioElement,
    todayAudioFiles: any[]
  ): Promise<void> {
    todayAudioFiles[idx].state = 'pause';
    audioElement.pause();
    this.audioPlaying = false;
    this.playAll = false;
    this.audioFocusService.releaseFocus('home');
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }

  async playAllAudiosDirect(audioElement: HTMLAudioElement, todayAudioFiles: any[]): Promise<void> {
    if (this.playAll) {
      this.playAll = false;
      audioElement.pause();
      this.audioPlaying = false;
      this.stopAllAudioDirect(audioElement, todayAudioFiles);
    } else {
      for (let i = 0; i < todayAudioFiles.length; i++) {
        todayAudioFiles[i].repeat_state = 0;
        todayAudioFiles[i].repeat_played_count = 0;
        todayAudioFiles[i].state = 'pause';
        todayAudioFiles[i].ctime = 0;
        todayAudioFiles[i].ctimeintime = '0:00';
        todayAudioFiles[i].durationintime = this.convertHMS(
          parseInt(todayAudioFiles[i].duration)
        );
      }
      this.playAll = true;
      this.currentAudioIndex = 0;
      this.repeatPlayedCountAll = 0;
      await this.startAudioDirect(0, audioElement, todayAudioFiles);
      await this.wakeLockService.keepAwake().then(
        () => {},
        () => this.logger.log('error keeping device awake')
      );
    }
  }

  async stopAllAudioDirect(audioElement: HTMLAudioElement, todayAudioFiles: any[]): Promise<void> {
    for (let i = 0; i < todayAudioFiles.length; i++) {
      todayAudioFiles[i].repeat_state = 0;
      todayAudioFiles[i].repeat_played_count = 0;
      todayAudioFiles[i].state = 'pause';
      todayAudioFiles[i].ctime = 0;
      todayAudioFiles[i].ctimeintime = '0:00';
      todayAudioFiles[i].durationintime = this.convertHMS(
        todayAudioFiles[i].duration
      );
    }
    this.playAll = false;
    this.currentAudioIndex = 0;
    audioElement.pause();
    this.audioPlaying = false;
    this.audioFocusService.releaseFocus('home');
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }

  async setRepeatStateDirect(
    i: number,
    repeat_state: number,
    audioElement: HTMLAudioElement,
    todayAudioFiles: any[]
  ): Promise<void> {
    await this.stopAudioDirect(this.currentAudioIndex, audioElement, todayAudioFiles);
    const currentRepeatState = Number(todayAudioFiles[i].repeat_state) || 0;
    const nextRepeatState = currentRepeatState >= 3 ? 0 : currentRepeatState + 1;

    this.repeatStateAll = 0;
    this.repeatPlayedCountAll = 0;
    this.clearPerItemRepeatStates(i);
    todayAudioFiles[i].repeat_state = nextRepeatState;
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
