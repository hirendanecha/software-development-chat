import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbActiveOffcanvas, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { ForgotPasswordComponent } from 'src/app/layouts/auth-layout/pages/forgot-password/forgot-password.component';

@Component({
  selector: 'app-profile-menus-modal',
  templateUrl: './profile-menus-modal.component.html',
  styleUrls: ['./profile-menus-modal.component.scss']
})
export class ProfileMenusModalComponent {
  profileId: number;
  userId: number

  constructor(
    public sharedService: SharedService,
    private activeModal: NgbActiveModal,
    private activeOffcanvas: NgbActiveOffcanvas,
    private modalService: NgbModal,
    private tokenStorageService: TokenStorageService,
    private router: Router,
    private customerService: CustomerService,
    private socketService: SocketService
  ) {
    this.userId = +localStorage.getItem('user_id');
    this.profileId = +localStorage.getItem('profileId');
  }

  closeMenu(e: MouseEvent, type: string) {
    if (e && type) {
      e.preventDefault();

      switch (type) {
        case 'profile':
          this.goToViewProfile();
          break;
        case 'logout':
          this.logout();
          break;
        case 'setting':
          this.goToSetting();
          break;
        case 'change-password':
          this.forgotPasswordOpen();
          break;
        default:
          break;
      }
    }

    this.activeModal?.dismiss();
    this.activeOffcanvas?.dismiss();
  }

  logout(): void {
    this.socketService?.socket?.emit('offline', (data) => {
      // console.log('user=>', data)
    })
    this.socketService?.socket?.on('get-users', (data) => {
      data.map(ele => {
        if (!this.sharedService.onlineUserList.includes(ele.userId)) {
          this.sharedService.onlineUserList.push(ele.userId)
        }
      })
    })
    this.customerService.logout().subscribe({
      next: (res => {
        this.tokenStorageService.signOut();
        // console.log(res)
      }),
      error(err) {
        if (err.status === 401) {
          this.tokenStorageService.signOut();
        }
      },
    });
  }

  goToSetting() {
    this.router.navigate([`settings/edit-profile/${this.userId}`]);
  }

  goToViewProfile() {
    this.router.navigate([`settings/view-profile/${this.profileId}`]);
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
  }
}
