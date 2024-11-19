import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/@shared/services/auth.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { environment } from 'src/environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  isLike = false;
  isExpand = false;
  loginForm!: FormGroup;
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  errorCode = '';
  loginMessage = '';
  msg = '';
  type = 'danger';
  theme = '';
  captchaToken = '';
  passwordHidden: boolean = true;
  @ViewChild('captcha', { static: false }) captchaElement: ElementRef;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private sharedService: SharedService,
    private socketService: SocketService
  ) {
    const isVerify = this.route.snapshot.queryParams.isVerify;
    if (isVerify === 'false') {
      this.msg =
        'Please check your email and click the activation link to activate your account.';
      this.type = 'success';
    } else if (isVerify === 'true') {
      this.msg = 'Account activated';
      this.type = 'success';
    }
    this.theme = localStorage.getItem('theme');
  }

  ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      this.router.navigate(['/profile-chats']);
    }

    this.loginForm = this.fb.group({
      Email: [null, [Validators.required]],
      Password: [null, [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    this.loadCloudFlareWidget();
  }

  loadCloudFlareWidget() {
    turnstile?.render(this.captchaElement.nativeElement, {
      sitekey: environment.siteKey,
      theme: this.theme === 'dark' ? 'light' : 'dark',
      callback: function (token) {
        localStorage.setItem('captcha-token', token);
        this.captchaToken = token;
        // console.log(`Challenge Success ${token}`);
        if (!token) {
          this.msg = 'invalid captcha kindly try again!';
          this.type = 'danger';
        }
      },
    });
  }
  togglePasswordVisibility(passwordInput: HTMLInputElement) {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    this.passwordHidden = !this.passwordHidden;
  }

  onSubmit(): void {
    this.spinner.show();
    const token = localStorage.getItem('captcha-token');
    if (!token) {
      this.spinner.hide();
      this.msg = 'Invalid captcha kindly try again!';
      this.type = 'danger';
      return;
    }
    this.authService.customerlogin(this.loginForm.value).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        if (!data.error) {
          this.tokenStorage.saveToken(data?.accessToken);
          // this.tokenStorage.saveUser(data.user);
          localStorage.setItem('profileId', data.user.profileId);
          window.localStorage.user_id = data.user.Id;
          this.sharedService.getUserDetails();
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          this.socketService.connect();
          this.socketService.socket?.emit('online-users');
          this.socketService?.socket?.on('get-users', (data) => {
            data.map((ele) => {
              if (!this.sharedService.onlineUserList.includes(ele.userId)) {
                this.sharedService.onlineUserList.push(ele.userId);
              }
            });
          });
          this.toastService.success('Logged in successfully');
          window.location.reload();
          this.router.navigate(['/profile-chats']);
        } else {
          this.loginMessage = data.mesaage;
          this.spinner.hide();
          this.errorMessage =
            'Invalid Email and Password. Kindly try again !!!!';
          this.isLoginFailed = true;
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.log(err.error);
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
        this.errorCode = err.error.errorCode;
      },
    });
  }

  resend() {
    this.authService
      .userVerificationResend({ username: this.loginForm.value.login_email })
      .subscribe({
        next: (result: any) => {
          this.msg = result.message;
          this.type = 'success';
        },
        error: (error) => {
          this.msg = error.message;
          this.type = 'danger';
        },
      });
  }

  forgotPasswordOpen() {
    const modalRef = this.modalService.open(ForgotPasswordComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.confirmButtonLabel = 'Submit';
    modalRef.componentInstance.closeIcon = true;
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.msg =
          'If the entered email exists you will receive a email to change your password.';
        this.type = 'success';
      }
    });
  }
}
