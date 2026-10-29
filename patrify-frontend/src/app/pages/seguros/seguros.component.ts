import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  INSURANCE_STATUSES,
  INSURANCE_TYPES,
  InsuranceCoverageType,
  InsuranceItem,
  InsuranceStatus,
  InsuranceSummary
} from '../../core/models/insurance.model';
import { Patrimony } from '../../core/models/patrimony.model';
import { InsuranceService } from '../../core/services/insurance.service';
import { PatrimonyService } from '../../core/services/patrimony.service';

@Component({
  selector: 'app-seguros',
  templateUrl: './seguros.component.html'
})
export class SegurosComponent implements OnInit {
  readonly coverageTypes = INSURANCE_TYPES;
  readonly statuses = INSURANCE_STATUSES;

  items: InsuranceItem[] = [];
  patrimonies: Patrimony[] = [];
  summary: InsuranceSummary = {
    total: 0,
    active: 0,
    expiringSoon: 0,
    claimed: 0,
    totalInsuredAmount: 0,
    totalPremiumCost: 0
  };

  loading = true;
  saving = false;
  modalOpen = false;
  claimModalOpen = false;
  selectedForClaim: InsuranceItem | null = null;
  claimDescription = '';

  deleteCandidate: InsuranceItem | null = null;

  search = '';
  statusFilter = '';
  coverageFilter = '';

  readonly form = this.fb.nonNullable.group({
    patrimonyId: ['', [Validators.required]],
    policyNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    insurer: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    coverageType: [
      'Cobertura Total / Casco' as InsuranceCoverageType,
      [Validators.required]
    ],
    insuredAmount: [0, [Validators.required, Validators.min(0)]],
    premiumCost: [0, [Validators.required, Validators.min(0)]],
    deductible: [0, [Validators.required, Validators.min(0)]],
    startDate: [this.todayIso(), [Validators.required]],
    endDate: [this.plusDaysIso(365), [Validators.required]],
    brokerContact: [''],
    notes: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly insuranceService: InsuranceService,
    private readonly patrimonyService: PatrimonyService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPatrimonies();
    this.load();
  }

  loadPatrimonies(): void {
    this.patrimonyService.list({ page: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        this.patrimonies = res.data;
      }
    });
  }

