import { NgModule } from '@angular/core';
import {
  BrowserModule,
  Meta,
  provideClientHydration,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastsContainerComponent } from './@shared/components/toasts-container/toasts-container.component';
import { LandingPageComponent } from './layouts/auth-layout/pages/landing-page/landing-page.component';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationGuard } from './@shared/guards/authentication.guard';
import { SharedModule } from './@shared/shared.module';
import { AuthInterceptor } from './@shared/intersaptor/auth.interceptor';

@NgModule({
  declarations: [AppComponent, ToastsContainerComponent, LandingPageComponent],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    BrowserModule.withServerTransition({ appId: 'softwaredevelopment-chat' }),
    BrowserAnimationsModule,
  ],
  providers: [
    AuthenticationGuard,
    CookieService,
    Meta,
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
