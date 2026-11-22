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

import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { ShareService } from '../../providers/share.service';
import { Clipboard } from '@capacitor/clipboard';
import { Toast } from '@capacitor/toast';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-daily-bible-quote',
  templateUrl: './daily-bible-quote.component.html',
  styleUrls: ['./daily-bible-quote.component.scss'],
  imports: [IonicModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyBibleQuoteComponent implements OnInit, OnDestroy {
  // Inputs from parent component
  @Input() database: DatabaseConnection;

  // Quote data
  public tamilQuote: string = '';
  public englishQuote: string = '';
  public quoteoftheday: string = '';
  public quoteofthedayauthor: string = '';
  public dailyQuoteLanguage: string = 'English';
  public dailyQuoteLanguageAlternate: string = 'Tamil';
  public showDailyQuoteSetting: string = 'opacityhidehome';
  public isLoading: boolean = true;
  public showRatioSelection: boolean = false;
  public selectedColorTheme: number = 0;

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
    // Initialize quote language preference
    this.dailyQuoteLanguage =
      this.authservice.dailyQuote ||
      localStorage.getItem('quoteLanguage') ||
      'English';

    // Set the alternate language option
    if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
      this.dailyQuoteLanguageAlternate = 'English';
    } else {
      this.dailyQuoteLanguageAlternate = 'Tamil';
    }
    this.addGlobalClickListener();
  }

  ngOnChanges() {
    // When database is injected from parent, load quote
    if (this.database) {
      this.isLoading = true;
      this.cdr.detectChanges(); // Update UI to show loading spinner
      this.getQuoteOfTheDay();
    }
  }
  ngOnDestroy() {
    // Clean up the global click listener
    this.removeGlobalClickListener();
    // Clean up any open menus
    this.removeMenu();
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
      if (this.showDailyQuoteSetting === 'opacityshowhome') {
        this.hideSettingsMenu();
      }
    }
  };

  getQuoteOfTheDay() {
    this.isLoading = true;
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1; // January is 0
    const day = todayDate.getDate();

    const qry =
      'SELECT * FROM quoteoftheday where Mnth=' + month + ' and Date=' + day;
    this.database
      .executeSql(qry, [])
      .then((data) => {
        if (data && data.rows && data.rows.length > 0) {
          // Store both versions
          this.tamilQuote =
            data.rows.item(0).tquot || 'No Tamil quote available';
          this.englishQuote =
            data.rows.item(0).quot || 'No English quote available';
          this.quoteofthedayauthor = data.rows.item(0).athr || 'Unknown';

          // Set display based on language preference
          if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
            this.quoteoftheday = this.tamilQuote;
            this.dailyQuoteLanguageAlternate = 'English';
          } else {
            this.quoteoftheday = this.englishQuote;
            this.dailyQuoteLanguageAlternate = 'Tamil';
          }
        } else {
          // Handle case when no quote is found for today
          this.quoteoftheday = 'No quote available for today';
          this.quoteofthedayauthor = '';
          this.tamilQuote = '';
          this.englishQuote = '';
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      })
      .catch((error) => {
        // Set user-friendly error message
        this.quoteoftheday = "Could not load today's quote";
        this.quoteofthedayauthor = 'Please try again later';
        this.tamilQuote = '';
        this.englishQuote = '';

        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection on error too
      });
  }

  showSettings() {
    this.showDailyQuoteSetting =
      this.showDailyQuoteSetting === 'opacityshowhome'
        ? 'opacityhidehome'
        : 'opacityshowhome';

    if (this.showDailyQuoteSetting === 'opacityshowhome') {
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
      'app-daily-bible-quote .quote-menu-icon'
    );
    if (!moreButton) return;

    const rect = moreButton.getBoundingClientRect();

    // Create menu overlay
    const overlay = document.createElement('div');
    overlay.className = 'quotesettingMenu-dynamic opacityshowhome';
    overlay.id = 'dynamic-quote-menu';

    // Hide menu when clicking outside (on overlay)
    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Check if the click was on the overlay itself (not on children)
      if (
        target === overlay ||
        target.classList.contains('quotesettingMenu-dynamic')
      ) {
        this.hideSettingsMenu();
      }
    });

    // Create popover
    const popover = document.createElement('div');
    popover.className = 'popover-dynamic pop-over-shadow opacityshowhome';

    // Position the popover - Fixed positioning to show below the icon
    popover.style.position = 'fixed';
    popover.style.top = rect.bottom + 8 + 'px'; // Show below the button
    popover.style.left = rect.right - 140 + 'px'; // Align right edge of menu with right edge of button
    popover.style.width = '140px';
    popover.style.zIndex = '10001';

    // Prevent popover clicks from bubbling to overlay
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add menu content with new Copy All and Share All options
    popover.innerHTML = `
      <ion-list style="padding:0px">
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-language">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="language-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">${this.dailyQuoteLanguageAlternate}</ion-label>
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

    // Add event listeners that hide menu after selection
    popover.querySelector('.menu-language')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setLanguage();
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-create-image')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showRatioSelectionMenu();
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
    this.showDailyQuoteSetting = 'opacityhidehome';
    this.removeMenu();
    this.removeRatioSelection();
    this.cdr.detectChanges();
  }

  private removeMenu() {
    const existingMenu = document.getElementById('dynamic-quote-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  setLanguage() {
    this.dailyQuoteLanguage = this.dailyQuoteLanguageAlternate;

    // Save preference to localStorage for persistence between sessions
    localStorage.setItem('quoteLanguage', this.dailyQuoteLanguageAlternate);

    // Set the alternate language option for next toggle
    if (this.dailyQuoteLanguageAlternate.toUpperCase() === 'TAMIL') {
      this.dailyQuoteLanguageAlternate = 'English';
    } else {
      this.dailyQuoteLanguageAlternate = 'Tamil';
    }

    // Update the quote content immediately without loader
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1;
    const day = todayDate.getDate();

    const qry =
      'SELECT * FROM quoteoftheday where Mnth=' + month + ' and Date=' + day;

    this.database
      .executeSql(qry, [])
      .then((data) => {
        if (data && data.rows && data.rows.length > 0) {
          // Store both versions
          this.tamilQuote =
            data.rows.item(0).tquot || 'No Tamil quote available';
          this.englishQuote =
            data.rows.item(0).quot || 'No English quote available';
          this.quoteofthedayauthor = data.rows.item(0).athr || 'Unknown';

          // Set display based on language preference
          if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
            this.quoteoftheday = this.tamilQuote;
          } else {
            this.quoteoftheday = this.englishQuote;
          }
        } else {
          this.quoteoftheday = 'No quote available for today';
          this.quoteofthedayauthor = '';
          this.tamilQuote = '';
          this.englishQuote = '';
        }
        this.cdr.detectChanges();
      })
      .catch((error) => {
        // Error already handled by getQuoteOfTheDay
        this.quoteoftheday = "Could not load today's quote";
        this.quoteofthedayauthor = 'Please try again later';
        this.tamilQuote = '';
        this.englishQuote = '';
        this.cdr.detectChanges();
      });
    this.showDailyQuoteSetting = 'opacityhidehome';
    this.cdr.detectChanges();
  }

  async shareContent(mode: string) {
    let shareText = '';

    if (mode === 'COPY_ALL' || mode === 'SHARE_ALL') {
      // Create content with both languages
      shareText = `${this.tamilQuote}\n\n--  ${this.quoteofthedayauthor}  --\n\n${this.englishQuote}\n\nShared via Viviliam\nhttps://app.viviliam.com`;
    } else {
      // Original single language content
      shareText =
        this.quoteoftheday +
        '\n\n--  ' +
        this.quoteofthedayauthor +
        ' --\r\n\nShared via Viviliam\nhttps://app.viviliam.com';
    }

    this.showDailyQuoteSetting = 'opacityhidehome';

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
        // Only show toast on error
        await Toast.show({
          text: 'Failed to copy to clipboard',
          duration: 'short',
          position: 'center',
        });
      }
    }
    this.cdr.detectChanges(); // Trigger change detection
  }

  // Show ratio/color selection dialog
  showRatioSelectionMenu() {
    this.showRatioSelection = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.createRatioSelectionOverlay();
    }, 10);
  }

  removeRatioSelection() {
    this.showRatioSelection = false;
    const existingMenu = document.getElementById('ratio-selection-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    this.cdr.detectChanges();
  }

  private createRatioSelectionOverlay() {
    // Remove any existing overlay
    let overlay = document.getElementById('ratio-selection-menu');
    if (overlay) {
      overlay.remove();
    }

    overlay = document.createElement('div');
    overlay.id = 'ratio-selection-menu';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '10002';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const dialog = document.createElement('div');
    dialog.style.background = '#fff';
    dialog.style.position = 'relative';

    let html = `
      <h3 style="margin:0 0 15px 0;color:#333;font-size:18px;font-weight:600;font-family:Arial,sans-serif;">Select Color &amp; Size</h3>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;">
    `;

    // Color theme selection (first, matching daily-bible-verse)
    html += `
        ${this.colorThemes.map((theme, idx) => `
        <div class="color-palette" data-theme="${idx}" style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]});
          cursor: pointer;
          border: ${idx === this.selectedColorTheme ? '3px solid #007bff' : '2px solid #ddd'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        " title="${theme.name}"></div>
      `).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
    `;

    // Ratio buttons + cancel (matching daily-bible-verse order)
    html += `
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
        <button class="ratio-cancel-btn" style="
          padding: 12px 20px;
          border: 2px solid #6c757d;
          background: transparent;
          color: #6c757d;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          Cancel
        </button>
      </div>
    `;

    dialog.style.borderRadius = '12px';
    dialog.style.padding = '20px';
    dialog.style.width = '340px';
    dialog.style.maxWidth = '90vw';
    dialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

    dialog.innerHTML = html;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Inject hover effect styles (matching daily-bible-verse pattern)
    const style = document.createElement('style');
    style.textContent = `
      .ratio-btn:hover {
        background: #a73208 !important;
        border-color: #a73208 !important;
        transform: translateY(-1px);
      }
      .ratio-cancel-btn:hover {
        background: #6c757d !important;
        color: white !important;
      }
      .color-palette:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      }
    `;
    document.head.appendChild(style);

    // Color palette selection (scoped to dialog)
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

    // Button event listeners (scoped to dialog)
    dialog.querySelector('[data-ratio="1:1"]')?.addEventListener('click', () => {
      this.createImageWithRatio('1:1');
      this.removeRatioSelection();
    });

    dialog.querySelector('[data-ratio="9:16"]')?.addEventListener('click', () => {
      this.createImageWithRatio('9:16');
      this.removeRatioSelection();
    });

    dialog.querySelector('[data-ratio="3:4"]')?.addEventListener('click', () => {
      this.createImageWithRatio('3:4');
      this.removeRatioSelection();
    });

    dialog.querySelector('.ratio-cancel-btn')?.addEventListener('click', () => {
      this.removeRatioSelection();
    });

    // X close button
    dialog.querySelector('#ratio-dialog-close')?.addEventListener('click', () => {
      this.removeRatioSelection();
    });

    // Close on overlay click (outside dialog)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.removeRatioSelection();
      }
    });

    // Prevent dialog clicks from closing the overlay
    dialog.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  async createImageWithRatio(ratio: '1:1' | '3:4' | '9:16') {
    try {
      await Toast.show({
        text: 'Creating image...',
        duration: 'short',
        position: 'center',
      });

      await this.ensureFontLoaded();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

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

      const quoteText = this.quoteoftheday.replace(/<[^>]*>/g, '');
      const containsTamil = /[஀-௿]/.test(quoteText);

      const selectedTheme = this.colorThemes[this.selectedColorTheme];
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, selectedTheme.colors[0]);
      gradient.addColorStop(1, selectedTheme.colors[1]);

      const textColor = selectedTheme.textColor;
      const referenceColor = selectedTheme.textColor;
      const footerColor = 'rgba(255, 255, 255, 0.9)';

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mainFontSize = ratio === '9:16' ? 32 : 38;
      const referenceFontSize = ratio === '9:16' ? 24 : 28;

      // Set font for quote text
      if (containsTamil) {
        const tamilFonts = [
          `600 ${mainFontSize}px "Anek Tamil"`,
          `bold ${mainFontSize}px "Anek Tamil"`,
          `${mainFontSize}px "Anek Tamil"`,
          `600 ${mainFontSize}px "Noto Sans Tamil"`,
          `600 ${mainFontSize}px sans-serif`,
        ];

        let fontSet = false;
        for (const fontFamily of tamilFonts) {
          try {
            ctx.font = fontFamily;
            const testWidth = ctx.measureText('தமிழ்').width;
            if (testWidth > 0) {
              fontSet = true;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px sans-serif`;
        }
      } else {
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
            const testWidth = ctx.measureText('Bible Quote').width;
            if (testWidth > 0) {
              fontSet = true;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px serif`;
        }
      }

      // Calculate text height and center it
      const maxWidth = canvas.width - 100;
      const lineHeight = ratio === '9:16' ? 55 : 65;
      const lines = this._wrapText(ctx, quoteText, maxWidth);
      const totalTextHeight = lines.length * lineHeight;

      const startY = (canvas.height - totalTextHeight) / 2 + 20;

      // Draw wrapped text
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight, maxWidth);
      }

      // Add author reference
      ctx.fillStyle = referenceColor;
      const authFontSize = ratio === '9:16' ? 24 : 28;
      if (containsTamil) {
        const tamilRefFonts = [
          `600 ${authFontSize}px "Anek Tamil"`,
          `bold ${authFontSize}px "Anek Tamil"`,
          `${authFontSize}px "Anek Tamil"`,
          `600 ${authFontSize}px sans-serif`,
        ];
        let refFontSet = false;
        for (const font of tamilRefFonts) {
          try {
            ctx.font = font;
            const testWidth = ctx.measureText('உரையை').width;
            if (testWidth > 0) {
              refFontSet = true;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!refFontSet) {
          ctx.font = `600 ${authFontSize}px sans-serif`;
        }
      } else {
        const englishRefFonts = [
          `600 ${authFontSize}px "Bricolage Grotesque"`,
          `bold ${authFontSize}px "Bricolage Grotesque"`,
          `${authFontSize}px "Bricolage Grotesque"`,
          `600 ${authFontSize}px serif`,
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
            // ignore
          }
        }
        if (!refFontSet) {
          ctx.font = `600 ${authFontSize}px serif`;
        }
      }

      const authorY = startY + totalTextHeight + 25;
      const displayAuthor = this.quoteofthedayauthor || '';
      if (displayAuthor) {
        ctx.fillText(displayAuthor, canvas.width / 2, authorY);
      }

      // Add logo
      await this._addLogoToCanvas(ctx, canvas.width / 2, canvas.height - 100);

      // Convert to base64
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const language = containsTamil ? 'tamil' : 'english';
      const ratioStr = ratio.replace(':', 'x');
      const fileName = `daily-quote-${dateStr}-${timeStr}-${language}-${ratioStr}.png`;

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

  // Internal helper: wrap text into lines
  private _wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  // Internal helper: add logo to canvas
  private async _addLogoToCanvas(ctx: CanvasRenderingContext2D, x: number, y: number): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const logoWidth = 240;
          const logoHeight = 36;
          ctx.drawImage(img, x - logoWidth / 2, y - logoHeight / 2, logoWidth, logoHeight);
          resolve();
        } catch (error) {
          this._addFallbackText(ctx, x, y);
          resolve();
        }
      };

      img.onerror = () => {
        this._addFallbackText(ctx, x, y);
        resolve();
      };

      img.src = 'assets/images/vl50.png';
    });
  }

  // Fallback method to add text if logo fails
  private _addFallbackText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('app.viviliam.com', x, y);
  }

  // Ensure fonts are loaded before canvas drawing
  private async ensureFontLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if ('fonts' in document && (document as any).fonts.load) {
        const fontPromises = [
          (document as any).fonts.load('600 40px "Anek Tamil"', 'தமிழ் பைபிள்'),
          (document as any).fonts.load('600 30px "Anek Tamil"', 'வசனம்'),
          (document as any).fonts.load('600 40px "Bricolage Grotesque"', 'Bible Quote'),
          (document as any).fonts.load('600 30px "Bricolage Grotesque"', 'Reference'),
        ];
        Promise.allSettled(fontPromises).then(() => {
          setTimeout(() => resolve(), 500);
        });
      } else {
        // Fallback for older browsers
        this.loadFontViaElement().then(() => resolve());
      }
    });
  }

  private isFontAvailable(fontName: string): boolean {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;
    const text = 'தமிழ் பைபிள்';
    context.font = '40px monospace';
    const baselineSize = context.measureText(text).width;
    context.font = `40px "${fontName}", monospace`;
    const newSize = context.measureText(text).width;
    return newSize !== baselineSize;
  }

  private async loadFontViaElement(): Promise<void> {
    return new Promise((resolve) => {
      const testTexts = ['தமிழ்', 'பைபிள்', 'வசனம்'];
      const elements: HTMLElement[] = [];
      testTexts.forEach((text) => {
        const el = document.createElement('div');
        el.style.fontFamily = '"Anek Tamil", sans-serif';
        el.style.fontSize = '40px';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.visibility = 'hidden';
        el.textContent = text;
        document.body.appendChild(el);
        elements.push(el);
      });
      setTimeout(() => {
        elements.forEach((el) => document.body.removeChild(el));
        resolve();
      }, 300);
    });
  }
}