  load(): void {
    this.loading = true;
    this.insuranceService
      .list({
        search: this.search.trim() || undefined,
        status: this.statusFilter || undefined,
        coverageType: this.coverageFilter || undefined
      })
      .subscribe({
        next: (res) => {
          this.items = res.data;
          this.summary = res.meta;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.coverageFilter = '';
    this.load();
  }

  onPatrimonySelect(): void {
    const selectedId = this.form.controls.patrimonyId.value;
    const found = this.patrimonies.find((p) => p.id === selectedId);
    if (found && !this.form.controls.insuredAmount.value) {
      this.form.patchValue({
        insuredAmount: found.value * (found.quantity || 1)
      });
    }
  }

  openCreateModal(): void {
    const first = this.patrimonies[0];
    this.form.reset({
      patrimonyId: first?.id ?? '',
      policyNumber: `APO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      insurer: '',
      coverageType: 'Cobertura Total / Casco',
      insuredAmount: first ? first.value * (first.quantity || 1) : 0,
      premiumCost: 0,
      deductible: 0,
      startDate: this.todayIso(),
      endDate: this.plusDaysIso(365),
      brokerContact: '',
      notes: ''
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving = true;

    this.insuranceService
      .create({
        patrimonyId: raw.patrimonyId,
        policyNumber: raw.policyNumber.trim(),
        insurer: raw.insurer.trim(),
        coverageType: raw.coverageType,
        insuredAmount: Number(raw.insuredAmount) || 0,
        premiumCost: Number(raw.premiumCost) || 0,
        deductible: Number(raw.deductible) || 0,
        startDate: raw.startDate,
        endDate: raw.endDate,
        brokerContact: raw.brokerContact?.trim() || null,
        notes: raw.notes?.trim() || null
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.modalOpen = false;
          this.toastr.success(
            'Apólice cadastrada e vinculada à ficha do patrimônio!',
            'Seguro ativo'
          );
          this.load();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  openClaimModal(item: InsuranceItem): void {
    this.selectedForClaim = item;
    this.claimDescription = item.claimNotes || '';
    this.claimModalOpen = true;
  }

  closeClaimModal(): void {
    if (this.saving) return;
    this.claimModalOpen = false;
    this.selectedForClaim = null;
  }

  confirmClaim(): void {
    if (!this.selectedForClaim) return;
    this.saving = true;

    this.insuranceService
      .update(this.selectedForClaim.id, {
        status: 'Sinistro Acionado',
        claimNotes:
          this.claimDescription.trim() ||
          'Sinistro registrado junto à seguradora para vistoria/indenização.'
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.claimModalOpen = false;
          this.selectedForClaim = null;
          this.toastr.warning(
            'Sinistro acionado e registrado no histórico do patrimônio.',
            'Sinistro registrado'
          );
          this.load();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  renewOneYear(item: InsuranceItem): void {
    const base = item.endDate ? new Date(`${item.endDate}T12:00:00`) : new Date();
    base.setFullYear(base.getFullYear() + 1);
    const newEndIso = base.toISOString().slice(0, 10);

    this.insuranceService
      .update(item.id, { status: 'Vigente', endDate: newEndIso })
      .subscribe({
        next: () => {
          this.toastr.success(
            `Vigência prorrogada até ${new Date(`${newEndIso}T12:00:00`).toLocaleDateString('pt-BR')}`,
            'Apólice renovada (+1 ano)'
          );
          this.load();
        }
      });
  }

  askDelete(item: InsuranceItem): void {
    this.deleteCandidate = item;
  }

  confirmDelete(): void {
    if (!this.deleteCandidate) return;
    const id = this.deleteCandidate.id;
    this.insuranceService.remove(id).subscribe({
      next: () => {
        this.toastr.success('Apólice removida.', 'Excluída');
        this.deleteCandidate = null;
        this.load();
      },
      error: () => {
        this.deleteCandidate = null;
      }
    });
  }

  isExpiringSoon(item: InsuranceItem): boolean {
    if (item.status !== 'Vigente') return false;
    const today = new Date(`${this.todayIso()}T12:00:00`).getTime();
    const end = new Date(`${item.endDate}T12:00:00`).getTime();
    const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }

  validityLabel(item: InsuranceItem): string {
    const today = new Date(`${this.todayIso()}T12:00:00`).getTime();
    const end = new Date(`${item.endDate}T12:00:00`).getTime();
    const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Vencida há ${Math.abs(diffDays)} dia(s)`;
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays <= 30) return `Renovar em ${diffDays} dia(s)`;
    return `${diffDays} dias de cobertura`;
  }

  statusClass(status: InsuranceStatus): string {
    switch (status) {
      case 'Vigente':
        return 'badge-success';
      case 'Sinistro Acionado':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
      case 'Vencida':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }

  printCertificate(item: InsuranceItem): void {
    const win = window.open('', '_blank', 'width=840,height=680');
    if (!win) {
      this.toastr.warning('Permita pop-ups para imprimir o certificado.');
      return;
    }

    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const startFmt = new Date(`${item.startDate}T12:00:00`).toLocaleDateString('pt-BR');
    const endFmt = new Date(`${item.endDate}T12:00:00`).toLocaleDateString('pt-BR');

    win.document.write(`
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Certificado de Apólice - ${item.policyNumber}</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; padding: 36px; color: #0f172a; }
          .sheet { border: 2px solid #0f172a; border-radius: 16px; padding: 28px; max-width: 720px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #0284c7; }
          h1 { font-size: 20px; margin: 4px 0 0; }
          .badge { background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
          .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .value { font-size: 14px; font-weight: 700; margin-top: 4px; color: #0f172a; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 48px; text-align: center; font-size: 12px; color: #475569; }
          .line { border-top: 1px solid #64748b; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">Patrify · Gestão de Riscos, Seguros e Garantias</div>
              <h1>Certificado de Cobertura Patrimonial · ${item.policyNumber}</h1>
            </div>
            <div class="badge">${item.status}</div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="label">Patrimônio Segurado</div>
              <div class="value">${item.patrimonyName}</div>
            </div>
            <div class="box">
              <div class="label">Código de Série (QR)</div>
              <div class="value" style="font-family: monospace;">${item.serialNumber} (${item.category})</div>
            </div>
            <div class="box">
              <div class="label">Seguradora / Garantidora</div>
              <div class="value">${item.insurer}</div>
            </div>
            <div class="box">
              <div class="label">Modalidade de Cobertura</div>
              <div class="value">${item.coverageType}</div>
            </div>
            <div class="box">
              <div class="label">Importância Segurada (LMI)</div>
              <div class="value" style="color: #047857;">${currency.format(item.insuredAmount)}</div>
            </div>
            <div class="box">
              <div class="label">Prêmio Anual / Franquia</div>
              <div class="value">Prêmio: ${currency.format(item.premiumCost)} · Franquia: ${currency.format(item.deductible)}</div>
            </div>
            <div class="box">
              <div class="label">Período de Vigência</div>
              <div class="value">${startFmt} até ${endFmt}</div>
            </div>
            <div class="box">
              <div class="label">Corretora / Central de Assistência 24h</div>
              <div class="value">${item.brokerContact || 'Atendimento Corporativo Padrão'}</div>
            </div>
          </div>

          ${
            item.notes
              ? `<div class="box" style="margin-bottom: 12px;"><div class="label">Cláusulas e Condições Particulares</div><div class="value" style="font-weight: 500;">${item.notes}</div></div>`
              : ''
          }
          ${
            item.claimNotes
              ? `<div class="box" style="border-color: #fecaca; background: #fef2f2;"><div class="label" style="color: #b91c1c;">Registro de Sinistro</div><div class="value" style="color: #991b1b; font-weight: 600;">${item.claimNotes}</div></div>`
              : ''
          }

          <div class="signatures">
            <div class="line"><strong>Gestão de Riscos e Compliance</strong><br/>Controle Patrimonial Patrify</div>
            <div class="line"><strong>Diretoria Financeira / Seguros</strong><br/>Conferência de Apólice</div>
          </div>
        </div>
        <script>setTimeout(() => { window.print(); }, 250);</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private plusDaysIso(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
