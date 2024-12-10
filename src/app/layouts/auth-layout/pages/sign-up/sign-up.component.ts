import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, fromEvent } from 'rxjs';
import { Customer } from 'src/app/@shared/constant/customer';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
import { environment } from 'src/environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, AfterViewInit {
  customer = new Customer();
  useDetails: any = {};
  isRegister = false;
  registrationMessage = '';
  confirm_password = '';
  msg = '';
  userId = '';
  submitted = false;
  allCountryData: any;
  type = 'danger';
  defaultCountry = 'US';
  profilePic: string;
  profileImg: any = {
    file: null,
    url: '',
  };
  allStateData: any;

  @ViewChild('zipCode') zipCode: ElementRef;
  captchaToken = '';

  registerForm = new FormGroup({
    FirstName: new FormControl(''),
    LastName: new FormControl(''),
    Username: new FormControl('', [Validators.required]),
    Email: new FormControl('', [Validators.required]),
    Password: new FormControl('', [Validators.required]),
    confirm_password: new FormControl('', [Validators.required]),
    MobileNo: new FormControl(''),
    Country: new FormControl('US', [Validators.required]),
    Zip: new FormControl('', [Validators.required]),
    State: new FormControl('', [Validators.required]),
    City: new FormControl(''),
    County: new FormControl(''),
    TermAndPolicy: new FormControl(false, Validators.required),
  });
  theme = localStorage.getItem('theme') || '';
  passwordHidden: boolean = true;
  confirmPasswordHidden: boolean = true;

  @ViewChild('captcha', { static: false }) captchaElement: ElementRef;

  constructor(
    private spinner: NgxSpinnerService,
    private customerService: CustomerService,
    private router: Router,
    private uploadService: UploadFilesService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.getAllCountries();
  }

  ngAfterViewInit(): void {
    // this.loadCloudFlareWidget();
  }
  loadCloudFlareWidget() {
    turnstile?.render(this.captchaElement.nativeElement, {
      sitekey: environment.siteKey,
      theme: this.theme === 'dark' ? 'light' : 'dark',
      callback: function (token) {
        localStorage.setItem('captcha-token', token);
        if (!token) {
          this.showMessage('Invalid captcha, kindly try again!', 'danger');
        }
      },
    });
  }

  togglePasswordVisibility(passwordInput: HTMLInputElement) {
    passwordInput.type =
      passwordInput.type === 'password' ? 'text' : 'password';
    this.passwordHidden = !this.passwordHidden;
  }

  toggleConfirmPasswordVisibility(confirmPasswordInput: HTMLInputElement) {
    confirmPasswordInput.type =
      confirmPasswordInput.type === 'password' ? 'text' : 'password';
    this.confirmPasswordHidden = !this.confirmPasswordHidden;
  }

  selectFiles(event) {
    this.profileImg = event;
  }

  upload(file: any = {}) {
    if (file) {
      this.spinner.show();
      this.uploadService.uploadFile(file).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.body) {
            this.profilePic = res?.body?.url;
            this.createProfile(this.registerForm.value);
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.profileImg = { file: null, url: '' };
          this.showMessage('Could not upload the file', 'danger');
        },
      });
    } else {
      this.createProfile(this.registerForm.value);
    }
  }

  save() {
    // const token = localStorage.getItem('captcha-token');
    // if (!token) {
    //   this.showMessage('Invalid captcha, kindly try again!', 'danger');
    //   return;
    // }
    if (this.registerForm.valid) {
      this.spinner.show();
      this.customerService.createCustomer(this.registerForm.value).subscribe({
        next: (data: any) => {
          this.spinner.hide();
          if (!data.error) {
            this.submitted = true;
            sessionStorage.setItem('user_id', data.data);
            this.registrationMessage =
              'Account registered successfully! Please log in.';
            this.isRegister = true;
            this.upload(this.profileImg?.file);
            this.router.navigateByUrl('/login?isVerify=false');
          }
        },
        error: (err) => {
          this.showMessage(err.error.message, 'danger');
          this.spinner.hide();
        },
      });
    } else {
      this.showMessage('Please fill in the required fields.', 'danger');
    }
  }

  validateEmail() {
    const emailControl = this.registerForm.get('Email');
    const emailError = Validators.email(emailControl);
    if (emailError) {
      this.showMessage('Please enter a valid email address.', 'danger');
      return false;
    }
    return true;
  }

  validatepassword(): boolean {
    const pattern = '.{5,}';
    if (!this.registerForm.get('Password').value.match(pattern)) {
      this.showMessage('Password must be a minimum of 5 characters', 'danger');
      return false;
    }
    if (
      this.registerForm.get('Password').value !==
      this.registerForm.get('confirm_password').value
    ) {
      this.showMessage('Passwords do not match', 'danger');
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (!this.validateEmail()) {
      return;
    }
    if (!this.validatepassword()) {
      return;
    }
    if (this.registerForm.valid) {
      this.save();
    } else {
      this.showMessage('Please fill in all required fields.', 'danger');
    }
  }

  changeCountry() {
    this.registerForm.get('Zip').setValue('');
    this.registerForm.get('State').setValue('');
    this.registerForm.get('City').setValue('');
    this.registerForm.get('County').setValue('');
  }

  getAllCountries() {
    this.spinner.show();

    this.customerService.getCountriesData().subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allCountryData = result;
        this.getAllState(this.registerForm.get('Country').value);
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.getAllState(target.value);
  }

  getAllState(country: string) {
    this.customerService.getStateData(country).subscribe({
      next: (result) => {
        this.allStateData = result;
        this.registerForm.get('State').setValue(result[0]?.state);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  onZipChange(event) {
    this.spinner.show();
    this.customerService
      .getZipData(event, this.registerForm.get('Country').value)
      .subscribe(
        (data) => {
          if (data[0]) {
            const zipData = data[0];
            this.registerForm.get('State').enable();
            this.registerForm.get('City').enable();
            this.registerForm.get('County').enable();
            this.registerForm.patchValue({
              State: zipData.state,
              City: zipData.city,
              County: zipData.places,
            });
          } else {
            this.registerForm.get('State').disable();
            this.registerForm.get('City').disable();
            this.registerForm.get('County').disable();
            this.toastService.danger(data?.message);
          }

          this.spinner.hide();
        },
        (err) => {
          this.spinner.hide();
          console.log(err);
        }
      );
  }

  changetopassword(event) {
    event.target.setAttribute('type', 'password');
    this.msg = '';
  }

  createProfile(data) {
    this.spinner.show();
    const profile = {
      Username: data?.Username,
      FirstName: data?.FirstName,
      LastName: data?.LastName,
      Address: data?.Address,
      Country: data?.Country,
      City: data?.City,
      State: data?.State,
      County: data?.County,
      Zip: data?.Zip,
      MobileNo: data?.MobileNo,
      UserID: window?.sessionStorage?.user_id,
      IsActive: 'N',
      ProfilePicName: this.profilePic || null,
    };
    // console.log(profile);

    this.customerService.createProfile(profile).subscribe({
      next: (data: any) => {
        this.spinner.hide();

        if (data) {
          const profileId = data.data;
          localStorage.setItem('profileId', profileId);
        }
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }

  clearProfileImg(event: any): void {
    event.stopPropagation();
    event.preventDefault();

    this.profileImg = {
      file: null,
      url: '',
    };
  }

  scrollTop(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
  onChangeTag(event) {
    this.registerForm
      .get('Username')
      .setValue(
        event.target.value.replaceAll(' ', '').replaceAll(/\s*,+\s*/g, ',')
      );
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/\s/g, '');
    inputElement.value = inputValue.toUpperCase();
  }

  showMessage(msg: string, type: string) {
    this.registrationMessage = msg;
    this.type = type;
    this.scrollTop();
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    let listener = (e: ClipboardEvent) => {
      let clipboard = e.clipboardData || window['clipboardData'];
      clipboard.setData('text', 'support@SoftwareDevelopment.chat');
      e.preventDefault();
      this.toastService.success('Email address copied');
    };
    document.addEventListener('copy', listener, false);
    document.execCommand('copy');
    document.removeEventListener('copy', listener, false);
  }
}
