import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, debounceTime, forkJoin, fromEvent, of } from 'rxjs';
import { ConfirmationModalComponent } from 'src/app/@shared/modals/confirmation-modal/confirmation-modal.component';
import { Customer } from 'src/app/@shared/constant/customer';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
import { environment } from 'src/environments/environment';
import { QrScanModalComponent } from 'src/app/@shared/modals/qrscan-modal/qrscan-modal.component';


@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit, AfterViewInit {
  customer: Customer = new Customer();
  allCountryData: any;
  confirm_password = '';
  msg = '';
  userMail: string;
  profilePic: any = {};
  coverPic: any = {};
  profileId: number;
  userlocalId: number;
  profileData: any = {};
  @ViewChild('zipCode') zipCode: ElementRef;
  uploadListSubject: Subject<void> = new Subject<void>();
  profileImg: any = {
    file: null,
    url: ''
  };
  profileCoverImg: any = {
    file: null,
    url: ''
  };
  isNotificationSoundEnabled: boolean = true;
  authToken: string;
  // qrLink = '';

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private tokenStorage: TokenStorageService,
    public sharedService: SharedService,
    private toastService: ToastService,
    private uploadService: UploadFilesService,
  ) {}

  ngOnInit(): void {
    if (!this.tokenStorage.getToken()) {
      this.router.navigate([`/login`]);
    }
    this.modalService.dismissAll();
    // const notificationSound = JSON.parse(localStorage.getItem('soundPreferences'))?.notificationSoundEnabled;
    // if (notificationSound === 'N') {
    //   this.isNotificationSoundEnabled = false
    // }
    this.sharedService.loginUserInfo.subscribe((user) => {
      this.isNotificationSoundEnabled = user?.tagNotificationSound === 'Y' ? true : false;
      this.userlocalId = +user.UserID;
      this.profileId = +user.Id;
      this.userMail = user.Email;
      if (this.profileId) {
        this.getProfile(this.profileId);
        this.authToken = localStorage.getItem('auth-token');
      }
      // this.qrLink = `${environment.qrLink}${this.userlocalId}?token=${this.authToken}`;
    });
  }

  ngAfterViewInit(): void {
    fromEvent(this.zipCode.nativeElement, 'input')
      .pipe(debounceTime(1000))
      .subscribe((event) => {
        this.onZipChange(event['target'].value);
      });
  }

  notificationSound() {
    // const soundOct = JSON.parse(localStorage.getItem('soundPreferences')) || {};
    // if (soundOct.notificationSoundEnabled === 'Y') {
    //   soundOct.notificationSoundEnabled = 'N';
    // } else {
    //   soundOct.notificationSoundEnabled = this.isNotificationSoundEnabled ? 'Y' : 'N';
    // }
    // localStorage.setItem('soundPreferences', JSON.stringify(soundOct));
    this.isNotificationSoundEnabled != this.isNotificationSoundEnabled;
    const soundObj = {
      property: 'tagNotificationSound',
      value: this.isNotificationSoundEnabled ? 'Y' : 'N',
    };
    this.customerService.updateNotificationSound(soundObj).subscribe({
      next: (res) => {
        // console.log(res);
        this.toastService.success(res.message);
        this.sharedService.getUserDetails();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getUserDetails(id): void {
    this.spinner.show();
    this.customerService.getCustomer(id).subscribe(
      (data: any) => {
        if (data) {
          this.spinner.hide();
          this.customer = data;
          // console.log(data);
          this.getAllCountries();
        }
      },
      (err) => {
        this.spinner.hide();
        console.log(err);
      }
    );
  }

  validatepassword() {
    const pattern =
      '(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9].*[0-9]).{8}';
    if (!this.customer.Password.match(pattern)) {
      this.msg =
        'Password must be a minimum of 8 characters and include one uppercase letter, one lowercase letter and one special character';
    }
    if (this.customer.Password !== this.confirm_password) {
      this.msg = 'Passwords does not match.';
      return false;
    }

    return true;
  }

  changeCountry() {
    this.customer.Zip = '';
    this.customer.State = '';
    this.customer.City = '';
    this.customer.County = '';
    // this.customer.Place = '';
  }

  changetopassword(event) {
    event.target.setAttribute('type', 'password');
    this.msg = '';
  }

  getAllCountries() {
    this.customerService.getCountriesData().subscribe(
      {
        next: (result) => {
          this.allCountryData = result;
        },
        error:
          (error) => {
            console.log(error);
          }
      });
  }

  onZipChange(event) {
    this.customerService.getZipData(event, this.customer?.Country).subscribe(
      {
        next: (data) => {
          let zip_data = data[0];
          this.customer.State = zip_data ? zip_data.state : '';
          this.customer.City = zip_data ? zip_data.city : '';
          this.customer.County = zip_data ? zip_data.places : '';
          // this.customer.Place = zip_data ? zip_data.places : '';
        },
        error:
          (err) => {
            console.log(err);
          }
      });
  }

  confirmAndUpdateCustomer(): void {
    if (this.profileId) {
      const modalRef = this.modalService.open(ConfirmationModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.title = 'Update Profile';
      modalRef.componentInstance.confirmButtonLabel = 'Update';
      modalRef.componentInstance.cancelButtonLabel = 'Cancel';
      modalRef.componentInstance.message = 'Are you sure want to update profile details?';

      modalRef.result.then((res) => {
        if (res === 'success') {
          this.uploadImgAndUpdateCustomer();
        }
      });
    }

  }

  uploadImgAndUpdateCustomer(): void {
    let uploadObs = {};
    if (this.profileImg?.file?.name) {
      uploadObs['profileImg'] = this.uploadService.uploadFile(this.profileImg?.file);
    }

    if (this.profileCoverImg?.file?.name) {
      uploadObs['profileCoverImg'] = this.uploadService.uploadFile(this.profileCoverImg?.file);
    }

    if (Object.keys(uploadObs)?.length > 0) {
      this.spinner.show();

      forkJoin(uploadObs).subscribe({
        next: (res: any) => {
          // console.log(res);
          if (res?.profileImg?.body?.url) {
            this.profileImg['file'] = null;
            this.profileImg['url'] = res?.profileImg?.body?.url;
            this.sharedService['userData']['ProfilePicName'] = this.profileImg['url'];
          }

          if (res?.profileCoverImg?.body?.url) {
            this.profileCoverImg['file'] = null;
            this.profileCoverImg['url'] = res?.profileCoverImg?.body?.url;
            this.sharedService['userData']['CoverPicName'] = this.profileCoverImg['url'];
          }

          this.updateCustomer();
          this.spinner.hide();
        },
        error: (err) => {
          this.spinner.hide();
        },
      });
    } else {
      this.updateCustomer();
    }
  }

  updateCustomer(): void {
    if (this.profileId) {
      this.spinner.show();
      this.customer.ProfilePicName = this.profileImg?.url || this.customer.ProfilePicName;
      this.customer.CoverPicName = this.profileCoverImg?.url || this.customer.CoverPicName;
      this.customer.IsActive = 'Y';
      this.customer.UserID = this.userlocalId;
      // console.log('update', this.customer)
      this.customerService.updateProfile(this.profileId, this.customer).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (!res.error) {
            this.toastService.success(res.message);
            this.sharedService.getUserDetails();
          } else {
            this.toastService.danger(res?.message);
          }
        },
        error: (error) => {
          console.log(error.error.message);
          this.spinner.hide();
          this.toastService.danger(error.error.message);
        }
      });
    }
  }

  getProfile(id): void {
    this.spinner.show();
    this.customerService.getProfile(id).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.data) {
          this.customer = res.data[0];
          // console.log(this.customer)
          this.getAllCountries();
        }
      },
      error:
        (error) => {
          this.spinner.hide();
          console.log(error);
        }
    });
  }

  onProfileImgChange(event: any): void {
    this.profileImg = event;
  }

  onProfileCoverImgChange(event: any): void {
    this.profileCoverImg = event;
  }

  deleteAccount(): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Delete Account';
    modalRef.componentInstance.confirmButtonLabel = 'Delete';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message =
      'Are you sure want to delete your account?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.customerService.deleteCustomer(this.userlocalId, this.profileId).subscribe({
          next: (res: any) => {
            if (res) {
              this.toastService.success(res.message || 'Account deleted successfully');
              this.tokenStorage.signOut();
              this.router.navigateByUrl('register');
            }
          },
          error: (error) => {
            console.log(error);
            this.toastService.success(error.message);
          },
        });
      }
    });
  }
  onChangeTag(event) {
    this.customer.Username = event.target.value.replaceAll(' ', '').replaceAll(/\s*,+\s*/g, ',');
    // console.log(this.customer.Username);
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/\s/g, '');
    inputElement.value = inputValue.toUpperCase();
  }
  openAppQR(store: string){
    const modalRef = this.modalService.open(QrScanModalComponent, {
      centered: true,
      size: 'sm',
    });
    if (store === 'googlePlay') {
      modalRef.componentInstance.store = 'https://play.google.com/store/apps/';
      modalRef.componentInstance.image = '/assets/images/logos/googlePlay.png';
    } else {
      modalRef.componentInstance.store = 'https://apps.apple.com/us/app/apple-store/id375380948';
      modalRef.componentInstance.image = '/assets/images/logos/appStore.png';
    }
  }
}