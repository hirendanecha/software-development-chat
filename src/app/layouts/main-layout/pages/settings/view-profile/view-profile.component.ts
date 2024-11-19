import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss'],
})
export class ViewProfileComponent implements OnInit, AfterViewInit {
  customer: any = {};
  customerPostList: any = [];
  userId = '';
  profilePic: any = {};
  coverPic: any = {};
  profileId: number;
  activeTab = 1;
  communityList = [];
  communityId = '';
  isExpand = false;
  pdfList: any = [];
  constructor(
    private modalService: NgbActiveModal,
    private modal: NgbModal,
    private router: Router,
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private tokenStorage: TokenStorageService,
    public sharedService: SharedService,
    public breakpointService: BreakpointService,
    private seoService: SeoService,
    private toastService: ToastService
  ) {
    this.router.events.subscribe((event: any) => {
      const id = event?.routerEvent?.url.split('/')[3];
      this.profileId = id
      if (id) {
        this.getProfile(id);
      }
      this.profileId = +localStorage.getItem('profileId');
    });
  }

  ngOnInit(): void {
    if (!this.tokenStorage.getToken()) {
      this.router.navigate([`/login`]);
    }
    this.modalService.close();
  }


  ngAfterViewInit(): void { }

  getProfile(id): void {
    this.spinner.show();
    this.customerService.getProfile(id).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.data) {
          this.customer = res.data[0];
          this.userId = res.data[0]?.UserID;
          const data = {
            title: this.customer?.FirstName + ' ' + this.customer?.LastName,
            url: `${environment.webUrl}settings/view-profile/${this.customer?.Id}`,
            description: '',
            image: this.customer?.ProfilePicName,
          };
          this.seoService.updateSeoMetaData(data);
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  openDropDown(id) {
    this.communityId = id;
    if (this.communityId) {
      this.isExpand = true;
    } else {
      this.isExpand = false;
    }
  }
  openEditProfile(): void {
    this.router.navigate([`settings/edit-profile/${this.profileId}`]);
  }
}
