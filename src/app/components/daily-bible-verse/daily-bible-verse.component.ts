import {
  Component,
  OnInit,
  OnDestroy, // Add this import
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DatabaseService, DatabaseConnection } from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { ShareService } from '../../providers/share.service';
import { Clipboard } from '@capacitor/clipboard';
import { Toast } from '@capacitor/toast';

@Component({
    selector: 'app-daily-bible-verse',
    templateUrl: './daily-bible-verse.component.html',
    styleUrls: ['./daily-bible-verse.component.scss'],
    imports: [CommonModule, IonicModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyBibleVerseComponent implements OnInit, OnDestroy {
  // Inputs from parent component
  @Input() database: DatabaseConnection;

  // Verse data
  public tamilVerse: string = '';
  public tamilVerseReference: string = '';
  public englishVerse: string = '';
  public englishVerseReference: string = '';
  public verseoftheday: string = '';
  public verseoftheday_reference: string = '';
  public dailyVerseLanguage: string = 'English';
  public dailyVerseLanguageAlternate: string = 'Tamil';
  public dailyVerse_top: string = '';
  public dailyVerse_bottom: string = '';
  public showDailyVerseSetting: string = 'opacityhidehome';
  public showRatioSelection: boolean = false;
  public isLoading: boolean = true;
  public selectedColorTheme: number = 0; // Default to first theme

  // Define 5 gradient color themes
  public colorThemes = [
    { name: 'Sunset', colors: ['#f89b29', '#ff0f7b'], textColor: '#ffffff' },
    { name: 'Ocean', colors: ['#1e2370', '#17c9c9'], textColor: '#ffffff' },
    {
      name: 'Purple Dream',
      colors: ['#4d3399', '#ff00cc'],
      textColor: '#ffffff',
    },
    { name: 'Forest', colors: ['#0d3844', '#54895f'], textColor: '#ffffff' },
    { name: 'Rose Gold', colors: ['#C33764', '#8B4789'], textColor: '#ffffff' },
  ];

  constructor(
    private authservice: AuthserviceProvider,
    private shareService: ShareService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.dailyVerseLanguage = this.authservice.dailyVerse;

    // Set the alternate language option
    if (this.dailyVerseLanguage.toUpperCase() == 'TAMIL') {
      this.dailyVerseLanguageAlternate = 'English';
    } else {
      this.dailyVerseLanguageAlternate = 'Tamil';
    }
    this.addGlobalClickListener();
  }

  ngOnChanges() {
    // When database is injected from parent, load verse
    if (this.database) {
      this.isLoading = true;
      this.getVerseOfTheDay();
      //this.loadDailyVerseOnlineContent();
    }
  }

  ngOnDestroy() {
    // Clean up the global click listener
    this.removeGlobalClickListener();
    // Clean up any open menus
    this.removeMenu();
    this.removeRatioMenu();
  }

  private addGlobalClickListener() {
    document.addEventListener('click', this.globalClickHandler);
  }

  private removeGlobalClickListener() {
    document.removeEventListener('click', this.globalClickHandler);
  }

  private globalClickHandler = (event: Event) => {
    const target = event.target as HTMLElement;

    // Check if click is outside any menu
    const isClickOnVerseSetting =
      target.closest('#dynamic-verse-menu') ||
      target.closest('app-daily-bible-verse .verse-menu-icon');
    const isClickOnQuoteSetting =
      target.closest('#dynamic-quote-menu') ||
      target.closest('app-daily-bible-quote .quote-menu-icon');

    // If click is outside both menus, hide this component's menu
    if (!isClickOnVerseSetting && !isClickOnQuoteSetting) {
      if (this.showDailyVerseSetting === 'opacityshowhome') {
        this.hideSettingsMenu();
      }
    }
  };

  getVerseOfTheDay() {
    const todayDate = new Date();
    const qry =
      'SELECT * FROM verseoftheday where Mnth=' +
      (todayDate.getMonth() + 1) +
      ' and Date=' +
      todayDate.getDate();

    this.database
      .executeSql(qry, [])
      .then((data) => {
        if (data.rows.length > 0) {
          // Store both versions
          this.tamilVerse = data.rows.item(0).Tvrs;
          this.tamilVerseReference = data.rows.item(0).Tref;
          this.englishVerse = data.rows.item(0).Evrs;
          this.englishVerseReference = data.rows.item(0).Eref;

          // Set display based on language preference
          if (this.dailyVerseLanguage.toUpperCase() == 'TAMIL') {
            this.verseoftheday = this.tamilVerse;
            this.verseoftheday_reference = this.tamilVerseReference;
            this.dailyVerseLanguageAlternate = 'English';
          } else {
            this.verseoftheday = this.englishVerse;
            this.verseoftheday_reference = this.englishVerseReference;
            this.dailyVerseLanguageAlternate = 'Tamil';
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      })
      .catch((error) => {
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection on error too
      });
  }

  /*   loadDailyVerseOnlineContent() {
      this.dailyVerse_top = "";
      this.dailyVerse_bottom = "";
      const params = "dailyverseonlinecontent";
      this.authservice.execute_api(params, this.dailyVerseOnlineContentResult, this);
    }
  
    dailyVerseOnlineContentResult(status, objAllData, objThis) {
      if (status && objAllData.length > 0) {
        objThis.dailyVerse_top = objAllData[0]["dailyverse_top"].split("&gt;").join(">").split("&lt;").join("<");
        objThis.dailyVerse_bottom = objAllData[0]["dailyverse_bottom"].split("&gt;").join(">").split("&lt;").join("<");
        objThis.cdr.detectChanges(); // Trigger change detection
      }
    } */

  showSettings() {
    this.showDailyVerseSetting =
      this.showDailyVerseSetting === 'opacityshowhome'
        ? 'opacityhidehome'
        : 'opacityshowhome';

    if (this.showDailyVerseSetting === 'opacityshowhome') {
      setTimeout(() => {
        this.createAndPositionMenu();
      }, 10);
    } else {
      this.removeMenu();
    }

    this.cdr.detectChanges();
  }

  private createAndPositionMenu() {
    // Remove existing menu if any
    this.removeMenu();

    // Use a more specific selector that targets only this component's button
    const moreButton = document.querySelector(
      'app-daily-bible-verse .verse-menu-icon'
    );
    if (!moreButton) return;

    const rect = moreButton.getBoundingClientRect();

    // Create menu overlay
    const overlay = document.createElement('div');
    overlay.className = 'versettingMenu-dynamic opacityshowhome';
    overlay.id = 'dynamic-verse-menu';

    // Hide menu when clicking outside (on overlay)
    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Check if the click was on the overlay itself (not on children)
      if (
        target === overlay ||
        target.classList.contains('versettingMenu-dynamic')
      ) {
        this.hideSettingsMenu();
      }
    });

    // Create popover
    const popover = document.createElement('div');
    popover.className = 'popover-dynamic pop-over-shadow opacityshowhome';

    // Position the popover
    popover.style.position = 'fixed';
    popover.style.top = rect.bottom + 5 + 'px';
    popover.style.right = window.innerWidth - rect.right + 'px';
    popover.style.width = '140px';
    popover.style.zIndex = '10001';

    // Prevent popover clicks from bubbling to overlay
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add menu content with Create Image option
    popover.innerHTML = `
      <ion-list style="padding:0px">
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-language">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="language-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">${this.dailyVerseLanguageAlternate}</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-create-image">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="image-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">Image</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-copy">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="copy-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">Copy</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-copy-all">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="documents-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">Copy All</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-share">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="share-social-outline" style="font-size:24px;position:relative; top:6px;"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-2px">Share</ion-label>
        </ion-item>
        <ion-item no-padding style="height:47px;--padding-start: 10px;display: block;" class="menu-share-all">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="share-outline" style="font-size:24px;position:relative; top:6px;"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-2px">Share All</ion-label>
        </ion-item>
      </ion-list>
    `;

    // Add event listeners
    popover.querySelector('.menu-language')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setLanguage();
      this.hideSettingsMenu();
    });

    popover
      .querySelector('.menu-create-image')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createImage();
        this.hideSettingsMenu();
      });

    popover.querySelector('.menu-copy')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('COPY');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-copy-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('COPY_ALL');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-share')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('SHARE');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-share-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('SHARE_ALL');
      this.hideSettingsMenu();
    });

    overlay.appendChild(popover);
    document.body.appendChild(overlay);
  }

  hideSettingsMenu() {
    this.showDailyVerseSetting = 'opacityhidehome';
    this.removeMenu();
    this.cdr.detectChanges();
  }
  showRatioSelectionMenu() {
    // Remove any existing ratio menu
    this.removeRatioMenu();

    // Create ratio selection overlay
    const overlay = document.createElement('div');
    overlay.className = 'ratio-menu-overlay';
    overlay.id = 'ratio-selection-menu';
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

    // Create ratio selection dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    min-width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;

    dialog.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">Select Color & Size</h3>
    
    <!-- Color Theme Palettes -->
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
      ${this.colorThemes
        .map(
          (theme, index) => `
        <div 
          class="color-palette" 
          data-theme="${index}"
          style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${theme.colors[0]}, ${
            theme.colors[1]
          });
            cursor: pointer;
            border: ${
              index === this.selectedColorTheme
                ? '3px solid #007bff'
                : '2px solid #ddd'
            };
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          "
          title="${theme.name}"
        ></div>
      `
        )
        .join('')}
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button class="ratio-btn" data-ratio="1:1" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Square [1:1] 720×720
      </button>
      <button class="ratio-btn" data-ratio="3:4" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Portrait [3:4] 720×960
      </button>
      <button class="ratio-btn" data-ratio="9:16" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Story [9:16] 720×1280
      </button>
      <button class="cancel-btn" style="
        padding: 12px 20px;
        border: 2px solid #6c757d;
        background: transparent;
        color: #6c757d;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 8px;
      ">
        Cancel
      </button>
    </div>
  `;

    // Add hover effects
    const style = document.createElement('style');
    style.textContent = `
    .ratio-btn:hover {
      background: #a73208 !important;
      border-color: #a73208 !important;
      transform: translateY(-1px);
    }
    .cancel-btn:hover {
      background: #6c757d !important;
      color: white !important;
    }
    .color-palette:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    }
  `;
    document.head.appendChild(style);

    // Add event listeners for color palettes
    const palettes = dialog.querySelectorAll('.color-palette');
    palettes.forEach((palette) => {
      palette.addEventListener('click', (e) => {
        const themeIndex = parseInt(
          (e.currentTarget as HTMLElement).getAttribute('data-theme') || '0'
        );
        this.selectedColorTheme = themeIndex;

        // Update border styling for all palettes
        palettes.forEach((p, idx) => {
          (p as HTMLElement).style.border =
            idx === themeIndex ? '3px solid #007bff' : '2px solid #ddd';
        });
      });
    });

    // Add event listeners
    dialog
      .querySelector('[data-ratio="1:1"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('1:1');
        this.removeRatioMenu();
      });

    dialog
      .querySelector('[data-ratio="3:4"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('3:4');
        this.removeRatioMenu();
      });

    dialog
      .querySelector('[data-ratio="9:16"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('9:16');
        this.removeRatioMenu();
      });

    dialog.querySelector('.cancel-btn')?.addEventListener('click', () => {
      this.removeRatioMenu();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.removeRatioMenu();
      }
    });

    // Prevent dialog clicks from closing the menu
    dialog.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  // Add this method to remove the ratio menu
  private removeRatioMenu() {
    const existingMenu = document.getElementById('ratio-selection-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  private removeMenu() {
    const existingMenu = document.getElementById('dynamic-verse-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  async createImageWithRatio(ratio: '1:1' | '3:4' | '9:16') {
    try {
      // Show loading message
      await Toast.show({
        text: 'Creating image...',
        duration: 'short',
        position: 'center',
      });

      // Wait for fonts to be loaded
      // Font loading started
      await this.ensureFontLoaded();

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions based on ratio
      if (ratio === '1:1') {
        canvas.width = 720;
        canvas.height = 720;
      } else if (ratio === '3:4') {
        canvas.width = 720;
        canvas.height = 960;
      } else if (ratio === '9:16') {
        canvas.width = 720;
        canvas.height = 1280;
      }

      // Add verse text with increased font size and Anek Tamil as default for Tamil
      const verseText = this.verseoftheday.replace(/<[^>]*>/g, ''); // Remove HTML tags

      // Check if the verse contains Tamil text (basic check for Tamil Unicode range)
      const containsTamil = /[\u0B80-\u0BFF]/.test(verseText);

      // Use selected color theme
      const selectedTheme = this.colorThemes[this.selectedColorTheme];
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, selectedTheme.colors[0]);
      gradient.addColorStop(1, selectedTheme.colors[1]);

      const textColor = selectedTheme.textColor;
      const referenceColor = selectedTheme.textColor;
      const footerColor = 'rgba(255, 255, 255, 0.9)';

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Set text properties
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Adjust font sizes based on ratio
      const mainFontSize = ratio === '9:16' ? 36 : 40; // Slightly smaller for story format
      const referenceFontSize = ratio === '9:16' ? 26 : 30;

      // Set font with better fallback system and weight specification
      if (containsTamil) {
        // Try multiple Tamil font variations with semibold weight (600)
        const tamilFonts = [
          `600 ${mainFontSize}px "Anek Tamil"`,
          `bold ${mainFontSize}px "Anek Tamil"`,
          `600 ${mainFontSize}px Anek Tamil`,
          `${mainFontSize}px "Anek Tamil"`,
          `600 ${mainFontSize}px "Noto Sans Tamil"`,
          `600 ${mainFontSize}px sans-serif`,
        ];

        let fontSet = false;
        for (const fontFamily of tamilFonts) {
          try {
            ctx.font = fontFamily;
            // Test the font with Tamil text
            const testWidth = ctx.measureText('தமிழ் பைபிள்').width;

            if (testWidth > 0) {
              fontSet = true;
              fontSet = true;
              break;
            }
          } catch (e) {
          }
        }

        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px sans-serif`;
        }
      } else {
        // Try multiple English font variations with semibold weight (600)
        const englishFonts = [
          `600 ${mainFontSize}px "Bricolage Grotesque"`,
          `bold ${mainFontSize}px "Bricolage Grotesque"`,
          `${mainFontSize}px "Bricolage Grotesque"`,
          `600 ${mainFontSize}px Georgia`,
          `600 ${mainFontSize}px serif`,
        ];

        let fontSet = false;
        for (const fontFamily of englishFonts) {
          try {
            ctx.font = fontFamily;
            // Test the font with English text
            const testWidth = ctx.measureText('Bible Verse').width;

            if (testWidth > 0) {
              fontSet = true;
              fontSet = true;
              break;
            }
          } catch (e) {
          }
        }

        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px serif`;
        }
      }

      // Calculate the total height of the verse text to center it properly
      const maxWidth = canvas.width - 100;
      const lineHeight = ratio === '9:16' ? 60 : 70; // Adjust line height for story format
      const lines = this.calculateWrappedLines(ctx, verseText, maxWidth);
      const totalTextHeight = lines.length * lineHeight;

      // Adjust vertical positioning based on ratio
      const verseStartY =
        ratio === '9:16'
          ? (canvas.height - totalTextHeight) / 2 - 50 // Move up a bit for story format
          : (canvas.height - totalTextHeight) / 2 + 20;

      this.wrapTextCentered(
        ctx,
        verseText,
        canvas.width / 2,
        verseStartY,
        maxWidth,
        lineHeight
      );

      // Add reference with appropriate font and weight
      ctx.fillStyle = referenceColor;
      if (containsTamil) {
        // Try Tamil reference fonts with semibold weight
        const tamilRefFonts = [
          `600 ${referenceFontSize}px "Anek Tamil"`,
          `bold ${referenceFontSize}px "Anek Tamil"`,
          `${referenceFontSize}px "Anek Tamil"`,
          `600 ${referenceFontSize}px sans-serif`,
        ];

        let refFontSet = false;
        for (const font of tamilRefFonts) {
          try {
            ctx.font = font;
            const testWidth = ctx.measureText('வசனம்').width;
            if (testWidth > 0) {
              refFontSet = true;
              break;
            }
          } catch (e) {
          }
        }

        if (!refFontSet) {
          ctx.font = `600 ${referenceFontSize}px sans-serif`;
        }
      } else {
        // Try English reference fonts
        const englishRefFonts = [
          `600 ${referenceFontSize}px "Bricolage Grotesque"`,
          `bold ${referenceFontSize}px "Bricolage Grotesque"`,
          `${referenceFontSize}px "Bricolage Grotesque"`,
          `600 ${referenceFontSize}px serif`,
        ];

        let refFontSet = false;
        for (const font of englishRefFonts) {
          try {
            ctx.font = font;
            const testWidth = ctx.measureText('Reference').width;
            if (testWidth > 0) {
              refFontSet = true;
              break;
            }
          } catch (e) {
          }
        }

        if (!refFontSet) {
          ctx.font = `600 ${referenceFontSize}px serif`;
        }
      }

      const referenceY = verseStartY + totalTextHeight + 25;
      ctx.fillText(
        `${this.verseoftheday_reference}`,
        canvas.width / 2,
        referenceY
      );

      // Add logo with adjusted position for different ratios
      const logoY = ratio === '9:16' ? canvas.height - 150 : canvas.height - 80;
      await this.addLogoToCanvas(ctx, canvas.width / 2, logoY);

      // Convert canvas to base64
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      // Generate filename with current date, time, ratio, and language
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const language = containsTamil ? 'tamil' : 'english';
      const ratioStr = ratio.replace(':', 'x');
      const fileName = `daily-verse-${dateStr}-${timeStr}-${language}-${ratioStr}.png`;

      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        await Toast.show({
          text: `Image saved to Documents (${ratio})`,
          duration: 'short',
          position: 'center',
        });
      } catch (filesystemError) {

        try {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              await Toast.show({
                text: `Image downloaded successfully! (${ratio})`,
                duration: 'short',
                position: 'center',
              });
            }
          }, 'image/png');
        } catch (downloadError) {
          await Toast.show({
            text: 'Failed to save image',
            duration: 'short',
            position: 'center',
          });
        }
      }
    } catch (error) {
      await Toast.show({
        text: 'Failed to create image',
        duration: 'short',
        position: 'center',
      });
    }
  }

  setLanguage() {
    this.dailyVerseLanguage = this.dailyVerseLanguageAlternate;

    // Save preference to localStorage for persistence between sessions
    localStorage.setItem('bibleVerseLanguage', this.dailyVerseLanguage);

    this.getVerseOfTheDay();
    this.showDailyVerseSetting = 'opacityhidehome';
    this.cdr.detectChanges(); // Trigger change detection
  }

  async shareContent(mode: string) {
    let shareText = '';

    if (mode === 'COPY_ALL' || mode === 'SHARE_ALL') {
      // Create content with both languages
      shareText = `${this.tamilVerse}\n${this.tamilVerseReference}\n\n${this.englishVerse}\n${this.englishVerseReference}\n\nShared via Viviliam\nhttps://app.viviliam.com`;
    } else {
      // Original single language content
      shareText =
        this.verseoftheday +
        '\n\n' +
        this.verseoftheday_reference +
        '\n\n' +
        'Shared via Viviliam\nhttps://app.viviliam.com';
    }

    this.showDailyVerseSetting = 'opacityhidehome';

    if (mode === 'SHARE' || mode === 'SHARE_ALL') {
      this.shareService.share({
        text: shareText,
        title: 'Viviliam',
      });
    } else if (mode === 'COPY' || mode === 'COPY_ALL') {
      try {
        await Clipboard.write({
          string: shareText,
        });
      } catch (error) {
        await Toast.show({
          text: 'Failed to copy to clipboard',
          duration: 'short',
          position: 'center',
        });
      }
    }
    this.cdr.detectChanges();
  }
  async createImage() {
    // This method now just shows the ratio selection menu
    this.showRatioSelectionMenu();
  }

  // Updated logo method with better error handling
  private async addLogoToCanvas(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();

      // Handle CORS if loading from external URL
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Calculate logo dimensions (adjust as needed)
          const logoWidth = 240; // Adjust width as needed
          const logoHeight = 36; // Adjust height as needed

          // Draw the logo centered at the specified position
          ctx.drawImage(
            img,
            x - logoWidth / 2, // Center horizontally
            y - logoHeight / 2, // Center vertically
            logoWidth,
            logoHeight
          );

          resolve();
        } catch (error) {
          // Fallback to text if logo fails
          this.addFallbackText(ctx, x, y);
          resolve();
        }
      };

      img.onerror = () => {
        // Fallback to text if logo fails to load
        this.addFallbackText(ctx, x, y);
        resolve();
      };

      // Set the logo source - make sure this file exists
      img.src = 'assets/images/vl50.png';
    });
  }

  // Fallback method to add text if logo fails
  private addFallbackText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('app.viviliam.com', x, y);
  }

  // Enhanced font loading method specifically for canvas
  private async ensureFontLoaded(): Promise<void> {
    return new Promise((resolve) => {

      // Load both fonts with specific weights
      if ('fonts' in document && (document as any).fonts.load) {
        const fontPromises = [
          // Anek Tamil with weight 600 (changed from 500)
          (document as any).fonts.load('600 40px "Anek Tamil"', 'தமிழ் பைபிள்'),
          (document as any).fonts.load('600 30px "Anek Tamil"', 'வசனம்'),
          // Bricolage Grotesque with weight 600
          (document as any).fonts.load(
            '600 40px "Bricolage Grotesque"',
            'Bible Verse'
          ),
          (document as any).fonts.load(
            '600 30px "Bricolage Grotesque"',
            'Reference'
          ),
        ];

        Promise.allSettled(fontPromises).then((results) => {
          results.forEach((result, index) => {
            // Font loaded or failed silently
          });

          // Additional wait for font to be fully available
          setTimeout(() => {
            resolve();
          }, 500);
        });
      } else {
        // Fallback method
        this.loadFontViaElement().then(() => {
          resolve();
        });
      }
    });
  }

  // Method to check if font is available
  private isFontAvailable(fontName: string): boolean {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;

    const text = 'தமிழ் பைபிள்'; // Tamil text to test

    // Test with a known font first
    context.font = '40px monospace';
    const baselineSize = context.measureText(text).width;

    // Test with the target font
    context.font = `40px "${fontName}", monospace`;
    const newSize = context.measureText(text).width;

    return newSize !== baselineSize;
  }

  // Improved font loading via element
  private async loadFontViaElement(): Promise<void> {
    return new Promise((resolve) => {
      // Create multiple test elements with different weights
      const testTexts = ['தமிழ்', 'பைபிள்', 'வசனம்'];
      const elements: HTMLElement[] = [];

      testTexts.forEach((text, index) => {
        const testElement = document.createElement('div');
        testElement.style.fontFamily = '"Anek Tamil", sans-serif';
        testElement.style.fontSize = '40px';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.style.opacity = '0';
        testElement.style.pointerEvents = 'none';
        testElement.innerHTML = text;

        document.body.appendChild(testElement);
        elements.push(testElement);
      });

      // Wait longer for font to load
      setTimeout(() => {
        elements.forEach((element) => {
          if (element.parentNode) {
            document.body.removeChild(element);
          }
        });

        resolve();
      }, 800); // Increased timeout to 800ms
    });
  }

  // Helper method to calculate wrapped lines (for centering)
  private calculateWrappedLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      lines.push(line.trim());
    }
    return lines;
  }

  // Updated helper method for text wrapping with proper vertical centering
  private wrapTextCentered(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
    }
  }

  // Keep the original wrapText method for backward compatibility (if needed elsewhere)
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  // Add this method to pre-load the font
  private async loadFont(): Promise<void> {
    return new Promise((resolve) => {
      if ((document as any).fonts && (document as any).fonts.load) {
        // Modern browsers with FontFace API
        (document as any).fonts
          .load('40px "Anek Tamil"')
          .then(() => {
            resolve();
          })
          .catch(() => {
            resolve();
          });
      } else {
        // Fallback for older browsers
        const testElement = document.createElement('div');
        testElement.style.fontFamily = '"Anek Tamil", Tamil, serif';
        testElement.style.fontSize = '40px';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.innerHTML = 'பைபிள்';
        document.body.appendChild(testElement);

        setTimeout(() => {
          document.body.removeChild(testElement);
          resolve();
        }, 100);
      }
    });
  }
}
