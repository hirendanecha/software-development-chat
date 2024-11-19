import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { AuthenticationGuard } from 'src/app/@shared/guards/authentication.guard';
import { AppointmentCallComponent } from 'src/app/@shared/components/appointment-call/appointment-call.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/profile-chats/profile-chats.module').then(
            (m) => m.ProfileChartsModule
          ),
        canActivate: mapToCanActivate([AuthenticationGuard]),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.module').then(
            (m) => m.SettingsModule
          ),
        data: {
          isShowLeftSideBar: true,
        },
        canActivate: mapToCanActivate([AuthenticationGuard]),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./pages/notifications/notification.module').then(
            (m) => m.NotificationsModule
          ),
        data: {
          isShowLeftSideBar: true,
        },
        canActivate: mapToCanActivate([AuthenticationGuard]),
      },
      {
        path: 'profile-chats',
        loadChildren: () =>
          import('./pages/profile-chats/profile-chats.module').then(
            (m) => m.ProfileChartsModule
          ),
        canActivate: mapToCanActivate([AuthenticationGuard]),
      },
      {
        path: 'facetime/:callId',
        component: AppointmentCallComponent,
        data: {
          isShowLeftSideBar: false,
          isShowRightSideBar: false,
          isShowResearchLeftSideBar: false,
          isShowChatListSideBar: false,
          isShowChatModule: true
        },
        // canActivate: mapToCanActivate([AuthenticationGuard]),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainLayoutRoutingModule { }
