import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import {
  NgbActiveModal,
  NgbActiveOffcanvas,
  NgbDropdown,
  NgbModal,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EncryptDecryptService } from 'src/app/@shared/services/encrypt-decrypt.service';
import { CreateGroupModalComponent } from 'src/app/@shared/modals/create-group-modal/create-group-modal.component';
import { ProfileMenusModalComponent } from '../../../components/profile-menus-modal/profile-menus-modal.component';
import { NotificationsModalComponent } from '../../../components/notifications-modal/notifications-modal.component';
import moment from 'moment';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { MessageService } from 'src/app/@shared/services/message.service';
import { AppQrModalComponent } from 'src/app/@shared/modals/app-qr-modal/app-qr-modal.component';
import { ConferenceLinkComponent } from 'src/app/@shared/modals/create-conference-link/conference-link-modal.component';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { InvitePeopleForChatModalComponent } from 'src/app/@shared/modals/invite-people-for-chat/invite-people-for-chat-modal.component';

@Component({
  selector: 'app-profile-chats-sidebar',
  templateUrl: './profile-chats-sidebar.component.html',
  styleUrls: ['./profile-chats-sidebar.component.scss'],
})
export class ProfileChatsSidebarComponent
  implements AfterViewInit, OnChanges, OnInit
{
  chatList: any = [];
  pendingChatList: any = [];
  groupList: any = [];
  userId: number;

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  searchText = '';
  userList: any = [];
  profileId: number;
  selectedChatUser: any;
  showUserProfile: boolean = false;

  isMessageSoundEnabled: boolean = true;
  isCallSoundEnabled: boolean = true;
  backCanvas: boolean = true;
  isChatLoader = false;
  selectedButton: string = 'chats';
  newChatList = [];
  approvedUserPage = 1;
  hasMoreUsers = false;
  approvedUserData = [];

  userMenusOverlayDialog: any;
  hideOngoingCallButton: boolean = false;
  chatData: any = [];

  @Output('newRoomCreated') newRoomCreated: EventEmitter<any> =
    new EventEmitter<any>();
  @Output('onNewChat') onNewChat: EventEmitter<any> = new EventEmitter<any>();
  @Input('isRoomCreated') isRoomCreated: boolean = false;
  @Input('selectedRoomId') selectedRoomId: number = null;
  userStatus: string;
  originalFavicon: HTMLLinkElement;
  constructor(
    private customerService: CustomerService,
    private socketService: SocketService,
    public sharedService: SharedService,
    public messageService: MessageService,
    private activeOffcanvas: NgbActiveOffcanvas,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToastService,
    private activeCanvas: NgbOffcanvas,
    private tokenStorageService: TokenStorageService,
    public encryptDecryptService: EncryptDecryptService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    public activeOffCanvas: NgbActiveOffcanvas
  ) {
    this.userId = +localStorage.getItem('user_id');
    this.originalFavicon = document.querySelector('link[rel="icon"]');
    this.socketService?.socket?.on('isReadNotification_ack', (data) => {
      if (data?.profileId) {
        // this.sharedService.isNotify = false;
        this.sharedService.setNotify(false);
        localStorage.setItem('isRead', data?.isRead);
        this.originalFavicon.href = '/assets/images/icon.jpg';
      }
    });
    this.profileId = +localStorage.getItem('profileId');
    // const notificationSound =
    //   JSON.parse(localStorage.getItem('soundPreferences')) || {};
    // if (notificationSound?.messageSoundEnabled === 'N') {
    //   this.isMessageSoundEnabled = false;
    // }
    // if (notificationSound?.callSoundEnabled === 'N') {
    //   this.isCallSoundEnabled = false;
    // }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.hideOngoingCallButton = this.router.url.includes('facetime');
        this.sharedService.callId = sessionStorage.getItem('callId') || null;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.sharedService
      .getIsRoomCreatedObservable()
      .subscribe((isRoomCreated) => {
        if (isRoomCreated) {
          this.isRoomCreated = isRoomCreated;
          this.getChatList();
          this.getGroupList();
        } else {
          this.selectedChatUser = null;
        }
      });
  }

  ngOnInit(): void {
    this.socketService.connect();
    this.getChatList();
    this.getGroupList();
    // this.getApprovedUserList();
    this.backCanvas = this.activeCanvas.hasOpenOffcanvas();
    this.sharedService.loginUserInfo.subscribe((user) => {
      this.isCallSoundEnabled =
        user?.callNotificationSound === 'Y' ? true : false;
      this.isMessageSoundEnabled =
        user?.messageNotificationSound === 'Y' ? true : false;
    });
    this.route.queryParams.subscribe((params) => {
      if (params['chatUserData']) {
        this.chatData = JSON.parse(decodeURIComponent(params['chatUserData']));
        this.router.navigate([], { relativeTo: this.route, queryParams: {} });
      }
    });
    this.socketService.connect();
    this.getChatList();
    this.getGroupList();
    this.backCanvas = this.activeCanvas.hasOpenOffcanvas();
    if (this.chatData && !this.backCanvas) {
      this.checkRoom();
    }
    this.sharedService.openModal$.subscribe(() => {
      this.invitePeople();
    });
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    if (this.isRoomCreated) {
      this.getChatList();
      this.getGroupList();
    }
    this.socketService.socket?.on('accept-invitation', (data) => {
      if (data) {
        this.onChat(data);
        this.getChatList();
      }
    });
  }

  loadMoreApprovedUsers() {
    this.approvedUserPage = this.approvedUserPage + 1;
    this.getApprovedUserList();
  }

  getApprovedUserList(): void {
    const data = {
      page: this.approvedUserPage,
      size: 15,
    };
    this.customerService.getApprovedUserList(data).subscribe({
      next: (res: any) => {
        // this.spinner.hide();
        if (res?.data) {
          const filterUserProfile = res.data.filter(
            (user: any) =>
              user.Id !== this.sharedService?.userData?.UserID &&
              user.AccountType === 'user' &&
              user.MediaApproved === 1
          );
          const chatUserList = filterUserProfile.filter(
            (user: any) =>
              !this.chatList.some(
                (chatUser: any) => chatUser.profileId === user.profileId
              ) &&
              !this.pendingChatList.some(
                (chatUser: any) => chatUser.profileId === user.profileId
              )
          );
          if (this.approvedUserPage <= 1) {
            this.approvedUserData = chatUserList;
          } else {
            this.approvedUserData = [...this.approvedUserData, ...chatUserList];
          }
          if (this.approvedUserPage < res.pagination.totalPages) {
            this.hasMoreUsers = true;
          } else {
            this.hasMoreUsers = false;
          }
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        // this.spinner.hide();
        console.log(error);
      },
    });
  }

  getUserList(): void {
    this.customerService.getProfileList(this.searchText).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0) {
          this.userList = res.data.filter(
            (user: any) => user.Id !== this.sharedService?.userData?.profileId
          );
          this.userList = this.userList.filter(
            (user: any) =>
              !this.chatList.some(
                (chatUser: any) => chatUser.profileId === user.Id
              ) &&
              !this.pendingChatList.some(
                (chatUser: any) => chatUser.profileId === user.Id
              )
          );
          this.userSearchNgbDropdown?.open();
        } else {
          this.userList = [];
          this.userSearchNgbDropdown?.close();
        }
      },
      error: () => {
        this.userList = [];
        this.userSearchNgbDropdown?.close();
      },
    });
  }

  getChatList() {
    this.isChatLoader = true;
    this.socketService?.getChatList({ profileId: this.profileId }, (data) => {
      this.isChatLoader = false;
      this.chatList = data?.filter(
        (user: any) =>
          user.Username != this.sharedService?.userData?.Username &&
          user?.isAccepted === 'Y'
      );
      this.mergeUserChatList();
      this.pendingChatList = data.filter(
        (user: any) => user.isAccepted === 'N'
      );
    });
    this.cdr.markForCheck();
    return this.chatList;
  }

  dismissSidebar() {
    this.activeOffcanvas?.dismiss();
  }

  onChat(item: any) {
    this.selectedChatUser = item.roomId || item.groupId;
    item.unReadMessage = 0;
    if (item.groupId) {
      item.isAccepted = 'Y';
    }
    // this.notificationNavigation()
    const data = {
      Id: item.profileId,
      ProfilePicName: item.ProfilePicName,
      Username: item.Username,
    };
    if (this.selectedButton === 'users') {
      this.onNewChat?.emit(data);
    } else {
      this.onNewChat?.emit(item);
      if (this.searchText) {
        this.searchText = null;
      }
    }
    this.cdr.detectChanges();
  }

  goToViewProfile(): void {
    this.router.navigate([`settings/view-profile/${this.profileId}`]);
  }

  toggleSoundPreference(property: string, ngModelValue: boolean): void {
    // const soundPreferences =
    //   JSON.parse(localStorage.getItem('soundPreferences')) || {};
    // soundPreferences[property] = ngModelValue ? 'Y' : 'N';
    // localStorage.setItem('soundPreferences', JSON.stringify(soundPreferences));
    const soundObj = {
      property: property,
      value: ngModelValue ? 'Y' : 'N',
    };
    this.customerService.updateNotificationSound(soundObj).subscribe({
      next: (res) => {
        this.toasterService.success(res.message);
        this.sharedService.getUserDetails();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  clearChatList() {
    this.onNewChat?.emit(null);
    this.selectedChatUser = null;
  }

  selectButton(buttonType: string): void {
    this.selectedButton =
      this.selectedButton === buttonType ? buttonType : buttonType;
    if (buttonType === 'chats') {
      this.onNewChat?.emit(null);
    }
  }

  getGroupList() {
    this.isChatLoader = true;
    this.socketService?.getGroup({ profileId: this.profileId }, (data) => {
      this.isChatLoader = false;
      this.groupList = data;
      this.mergeUserChatList();
    });
    this.cdr.markForCheck();
  }

  mergeUserChatList(): void {
    const chatList = this.chatList;
    const groupList = this.groupList;
    const mergeChatList = [...chatList, ...groupList];
    mergeChatList.sort(
      (a, b) =>
        new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
    );
    if (mergeChatList?.length) {
      this.newChatList = mergeChatList.filter((ele) => {
        if (
          ele?.roomId === this.selectedChatUser ||
          ele?.groupId === this.selectedChatUser
        ) {
          ele.unReadMessage = 0;
          this.selectedChatUser = ele?.roomId || ele?.groupId;
          return ele;
        } else return ele;
      });
      this.messageService.chatList.push(this.newChatList);
    }
    this.cdr.markForCheck();
  }

  createNewGroup() {
    const modalRef = this.modalService.open(CreateGroupModalComponent, {
      centered: true,
      size: 'md',
    });
    modalRef.componentInstance.title = 'Create Group';
    modalRef.result.then((res) => {
      if (res) {
        this.socketService?.createGroup(res, (data: any) => {
          this.getChatList();
          this.getGroupList();
          this.cdr.markForCheck();
        });
      }
    });
  }

  deleteOrLeaveChat(item) {
    if (item.roomId) {
      const data = {
        roomId: item.roomId,
        profileId: item.profileId,
      };
      this.socketService?.deleteRoom(data, (data: any) => {
        this.getChatList();
        this.getGroupList();
        this.onNewChat?.emit(null);
      });
    } else if (item.groupId) {
      const data = {
        profileId: this.profileId,
        groupId: item.groupId,
      };
      this.socketService.removeGroupMember(data, (res) => {
        this.getChatList();
        this.getGroupList();
        this.onNewChat?.emit(null);
      });
    }
  }
  resendInvite(item) {
    if (item) {
      const date = moment(new Date()).utc();
      const data = {
        roomId: item.roomId,
        profileId: item.profileId,
        createdBy: item.createdBy,
        date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
      };

      const hoursDifference = date.diff(item.createdDate, 'hours');
      if (hoursDifference > 24) {
        this.socketService?.resendChatInvite(data, (data: any) => {
          this.getChatList();
          this.getGroupList();
          this.onNewChat?.emit(null);
          this.toasterService.success('invitation sent successfully.');
        });
      } else {
        this.toasterService.warring(
          'Please wait 24 hours before sending invitations again.'
        );
      }
    }
  }

  // removeRequest(item){
  //   if (item.roomId) {
  //     const data = {
  //       roomId: item.roomId,
  //       profileId: item.profileId,
  //     };
  //     this.socketService?.cancelRequest(data, (data: any) => {
  //       this.getChatList();
  //       this.getGroupList();
  //       this.onNewChat?.emit({});
  //     });
  //   }
  // }
  openNotificationsMobileModal(): void {
    this.activeOffCanvas?.close();
    this.activeCanvas.open(NotificationsModalComponent, {
      position: 'end',
      panelClass: 'w-300-px',
    });
  }

  appQrmodal() {
    const modalRef = this.modalService.open(AppQrModalComponent, {
      centered: true,
    });
  }
  uniqueLink() {
    const modalRef = this.modalService.open(ConferenceLinkComponent, {
      centered: true,
    });
  }

  profileStatus(status: string) {
    const data = {
      status: status,
      id: this.profileId,
    };
    this.socketService.switchOnlineStatus(data, (res) => {
      this.sharedService.userData.userStatus = res.status;
      this.sharedService.getLoginUserDetails(this.sharedService.userData);
    });
  }
  findUserStatus(id: string): string {
    const user = this.sharedService.onlineUserList.find(
      (ele) => ele.userId === id
    );
    const status = user?.status;
    return status;
  }
  logout(): void {
    this.socketService?.socket?.emit('offline', (data) => {
      // console.log('user=>', data)
    });
    this.socketService?.socket?.on('get-users', (data) => {
      data.map((ele) => {
        if (!this.sharedService.onlineUserList.includes(ele.userId)) {
          this.sharedService.onlineUserList.push(ele.userId);
        }
      });
    });
    this.customerService.logout().subscribe({
      next: (res) => {
        this.tokenStorageService.signOut();
        // console.log(res)
      },
    });
  }
  goToSetting() {
    this.router.navigate([`settings/edit-profile/${this.userId}`]);
  }

  invitePeople(): void {
    const modalRef = this.modalService.open(InvitePeopleForChatModalComponent, {
      centered: true,
      size: 'md',
    });
    modalRef.componentInstance.chatList = this.chatList;
    modalRef.componentInstance.pendingChatList = this.pendingChatList;

    modalRef.result.then((res) => {
      if (res !== 'cancel') {
        this.onChat(res);
      }
    });
  }

  checkRoom(): void {
    const oldUserChat = {
      profileId1: this.profileId,
      profileId2: this.chatData.Id,
    };
    this.socketService.checkRoom(oldUserChat, (res: any) => {
      const data = res.find((obj) => obj.isDeleted === 'N');
      if (data && data.id && !this.chatData.GroupId) {
        const existingUser = {
          roomId: data.id,
          profileId: data.profileId1,
          Username: data.Username || this.chatData.Username,
          ProfilePicName: data.ProfilePicName || this.chatData.ProfilePicName,
          isAccepted: data.isAccepted,
          isDeleted: data.isDeleted,
          lastMessageText: data.lastMessageText,
          createdBy: this.chatData.Id,
        };
        this.selectedChatUser = existingUser.roomId;
        this.onNewChat?.emit(existingUser);
      } else if (this.chatData.GroupId) {
        const redirectToGroup = {
          groupId: this.chatData.GroupId,
          groupName: this.chatData.GroupName,
          isAccepted: this.chatData?.isAccepted || 'Y',
          lastMessageText: this.chatData?.lastMessageText,
          profileImage: this.chatData?.ProfilePicName,
          ProfilePicName: this.chatData?.ProfilePicName,
          createdBy: this.chatData?.Id,
        };
        this.onNewChat?.emit(redirectToGroup);
      } else {
        const newUser = {
          Id: this.chatData.Id,
          Username: this.chatData.Username,
          ProfilePicName: this.chatData.ProfilePicName,
          unReadMessage: 0,
        };
        this.onNewChat?.emit(newUser);
      }
    });
    this.cdr.markForCheck();
  }
}
