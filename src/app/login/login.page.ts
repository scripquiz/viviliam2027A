import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { IonLoaderService } from '../ion-loader.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LoginPage {
  public database: DatabaseConnection;
  public slideOpts = {
    initialSlide: 0,
    speed: 300,
    effect: 'flip',
    autoplay: true,
  };
  public email: any = '';
  public password: any = '';
  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';

  constructor(
    public ionLoaderService: IonLoaderService,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    public router: Router,
    public authservice: AuthserviceProvider,
    public platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then(
          (db: DatabaseConnection) => {
            this.database = db;
          },
          (e) => {
            alert('table create error: ' + JSON.stringify(e));
          }
        );
    });
  }
  hideShowPassword() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
  navBack() {
    this.authservice.showsign = 1;
    this.navctrl.back();
  }
  validateLogin() {
    this.email = this.email.split(' ').join('');
    var re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (
      this.email.split(' ').join('') == '' ||
      this.password.split(' ').join('') == ''
    ) {
      //alert("Please enter registered E-mail ID and password");
      this.authservice.showAlert(
        '',
        '',
        'Please enter registered email and password'
      );
    } else if (!re.test(this.email)) {
      this.authservice.showAlert('', '', 'Invalid email');
    } else {
      this.ionLoaderService.simpleLoader('Validating data, please wait...');
      var passwordObfus = this.password.split('&').join('~vivi~amp~');
      passwordObfus = passwordObfus.split('#').join('~vivi~hash~');
      passwordObfus = passwordObfus.split('₹').join('~vivi~inr~');

      var params =
        'user_login_check?email=' +
        this.email +
        '&password=' +
        passwordObfus +
        '&device=android';
      this.authservice.execute_api(params, this.loginCheckResult, this);
    }
  }
  loginCheckResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.authservice.userSignedStatus = 1;
        objThis.authservice.showsign = 1;

        objThis.authservice.userFirsletter = objAllData[0]['firstletter'];
        objThis.authservice.userId = objAllData[0]['userid'];
        objThis.authservice.userName = objAllData[0]['username'];
        var qry;
        qry =
          "UPDATE CONFIG SET value = '" +
          objAllData[0]['userid'] +
          "' WHERE id = 26";
        console.log('udpate user :' + qry);
        objThis.database
          .executeSql(qry)
          .then(() => {
            console.log('userid inserted');
          })
          .catch((e) => {
            console.log(
              'Hot fixes config USERID insert error: ' + JSON.stringify(e)
            );
          });

        qry =
          "UPDATE CONFIG Set value = '" +
          objAllData[0]['fullname'] +
          "' WHERE id = 27";
        console.log('udpate user :' + qry);
        objThis.database
          .executeSql(qry)
          .then(() => {
            console.log('username inserted');
          })
          .catch((e) => {
            console.log(
              'Hot fixes config USERNAME insert error: ' + JSON.stringify(e)
            );
          });
        //objThis.authservice.loginRedirected=0;
        //objThis.navctrl.back();
        objThis.navctrl.setDirection('back');
        objThis.router.navigateByUrl('/tabslink/home');
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
  ionViewDidEnter() {
    this.authservice.showsign = 0;
  }
}
