import { CommonModule } from '@angular/common';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideRouter, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { AuthserviceProvider } from '../providers/authservice/authservice';
import {
  DatabaseConnection,
  DatabaseRows,
  DatabaseService,
} from '../app/services/database.service';
import {
  DarkModeService,
  DarkModeState,
} from '../app/services/dark-mode.service';
import { NetworkService } from '../app/services/network.service';
import { ScreenOrientationService } from '../app/services/screen-orientation.service';

function createDatabaseService(): jasmine.SpyObj<DatabaseService> {
  const connection = jasmine.createSpyObj<DatabaseConnection>(
    'DatabaseConnection',
    ['executeSql']
  );
  connection.executeSql.and.resolveTo({
    rows: new DatabaseRows([]),
    rowsAffected: 0,
  });
  const service = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
    'create',
  ]);
  service.create.and.resolveTo(connection);
  return service;
}

function createDarkModeService(): jasmine.SpyObj<DarkModeService> {
  const state: DarkModeState = {
    globalDarkMode: false,
    readDarkMode: false,
    compareDarkMode: false,
    searchDarkMode: false,
  };
  const service = jasmine.createSpyObj<DarkModeService>(
    'DarkModeService',
    [
      'applyPageDarkMode',
      'updateStatusBar',
      'getCurrentState',
      'toggleGlobalDarkMode',
    ],
    { darkModeState$: of(state) }
  );
  service.getCurrentState.and.returnValue(state);
  service.updateStatusBar.and.resolveTo();
  return service;
}

// Scope external-service substitutes to component tests, not service unit tests.
@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, IonicModule.forRoot()],
  exports: [CommonModule, FormsModule, RouterModule, IonicModule],
  providers: [
    AuthserviceProvider,
    provideHttpClient(withXhr()),
    provideHttpClientTesting(),
    provideRouter([]),
    { provide: DatabaseService, useFactory: createDatabaseService },
    { provide: DarkModeService, useFactory: createDarkModeService },
    {
      provide: NetworkService,
      useFactory: () => {
        const service = jasmine.createSpyObj<NetworkService>(
          'NetworkService',
          ['verifyConnectivity'],
          {
            connected$: of(true),
            disconnected$: of(false),
            actualConnectivity$: of(true),
            connectionType$: of('wifi'),
            isConnected: true,
            connectionType: 'wifi',
          }
        );
        service.verifyConnectivity.and.resolveTo(true);
        return service;
      },
    },
    {
      provide: ScreenOrientationService,
      useFactory: () => {
        const service = jasmine.createSpyObj<ScreenOrientationService>(
          'ScreenOrientationService',
          ['onChange', 'lock', 'unlock'],
          { type: 'portrait-primary' }
        );
        service.onChange.and.returnValue(of('portrait-primary'));
        service.lock.and.resolveTo();
        service.unlock.and.resolveTo();
        return service;
      },
    },
  ],
})
export class PageTestingModule {}
