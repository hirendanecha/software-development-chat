import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';
const routes: Routes = [
  {
    path: 'edit-profile/:id',
    component: EditProfileComponent,
    data: {
      isShowLeftSideBar: false,
      isShowRightSideBar: false
    }
  },
  {
    path: 'view-profile/:id',
    component: ViewProfileComponent,
  },
  {
    path: 'delete-profile',
    component: DeleteAccountComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule { }
