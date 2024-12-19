import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';

@Component({
  selector: 'app-notifications-modal',
  templateUrl: './notifications-modal.component.html',
  styleUrls: ['./notifications-modal.component.scss'],
})
export class NotificationsModalComponent implements AfterViewInit {
  originalFavicon: HTMLLinkElement;
  @ViewChild('notificationArea') notificationArea: ElementRef;

  constructor(
    public sharedService: SharedService,
    private activeModal: NgbActiveModal,
    private activeOffcanvas: NgbActiveOffcanvas,
    private customerService: CustomerService,
    private router: Router,
    private socketService: SocketService,
    public activeOffCanvas: NgbActiveOffcanvas
  ) {
    this.sharedService.getNotificationList();
    this.originalFavicon = document.querySelector('link[rel="icon"]');
  }

  ngAfterViewInit(): void {
    const profileId = +localStorage.getItem('profileId');
    this.socketService.readNotification({ profileId }, (data) => {});
    setTimeout(() => {
      if (this.notificationArea) {
        this.notificationArea.nativeElement.scrollTop = 0;
      }
    });
  }

  readUnreadNotification(postId: string, notification: any = {}): void {
    this.customerService
      .readUnreadNotification(notification.id, 'Y')
      .subscribe({
        next: (res) => {
          // const type = ['M', 'SC', 'DC', 'VC']
          // if (type.includes(notification?.actionType)) {
          //   this.router.navigate([`profile-chats`]);
          // } else {
          //   this.router.navigate([`post/${postId}`]);
          // }
          // window.open(`post/${postId}`.toString(), '_blank')
        },
      });
    if (!notification?.postId) {
      this.selectMessaging(notification);
    }
    this.closeModal();
  }

  closeModal(): void {
    this.activeModal?.dismiss();
    this.activeOffcanvas?.dismiss();
  }

  selectMessaging(data) {
    const userData = {
      Id: data.notificationByProfileId,
      ProfilePicName:
        data.profileImage ||
        data.ProfilePicName ||
        '/assets/images/avtar/placeholder-user.png',
      Username: data.Username,
      GroupId: data.groupId,
      GroupName: data.groupName,
    };
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    const url = this.router
      .createUrlTree(['/profile-chats'], {
        queryParams: { chatUserData: encodedUserData },
      })
      .toString();
    this.router.navigateByUrl(url);
    // if (!data?.groupId) {
    // } else {
    //   const url = this.router.serializeUrl(
    //     this.router.createUrlTree([`/profile-chats`])
    //   );
    //   window.open(url, '_blank');
    // }
  }

  customName(notification): string {
    if (!notification?.notificationDesc || !notification?.Username) {
      return notification?.notificationDesc || '';
    }
    const username = notification.Username;
    const boldUsername = `<b>${username}</b>`;
    return notification.notificationDesc.replace(new RegExp(`\\b${username}\\b`, 'g'), boldUsername);
  }
}
