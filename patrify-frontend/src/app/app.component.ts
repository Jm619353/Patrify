import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly loading$ = this.loading.loading$;

  constructor(
    private readonly auth: AuthService,
    private readonly loading: LoadingService
  ) {}

  ngOnInit(): void {
    if (this.auth.hasValidToken()) {
      this.auth.loadMe().subscribe({ error: () => undefined });
    }
  }
}
