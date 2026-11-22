import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private activeFeatures = {
    dailyVerse: true,
    dailyQuote: true,
    dailyAudio: true,
    events: true,
    notifications: true,
    shareImages: true
  };

  // Feature flags for different sections
  isFeatureEnabled(feature: string): boolean {
    return this.activeFeatures[feature] ?? false;
  }

  // Audio specific configurations
  private audioConfig = {
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxRetries: 3,
    retryDelay: 2000 // 2 seconds
  };

  getAudioConfig() {
    return this.audioConfig;
  }

  // API endpoints
  private apiEndpoints = {
    notifications: 'https://api.viviliam.com/api/notifications',
    dailyAudio: 'https://api.viviliam.com/assets/voiceover/audio_bibles.json',
    // Add other endpoints as needed
  };

  getApiEndpoint(key: string): string {
    return this.apiEndpoints[key];
  }
}
