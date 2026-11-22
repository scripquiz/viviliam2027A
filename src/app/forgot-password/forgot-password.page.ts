import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { Router } from '@angular/router';
import { IonLoaderService } from '../ion-loader.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ForgotPasswordPage {
  public slideOpts = {
    initialSlide: 0,
    speed: 300,
    effect: 'flip',
    autoplay: { delay: 5000 },
    allowTouchMove: false,
  };
  public formsubmitted: any = 0;
  public email: any = '';
  public verificationCode: any = '';
  public verificationcode: any = '';
  public resentVerificationCode: any = '';
  public verificationCodeGeneratedOn: Date;
  public verificationCodeMessage =
    'An email with verification code was just sent to you. Please enter the code.';

  constructor(
    public ionLoaderService: IonLoaderService,
    public navctrl: NavController,
    public authservice: AuthserviceProvider,
    public router: Router
  ) {}

  navBack() {
    this.authservice.showsign = 1;
    this.navctrl.back();
  }

  ionViewDidEnter() {
    this.authservice.showsign = 0;
    this.authservice.userId_ForgotPassword = '';
  }
  validateLogin() {
    this.email = this.email.split(' ').join('');
    var re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (this.email == '') {
      //alert("Enter registered E-Mail ID or username")
      this.authservice.showAlert('', '', 'Enter registered email');
    } else if (this.email.toString() != '' && !re.test(this.email)) {
      this.authservice.showAlert('', '', 'Invalid email');
    } else {
      this.ionLoaderService.simpleLoader('Validating data, please wait...');
      var params =
        'generate_verification_code?userid=' +
        this.email +
        '&method=CP&device=android';
      this.authservice.execute_api(params, this.verificationCodeResult, this);
    }
  }
  verificationCodeResult(status, objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      if (objAllData[0]['status'] == '0') {
        //alert(objAllData[0]["message"]);
        objThis.authservice.showAlert('', '', objAllData[0]['message']);
      } else {
        objThis.verificationCode = objAllData[0]['verification_code'];
        objThis.authservice.userId_ForgotPassword = objAllData[0]['userid'];
        objThis.formsubmitted = 1;
        objThis.verificationCodeGeneratedOn = new Date();
        if (objThis.resentVerificationCode == '1') {
          objThis.verificationCodeMessage =
            'Verification code resent successfully. ' +
            'Please check your email and enter the code.';
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
      this.verificationCodeMessage = 'Verification code expired.';
      this.authservice.showAlert('', '', 'Verification code expired.');
      this.verificationCode = '';
      this.verificationcode = '';
      this.resentVerificationCode = '1';
    } else if (this.verificationCode == this.verificationcode) {
      this.router.navigateByUrl('/change-password');
    } else {
      //alert("Verification code does not matched!.");
      this.authservice.showAlert('', '', 'Wrong code. Please try again.');
    }
  }
}
