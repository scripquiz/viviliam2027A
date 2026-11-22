import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { IonLoaderService } from '../ion-loader.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SignupPage {
  public name: any = '';
  public email: any = '';
  public mobile: any = '';
  public city: any = '';
  public password: any = '';
  public confirmpassword: any = '';
  public formsubmitted: any = 0;
  public verificationcode: any = '';
  public verificationCode: any = '';
  public tempUserId: any = '';
  public resentVerificationCode: any = '';
  public verificationCodeGeneratedOn: Date;
  public verificationCodeMessage =
    'A verification code has been sent to your email. Please enter the code.';
  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';
  confirmPasswordType: string = 'password';
  confirmPasswordIcon: string = 'eye-off';
  constructor(
    public ionLoaderService: IonLoaderService,
    public navctrl: NavController,
    public authservice: AuthserviceProvider,
    public router: Router
  ) {}

  navBack() {
    this.navctrl.back();
  }
  ionViewDidEnter() {
    this.authservice.currentPage = 'SIGNUP';
    this.authservice.showsign = 0;
  }
  hideShowPassword() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
  hideShowConfirmPassword() {
    this.confirmPasswordType =
      this.confirmPasswordType === 'text' ? 'password' : 'text';
    this.confirmPasswordIcon =
      this.confirmPasswordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
  validateData() {
    this.email = this.email.split(' ').join('');
    var re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var numbers = new RegExp(/^[0-9]+$/);
    if (this.name == '' || this.email == '' || this.password == '') {
      this.authservice.showAlert(
        'Input Required',
        '',
        'All fields are required'
      );
    } else if (!re.test(this.email)) {
      this.authservice.showAlert('Email ID', '', 'Invalid email');
    } else if (this.password.length < 6 || this.confirmpassword.length < 6) {
      this.authservice.showAlert(
        '',
        '',
        'Password should be atleast 6 characters'
      );
    } else if (this.password != this.confirmpassword) {
      this.authservice.showAlert(
        'Input Error',
        '',
        'Password and confirm password does not match!'
      );
    } else {
      this.ionLoaderService.simpleLoader('Saving data, please wait...');
      var passwordObfus = this.password.split('&').join('~vivi~amp~');
      passwordObfus = passwordObfus.split('#').join('~vivi~hash~');
      passwordObfus = passwordObfus.split('₹').join('~vivi~inr~');

      var params =
        'signup?method=signup&username=' +
        this.name +
        '&emailid=' +
        this.email +
        '&mobile=' +
        this.mobile +
        '&location=' +
        this.city +
        '&password=' +
        passwordObfus +
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
        objThis.formsubmitted = 1;
        objThis.verificationCode = objAllData[0]['verification_code'];
        objThis.tempUserId = objAllData[0]['userid'];
        objThis.verificationCodeGeneratedOn = new Date();
        if (objThis.resentVerificationCode == '1') {
          objThis.verificationCodeMessage =
            'Verification code resent successfully. ' +
            'Please enter the code.';
          objThis.resentVerificationCode = '0';
        }
      }
    } else {
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }
  validateVerificationCode() {
    var endDate = new Date();
    var seconds =
      (endDate.getTime() - this.verificationCodeGeneratedOn.getTime()) / 1000;
    if (seconds > 600) {
      this.authservice.showAlert('', '', 'Verification code expired.');
      this.verificationCode = '';
      this.verificationcode = '';
      this.resentVerificationCode = '1';
      //this.validateData();
    } else if (this.verificationCode == this.verificationcode) {
      this.ionLoaderService.simpleLoader('Updating, please wait...');
      var params =
        'signup_verification?&userid=' + this.tempUserId + '&device=Android';
      this.authservice.execute_api(
        params,
        this.signup_verificationResult,
        this
      );
    } else {
      this.authservice.showAlert('', '', 'Wrong verification code.');
    }
  }
  signup_verificationResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        alert(objAllData[0]['message']);
      } else {
        alert('New account created successfully. Login now');
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
