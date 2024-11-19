import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Scroll } from '@angular/router';
import { filter, map } from 'rxjs';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {

  showButton = false;
  sidebar: any = {
    isShowLeftSideBar: true,
    isShowRightSideBar: true,
    isShowResearchLeftSideBar: false,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public breakpointService: BreakpointService,
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof Scroll),
      map(() => {
        let child = this.route.firstChild;

        while (child) {
          if (child.firstChild) {
            child = child.firstChild;
          } else if (Object.keys(child?.snapshot?.data)?.length > 0) {
            return child.snapshot.data;
          } else {
            return {};
          }
        }

        return {};
      }),
    ).subscribe((data: any) => {
      this.sidebar = data;
    });
  }

}
