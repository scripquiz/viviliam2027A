import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { Router } from '@angular/router';
import { IonLoaderService } from '../ion-loader.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ChangePasswordPage {
  public oldpassword: any = '';
  public newpassword: any = '';
  public retypepassword: any = '';
  public PageTitle: any = '';
  oldPasswordType: string = 'password';
  oldPasswordIcon: string = 'eye-off';

  newPasswordType: string = 'password';
  newPasswordIcon: string = 'eye-off';

  confirmPasswordType: string = 'password';
  confirmPasswordIcon: string = 'eye-off';
  constructor(
    public ionLoaderService: IonLoaderService,
    public navctrl: NavController,
    public authservice: AuthserviceProvider,
    public router: Router
  ) {}

  navBack() {
    this.authservice.showsign = 1;
    this.navctrl.back();
    this.navctrl.navigateRoot('/tabslink/home');
  }
  ionViewDidEnter() {
    this.authservice.showsign = 0;
    if (this.authservice.userId_ForgotPassword == '') {
      this.PageTitle = 'Change Password';
    } else {
      this.PageTitle = 'Reset Password';
    }
  }
  hideShowOldPassword() {
    this.oldPasswordType =
      this.oldPasswordType === 'text' ? 'password' : 'text';
    this.oldPasswordIcon =
      this.oldPasswordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  hideShowNewPassword() {
    this.newPasswordType =
      this.newPasswordType === 'text' ? 'password' : 'text';
    this.newPasswordIcon =
      this.newPasswordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  hideShowConfirmPassword() {
    this.confirmPasswordType =
      this.confirmPasswordType === 'text' ? 'password' : 'text';
    this.confirmPasswordIcon =
      this.confirmPasswordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
  updatePassword() {
    if (this.authservice.userId_ForgotPassword == '') {
      if (
        this.oldpassword == '' ||
        this.newpassword == '' ||
        this.retypepassword == ''
      ) {
        //alert("Enter all values");
        this.authservice.showAlert('', '', 'Enter all values');
      } else if (
        this.oldpassword.length < 6 ||
        this.newpassword.length < 6 ||
        this.retypepassword.length < 6
      ) {
        this.authservice.showAlert(
          '',
          '',
          'Password should be minimum 6 characters'
        );
      } else if (this.newpassword != this.retypepassword) {
        this.authservice.showAlert(
          '',
          '',
          'Password and confirm password does not match!'
        );
      } else {
        this.ionLoaderService.simpleLoader('Submitting data, please wait...');
        var oldpasswordObfus = this.oldpassword.split('&').join('~vivi~amp~');
        oldpasswordObfus = oldpasswordObfus.split('#').join('~vivi~hash~');
        oldpasswordObfus = oldpasswordObfus.split('₹').join('~vivi~inr~');

        var newpasswordObfus = this.newpassword.split('&').join('~vivi~amp~');
        newpasswordObfus = newpasswordObfus.split('#').join('~vivi~hash~');
        newpasswordObfus = newpasswordObfus.split('₹').join('~vivi~inr~');

        var retypepasswordObfus = this.retypepassword
          .split('&')
          .join('~vivi~amp~');
        retypepasswordObfus = retypepasswordObfus
          .split('#')
          .join('~vivi~hash~');
        retypepasswordObfus = retypepasswordObfus.split('₹').join('~vivi~inr~');

        var params =
          'user_change_password?userid=' +
          this.authservice.userId +
          '&oldpassword=' +
          oldpasswordObfus +
          '&password=' +
          newpasswordObfus +
          '&retypepassword=' +
          retypepasswordObfus +
          '&method=CP&device=android';
        this.authservice.execute_api(params, this.changePasswordResult, this);
      }
    } else {
      if (this.newpassword == '' || this.retypepassword == '') {
        //alert("Enter all values");
        this.authservice.showAlert('', '', 'Enter all values');
      } else if (
        this.newpassword.length < 6 ||
        this.retypepassword.length < 6
      ) {
        this.authservice.showAlert(
          '',
          '',
          'Password should be minimum 6 characters'
        );
      } else if (this.newpassword != this.retypepassword) {
        this.authservice.showAlert(
          '',
          '',
          'Password and confirm password does not match!'
        );
      } else {
        this.ionLoaderService.simpleLoader('Submitting data, please wait...');

        var newpasswordObfus = this.newpassword.split('&').join('~vivi~amp~');
        newpasswordObfus = newpasswordObfus.split('#').join('~vivi~hash~');
        newpasswordObfus = newpasswordObfus.split('₹').join('~vivi~inr~');

        var oldpasswordObfus = this.oldpassword.split('&').join('~vivi~amp~');
        oldpasswordObfus = oldpasswordObfus.split('#').join('~vivi~hash~');
        oldpasswordObfus = oldpasswordObfus.split('₹').join('~vivi~inr~');

        var params =
          'user_change_password?userid=' +
          this.authservice.userId_ForgotPassword +
          '&password=' +
          newpasswordObfus +
          '&oldpassword=' +
          oldpasswordObfus +
          '&method=RP&device=android';
        this.authservice.execute_api(params, this.changePasswordResult, this);
      }
    }
  }
  changePasswordResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        //alert("Password updated successfully! Login now");
        objThis.authservice.showAlert(
          '',
          '',
          'Password updated successfully. Login now.'
        );
        objThis.router.navigateByUrl('/login');
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
