import { Component, ElementRef, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  mobileMenuToggle: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private el: ElementRef,
    private customerService: CustomerService,
    private tokenStorageService: TokenStorageService,
    private spinner: NgxSpinnerService,
    private socketService: SocketService,
    private sharedService: SharedService
  ) {
    const path = this.route.snapshot.routeConfig.path;
    if (path === 'logout') {
      this.logout();
    } else if (this.tokenStorageService.getToken()) {
      this.router.navigate(['/profile-chat']);
    }
    // console.log('Constructor');
  }

  openLoginPage(): void {
    // console.log('Login Clicked!');

    this.closeMenu();
    this.router.navigate(['/login']);
  }
  openSignPage(): void {
    this.closeMenu();
    this.router.navigate(['/register']);
  }
  mobileMenu(): void {
    this.mobileMenuToggle = !this.mobileMenuToggle;
    this.renderer.setStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow',
      'hidden'
    );
  }
  closeMenu() {
    this.mobileMenuToggle = false;
    this.renderer.removeStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow'
    );
  }

  logout(): void {
    this.spinner.show();
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
      next: (res) => {
        this.spinner.hide();
        this.tokenStorageService.signOut();
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }
}
