import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController, Platform, AlertController } from '@ionic/angular';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { IonLoaderService } from '../ion-loader.service';
import { Router } from '@angular/router';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.page.html',
  styleUrls: ['./myaccount.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MyaccountPage {
  public database: DatabaseConnection;
  public name: any = '';
  public email: any = '';
  public mobile: any = '';
  public country: any = '';
  public gender: any = '';
  public dob: Date;
  public countryToggleRefreshed = false;
  public genderToggleRefreshed = false;

  constructor(
    public alertController: AlertController,
    public databaseService: DatabaseService,
    public platform: Platform,
    public ionLoaderService: IonLoaderService,
    public navctrl: NavController,
    public authservice: AuthserviceProvider,
    public router: Router
  ) {
    this.platform.ready().then(() => {
      //this.ionLoaderService.simpleLoader("Fetching data, please wait...");
      var params =
        'signup_details?userid=' + this.authservice.userId + '&device=ANDROID';
      //var params = "signup_details?userid=751CE5B3-AA79-46F8-9DED-E14CAE911367&device=ANDROID";
      this.authservice.execute_api(params, this.signup_details_RESULT, this);
    });
  }
  signup_details_RESULT(status, objAllData, objThis) {
    objThis.countryToggleRefreshed = false;
    objThis.genderToggleRefreshed = false;
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.name = objAllData[0]['name'];
        objThis.mobile = objAllData[0]['mobile'];
        objThis.email = objAllData[0]['email'];
        objThis.country = objAllData[0]['location'];
        objThis.gender = objAllData[0]['gender'];
        objThis.dob = objAllData[0]['dob'];

        objThis.countryToggleRefreshed = true;
        objThis.genderToggleRefreshed = true;
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }

  navBack() {
    this.authservice.showsign = 1;
    this.navctrl.back();
  }
  ionViewDidEnter() {
    this.authservice.showsign = 0;
  }
  ionViewDidLeave() {
    this.authservice.showsign = 1;
  }
  validateData() {
    var re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var numbers = new RegExp(/^[0-9]+$/);
    var date1 = new Date(this.dob);
    var date2 = new Date();

    var Time = date2.getTime() - date1.getTime();
    var Days = Time / (1000 * 3600 * 24); //Diference in Days
    if (this.name == '') {
      this.authservice.showAlert(
        'Input Required',
        '',
        'Name should not be empty'
      );
    } else if (this.email.toString() != '' && !re.test(this.email)) {
      this.authservice.showAlert('', '', 'Invalid email');
    } else if (
      this.mobile.toString() != '' &&
      (this.mobile.toString().length != 10 || !numbers.test(this.mobile))
    ) {
      this.authservice.showAlert('Mobie Number', '', 'Invalid mobile number');
    } else if (Days < 365 * 13) {
      this.authservice.showAlert('DOB', '', 'Age should be minimum 13 years');
    } else {
      this.ionLoaderService.simpleLoader('Saving data, please wait...');
      var params =
        'edit_profile?userid=' +
        this.authservice.userId +
        '&method=signup&username=' +
        this.name +
        '&gender=' +
        this.gender +
        '&dob=' +
        (date1.getMonth() + 1).toString() +
        '/' +
        date1.getDate().toString() +
        '/' +
        date1.getFullYear().toString() +
        '&emailid=' +
        this.email +
        '&mobile=' +
        this.mobile +
        '&location=' +
        this.country +
        '&device=android';
      this.authservice.execute_api(params, this.signupResult, this);
    }
  }

  signupResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.authservice.showAlert(
          '',
          '',
          'Profile data updated successfully.'
        );
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
  deleteAccount() {
    this.showConfirm();
  }
  showConfirm() {
    this.alertController
      .create({
        header: 'Confirm Alert',
        subHeader:
          'Your account will be removed from the system. Your Highlights, Bookmarks, and Notes will be permanently deleted.',
        message: 'Are you sure? Do you want to delete your account?',
        cssClass: 'custom-confirm',
        buttons: [
          {
            text: 'YES',
            handler: () => {
              this.doDeleteAccount();
            },
          },
          {
            text: 'NO',
            handler: () => {},
          },
        ],
      })
      .then((res) => {
        res.present();
      });
  }
  doDeleteAccount() {
    this.ionLoaderService.simpleLoader('Validating data, please wait...');
    var params =
      'delete_account?userid=' + this.authservice.userId + '&device=android';
    this.authservice.execute_api(params, this.deleteaccountResult, this);
  }
  deleteaccountResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.databaseService
          .create({
            name: 'viviliam.db',
            location: 'default',
          })
          .then((db: DatabaseConnection) => {
            console.log('DB created');
            objThis.database = db;
            objThis.database
              .executeSql(
                "UPDATE vers SET notes = '', textHighlight='', bookMark=0",
                []
              )
              .then((data) => {
                objThis.database
                  .executeSql("UPDATE CONFIG SET value = '' WHERE id = 26", [])
                  .then((data) => {
                    objThis.database
                      .executeSql(
                        "UPDATE CONFIG SET value = '' WHERE id = 27",
                        []
                      )
                      .then((data) => {
                        objThis.authservice.userSignedStatus = 0;
                        objThis.authservice.userId = '';
                        objThis.authservice.userFirsletter = '';
                        objThis.authservice.showAlert(
                          '',
                          '',
                          objAllData[0]['message']
                        );
                        objThis.router.navigateByUrl('/tabslink/home');
                      });
                  });
              });
          });
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
}
