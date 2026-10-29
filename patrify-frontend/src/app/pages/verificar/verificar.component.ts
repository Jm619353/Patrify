import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import {
  PatrimonyCondition,
  PatrimonyStatus,
  PublicPatrimonyVerification
} from '../../core/models/patrimony.model';
import { PatrimonyService } from '../../core/services/patrimony.service';
import { formatCnpj } from '../../shared/utils/cnpj';

@Component({
  selector: 'app-verificar',
  templateUrl: './verificar.component.html'
})
export class VerificarComponent implements OnInit, OnDestroy {
  serialInput = '';
  loading = false;
  notFound = false;
  verification: PublicPatrimonyVerification | null = null;

  private routeSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly patrimonyService: PatrimonyService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const serial = params.get('serial');
      if (serial && serial.trim()) {
        this.serialInput = serial.trim().toUpperCase();
        this.lookup(this.serialInput);
      } else {
        this.verification = null;
        this.notFound = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onSearchSubmit(): void {
    const cleaned = this.serialInput.trim().toUpperCase();
    if (!cleaned) {
      this.toastr.warning('Informe o código de série do patrimônio.', 'Campo obrigatório');
      return;
    }
    this.router.navigate(['/verificar', cleaned]);
  }

  lookup(serial: string): void {
    this.loading = true;
    this.notFound = false;
    this.patrimonyService.verifyBySerial(serial).subscribe({
      next: (result) => {
        this.verification = result;
        this.loading = false;
      },
      error: () => {
        this.verification = null;
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  formatCompanyCnpj(cnpj: string | null | undefined): string {
    return formatCnpj(cnpj);
  }

  isWarrantyActive(warrantyUntil: string | null | undefined): boolean {
    if (!warrantyUntil) return false;
    const target = new Date(`${warrantyUntil}T23:59:59Z`);
    return !Number.isNaN(target.getTime()) && target.getTime() >= Date.now();
  }

  statusClass(status: PatrimonyStatus): string {
    return status === 'Ativo' ? 'badge-success' : 'badge-warning';
  }

  conditionClass(condition: PatrimonyCondition): string {
    switch (condition) {
      case 'Novo':
      case 'Excelente':
        return 'badge-success';
      case 'Regular':
        return 'badge-neutral';
      case 'Com defeitos':
        return 'badge-warning';
      default:
        return 'badge-danger';
    }
  }

  copyLink(): void {
    const url = this.verification?.verificationUrl || window.location.href;
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(() => {
      this.toastr.success('Link de verificação copiado para a área de transferência.', 'Copiado');
    });
  }

  downloadQrCode(): void {
    if (!this.verification?.qrCodeDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = this.verification.qrCodeDataUrl;
    anchor.download = `qrcode-${this.verification.patrimony.serialNumber}.png`;
    anchor.click();
  }

  printTag(): void {
    if (!this.verification) return;
    const { patrimony, company, qrCodeDataUrl } = this.verification;
    const popup = window.open('', '_blank', 'width=520,height=640');
    if (!popup) {
      this.toastr.warning('Permita pop-ups para imprimir a etiqueta.', 'Impressão bloqueada');
      return;
    }

    popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Etiqueta Patrimonial - ${patrimony.serialNumber}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { margin: 24px; background: #f8fafc; color: #0f172a; }
    .tag {
      width: 380px;
      border: 2px solid #0f172a;
      border-radius: 14px;
      background: #fff;
      padding: 16px;
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .qr { width: 120px; height: 120px; flex-shrink: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; }
    .info { flex: 1; min-width: 0; }
    .brand { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em; color: #7c3aed; }
    .company { font-size: 11px; font-weight: 600; color: #475569; margin-top: 2px; }
    .name { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 6px; line-height: 1.25; }
    .serial {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 8px;
      background: #0f172a;
      color: #fff;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      letter-spacing: 0.08em;
    }
    .meta { font-size: 11px; color: #64748b; margin-top: 6px; }
    @media print {
      body { margin: 0; background: #fff; }
    }
  </style>
</head>
<body>
  <div class="tag">
    <img class="qr" src="${qrCodeDataUrl}" alt="QR Code ${patrimony.serialNumber}" />
    <div class="info">
      <div class="brand">Patrify · Controle Patrimonial</div>
      <div class="company">${company?.name || 'Patrimônio Corporativo'}</div>
      <div class="name">${patrimony.name}</div>
      <div class="serial">${patrimony.serialNumber}</div>
      <div class="meta">${patrimony.category}${patrimony.location ? ` · ${patrimony.location}` : ''}</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`);
    popup.document.close();
  }
}
