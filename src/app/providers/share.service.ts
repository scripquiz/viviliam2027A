import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  constructor() { }

  /**
   * Share content via the native share dialog
   * @param title Optional title for share dialog
   * @param text Optional text to share
   * @param url Optional URL to share
   * @param files Optional array of files to share (iOS and Android only)
   * @returns Promise that resolves with share result
   */
  async share(options: {
    title?: string,
    text?: string,
    url?: string,
    files?: string[]
  }) {
    try {
      const shareOptions: any = {
        dialogTitle: options.title,
        text: options.text,
        url: options.url
      };

      // Only add files if provided and platform supports it
      if (options.files && options.files.length > 0) {
        shareOptions.files = options.files;
      }

      return await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing content:', error);
      throw error;
    }
  }

  /**
   * Check if sharing is supported on the current platform
   * @returns Promise with boolean indicating if sharing is supported
   */
  async canShare() {
    try {
      const result = await Share.canShare();
      return result.value;
    } catch (error) {
      console.error('Error checking share capability:', error);
      return false;
    }
  }
}
