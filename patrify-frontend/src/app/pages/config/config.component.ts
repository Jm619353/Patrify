import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';

@Component({
  selector: 'config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  readonly environment = environment;
  readonly pageSizeOptions: number[];

  pageSize = 10;
  confirmLogout = false;

  constructor(
    public readonly auth: AuthService,
    private readonly preferences: PreferencesService,
    private readonly toastr: ToastrService
  ) {
    this.pageSizeOptions = preferences.pageSizeOptions;
  }

  ngOnInit(): void {
    this.pageSize = this.preferences.pageSize;
  }

  get expiresAt(): Date | null {
    return this.auth.sessionExpiresAt;
  }

  get environmentLabel(): string {
    return this.environment.production ? 'Produção' : 'Desenvolvimento';
  }

  changePageSize(value: number | string): void {
    const size = Number(value);
    this.preferences.pageSize = size;
    this.pageSize = this.preferences.pageSize;
    this.toastr.success(
      `O inventário passará a exibir ${this.pageSize} itens por página.`,
      'Preferência salva'
    );
  }

  copy(value: string, label: string): void {
    if (!navigator.clipboard) {
      this.toastr.warning('Seu navegador não permite copiar automaticamente.', 'Cópia indisponível');
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => this.toastr.success(`${label} copiado.`, 'Copiado'))
      .catch(() => this.toastr.error('Não foi possível copiar o valor.', 'Erro'));
  }

  requestLogout(): void {
    this.confirmLogout = true;
  }

  cancelLogout(): void {
    this.confirmLogout = false;
  }

  logout(): void {
    this.confirmLogout = false;
    this.auth.logout();
  }
}
