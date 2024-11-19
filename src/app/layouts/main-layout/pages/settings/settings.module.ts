import { NgModule } from '@angular/core';

import { SettingsRoutingModule } from './settings-routing.module';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { SharedModule } from 'src/app/@shared/shared.module';
import { DeleteAccountComponent } from './delete-account/delete-account.component';

@NgModule({
  declarations: [
    EditProfileComponent,
    ViewProfileComponent,
    DeleteAccountComponent,
  ],
  imports: [SettingsRoutingModule, SharedModule],
})
export class SettingsModule { }
