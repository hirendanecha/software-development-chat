import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomerService } from './customer.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  isDark = true;
  userData: any = {};
  notificationList: any = [];
  isNotify = false;
  onlineUserList: any = [];

  private isRoomCreatedSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private bc = new BroadcastChannel('user_data_channel');
  loginUserInfo = new BehaviorSubject<any>(null);
  loggedInUser$ = this.loginUserInfo.asObservable();
  callId: string;

  //trigger invite to chat modal
  private openModalSubject = new Subject<void>();
  openModal$ = this.openModalSubject.asObservable();

  constructor(
    public modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private customerService: CustomerService,
    private route: ActivatedRoute
  ) {
    if (localStorage.getItem('theme') === 'dark') {
      this.changeDarkUi();
    } else {
      this.changeLightUi();
    }
    this.bc.onmessage = (event) => {
      this.loginUserInfo.next(event.data);
    };
  }

  changeDarkUi() {
    this.isDark = true;
    document.body.classList.remove('dark-ui');
    // document.body.classList.add('dark-ui');
    localStorage.setItem('theme', 'dark');
  }

  changeLightUi() {
    this.isDark = false;
    document.body.classList.add('dark-ui');
    // document.body.classList.remove('dark-ui');
    localStorage.setItem('theme', 'light');
  }

  toggleUi(): void {
    if (this.isDark) {
      this.changeLightUi();
    } else {
      this.changeDarkUi();
    }
  }

  getUserDetails() {
    const profileId = localStorage.getItem('profileId');
    if (profileId) {
      // const localUserData = JSON.parse(localStorage.getItem('userData'));
      // if (localUserData?.ID) {
      //   this.userData = localUserData;
      // }

      this.spinner.show();

      this.customerService.getProfile(profileId).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          const data = res?.data?.[0];

          if (data) {
            this.userData = data;
            // localStorage.setItem('userData', JSON.stringify(this.userData));
            this.getLoginUserDetails(data);
            this.bc.postMessage(data);
          }
        },
        error: (error) => {
          this.spinner.hide();
          console.log(error);
        },
      });
    }
  }

  isUserMediaApproved(): boolean {
    return this.userData?.MediaApproved === 1;
  }

  getNotificationList() {
    const id = localStorage.getItem('profileId');
    const data = {
      page: 1,
      size: 20,
    };
    this.customerService.getNotificationList(Number(id), data).subscribe({
      next: (res: any) => {
        this.isNotify = false;
        this.notificationList = res?.data;
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  updateIsRoomCreated(value: boolean): void {
    this.isRoomCreatedSubject.next(value);
  }

  // Method to get an Observable that emits isRoomCreated changes
  getIsRoomCreatedObservable(): Observable<boolean> {
    return this.isRoomCreatedSubject.asObservable();
  }

  getLoginUserDetails(userData: any = {}) {
    this.loginUserInfo.next(userData);
  }

  generateSessionKey(): void {
    const sessionKey = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('uniqueSessionKey', sessionKey);
  }

  isCorrectBrowserSession(): boolean {
    const sessionKey = sessionStorage.getItem('uniqueSessionKey');
    if (sessionKey) {
      sessionStorage.removeItem('uniqueSessionKey');
      return true;
    }
    return false;
  }

  triggerOpenModal() {
    this.openModalSubject.next();
  }
}
