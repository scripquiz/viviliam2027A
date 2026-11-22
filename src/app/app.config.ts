import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withXhr, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { DatabaseService } from './services/database.service';
import { DatabaseImportService } from './services/database-import.service';
import { NetworkService } from './services/network.service';
import { DeviceService } from './services/device.service';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { ShareService } from './providers/share.service';
import { WakeLockService } from './services/wake-lock.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone + change detection
    provideZoneChangeDetection(),

    // Router
    provideRouter(routes),

    // Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicModule.forRoot({})),

    // HttpClient
    provideHttpClient(withXhr(), withInterceptorsFromDi()),

    // Animations
    provideAnimations(),

    // Core services
    DatabaseService,
    DatabaseImportService,
    NetworkService,
    DeviceService,
    ScreenOrientationService,
    ShareService,
    WakeLockService,
  ],
};
