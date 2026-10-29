import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html'
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  readonly currentYear = new Date().getFullYear();
  private subscription?: Subscription;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarOpen = false;
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
