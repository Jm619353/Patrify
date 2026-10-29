import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, startWith, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();

  pageTitle = 'Dashboard';
  pageSubtitle = '';
  today = new Date();
  userMenuOpen = false;

  private subscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    public readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => this.resolveRouteData());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-user-menu]')) {
      this.userMenuOpen = false;
    }
  }

  initials(name: string | null | undefined): string {
    if (!name) return 'P';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  logout(): void {
    this.auth.logout();
  }

  private resolveRouteData(): void {
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle = (route.snapshot.data['title'] as string) || 'Patrify';
    this.pageSubtitle = (route.snapshot.data['subtitle'] as string) || '';
  }
}
