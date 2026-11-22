import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class IonLoaderService {

  constructor(public loadingController: LoadingController) { }

  // Updated simpleLoader with safety timeout and existing loader check
  simpleLoader(message: string = "Please wait...") {
    // First check if a loader is already present
    this.loadingController.getTop().then(loader => {
      // Dismiss any existing loaders first
      if (loader) {
        this.dismissLoader();
      }

      // Create and present the new loader
      this.loadingController.create({
        message: message,
        cssClass: 'custom-loader-class',
        backdropDismiss: false
      }).then((response) => {
        response.present();

        // Safety timeout - never show loader for more than 10 seconds
        // This prevents loaders from being stuck forever
        setTimeout(() => {
          this.dismissLoader();
        }, 10000);
      });
    });
  }

  // Dismiss loader with improved reliability
  async dismissLoader() {
    // Try to dismiss immediately
    this.checkAndCloseLoader();

    // Sometimes there's delay in finding the loader.
    // Check if the loader is closed after one second. If not closed, proceed to close again
    setTimeout(() => this.checkAndCloseLoader(), 1000);
  }

  // Helper method to check and close loaders
  async checkAndCloseLoader() {
    try {
      // Use getTop function to find the loader and dismiss only if loader is present
      const loader = await this.loadingController.getTop();

      // If loader present then dismiss
      if (loader !== undefined) {
        await this.loadingController.dismiss();
        console.log('Loader dismissed successfully');
      }
    } catch (err) {
      console.log('Error dismissing loader:', err);
    }
  }
}