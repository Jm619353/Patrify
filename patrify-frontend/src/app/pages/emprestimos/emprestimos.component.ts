import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  LOAN_STATUSES,
  LoanItem,
  LoanStatus,
  LoanSummary
} from '../../core/models/loan.model';
import {
  PATRIMONY_CONDITIONS,
  Patrimony
} from '../../core/models/patrimony.model';
import { LoanService } from '../../core/services/loan.service';
import { PatrimonyService } from '../../core/services/patrimony.service';

@Component({
  selector: 'app-emprestimos',
  templateUrl: './emprestimos.component.html'
})
export class EmprestimosComponent implements OnInit {
  readonly statuses = LOAN_STATUSES;
  readonly conditions = PATRIMONY_CONDITIONS;

  items: LoanItem[] = [];
  patrimonies: Patrimony[] = [];
  summary: LoanSummary = {
    total: 0,
    active: 0,
    overdue: 0,
    returned: 0
  };

  loading = true;
  saving = false;
  modalOpen = false;
  checkinModalOpen = false;
  selectedForCheckin: LoanItem | null = null;
  checkinCondition = 'Excelente';
  checkinNotes = '';

  deleteCandidate: LoanItem | null = null;

  search = '';
  statusFilter = '';
  onlyOverdue = false;

  readonly form = this.fb.nonNullable.group({
    patrimonyId: ['', [Validators.required]],
    borrowerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    borrowerDocument: [''],
    department: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    purpose: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(240)]],
    loanDate: [this.todayIso(), [Validators.required]],
    expectedReturnDate: [this.plusDaysIso(7), [Validators.required]],
    conditionOut: ['Excelente', [Validators.required]],
    notes: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly loanService: LoanService,
    private readonly patrimonyService: PatrimonyService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPatrimonies();
    this.load();
  }

  get filteredItems(): LoanItem[] {
    if (!this.onlyOverdue) return this.items;
    return this.items.filter((item) => this.isOverdue(item));
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
    this.loanService
      .list({
        search: this.search.trim() || undefined,
        status: this.statusFilter || undefined
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
    this.onlyOverdue = false;
    this.load();
  }

  openCreateModal(): void {
    this.form.reset({
      patrimonyId: this.patrimonies[0]?.id ?? '',
      borrowerName: '',
      borrowerDocument: '',
      department: '',
      purpose: '',
      loanDate: this.todayIso(),
      expectedReturnDate: this.plusDaysIso(7),
      conditionOut: 'Excelente',
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

    this.loanService
      .create({
        patrimonyId: raw.patrimonyId,
        borrowerName: raw.borrowerName.trim(),
        borrowerDocument: raw.borrowerDocument?.trim() || null,
        department: raw.department.trim(),
        purpose: raw.purpose.trim(),
        loanDate: raw.loanDate,
        expectedReturnDate: raw.expectedReturnDate,
        conditionOut: raw.conditionOut,
        notes: raw.notes?.trim() || null
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.modalOpen = false;
          this.toastr.success(
            'Empréstimo registrado e vinculado ao histórico do patrimônio!',
            'Check-out concluído'
          );
          this.load();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  openCheckinModal(item: LoanItem): void {
    this.selectedForCheckin = item;
    this.checkinCondition = item.conditionOut || 'Excelente';
    this.checkinNotes = item.notes || '';
    this.checkinModalOpen = true;
  }

  closeCheckinModal(): void {
    if (this.saving) return;
    this.checkinModalOpen = false;
    this.selectedForCheckin = null;
  }

  confirmCheckin(): void {
    if (!this.selectedForCheckin) return;
    this.saving = true;

    this.loanService
      .update(this.selectedForCheckin.id, {
        status: 'Devolvido',
        conditionIn: this.checkinCondition,
        notes: this.checkinNotes.trim() || null
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.checkinModalOpen = false;
          this.selectedForCheckin = null;
          this.toastr.success(
            'Equipamento devolvido e check-in registrado na linha do tempo!',
            'Devolução confirmada'
          );
          this.load();
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  extendLoan(item: LoanItem, days = 7): void {
    const baseDate = item.expectedReturnDate
      ? new Date(`${item.expectedReturnDate}T12:00:00`)
      : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    const newDateIso = baseDate.toISOString().slice(0, 10);

    this.loanService
      .update(item.id, { expectedReturnDate: newDateIso })
      .subscribe({
        next: () => {
          this.toastr.info(
            `Novo prazo de devolução: ${new Date(`${newDateIso}T12:00:00`).toLocaleDateString('pt-BR')}`,
            'Prazo prorrogado'
          );
          this.load();
        }
      });
  }

  askDelete(item: LoanItem): void {
    this.deleteCandidate = item;
  }

  confirmDelete(): void {
    if (!this.deleteCandidate) return;
    const id = this.deleteCandidate.id;
    this.loanService.remove(id).subscribe({
      next: () => {
        this.toastr.success('Registro de empréstimo removido.', 'Excluído');
        this.deleteCandidate = null;
        this.load();
      },
      error: () => {
        this.deleteCandidate = null;
      }
    });
  }

  isOverdue(item: LoanItem): boolean {
    if (item.status !== 'Em andamento') return false;
    const today = this.todayIso();
    return Boolean(item.expectedReturnDate && item.expectedReturnDate < today);
  }

  daysRemainingLabel(item: LoanItem): string {
    if (item.status === 'Devolvido') return 'Devolvido';
    if (item.status === 'Cancelado') return 'Cancelado';
    const today = new Date(`${this.todayIso()}T12:00:00`).getTime();
    const target = new Date(`${item.expectedReturnDate}T12:00:00`).getTime();
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} dia(s) em atraso`;
    if (diffDays === 0) return 'Vence hoje';
    return `Restam ${diffDays} dia(s)`;
  }

  statusClass(item: LoanItem): string {
    if (this.isOverdue(item)) {
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
    }
    switch (item.status as LoanStatus) {
      case 'Devolvido':
        return 'badge-success';
      case 'Em andamento':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }

  printLoanReceipt(item: LoanItem): void {
    const win = window.open('', '_blank', 'width=840,height=680');
    if (!win) {
      this.toastr.warning('Permita pop-ups para imprimir o comprovante.');
      return;
    }

    const loanDateFormatted = new Date(`${item.loanDate}T12:00:00`).toLocaleDateString('pt-BR');
    const expectedFormatted = new Date(`${item.expectedReturnDate}T12:00:00`).toLocaleDateString(
      'pt-BR'
    );
    const returnedFormatted = item.returnedAt
      ? new Date(item.returnedAt).toLocaleDateString('pt-BR')
      : 'Em posse do colaborador';

    win.document.write(`
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Recibo de Empréstimo - ${item.serialNumber}</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; padding: 36px; color: #0f172a; }
          .sheet { border: 2px solid #0f172a; border-radius: 16px; padding: 28px; max-width: 720px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #0284c7; }
          h1 { font-size: 20px; margin: 4px 0 0; }
          .badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
          .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .value { font-size: 14px; font-weight: 700; margin-top: 4px; color: #0f172a; }
          .clause { font-size: 12px; line-height: 1.6; color: #334155; background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 14px; margin-top: 16px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 52px; text-align: center; font-size: 12px; color: #475569; }
          .line { border-top: 1px solid #64748b; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">Patrify · Cautela Temporária de Ativo (Check-out / Check-in)</div>
              <h1>Comprovante de Empréstimo de Equipamento</h1>
            </div>
            <div class="badge">${item.status}</div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="label">Patrimônio / Equipamento</div>
              <div class="value">${item.patrimonyName}</div>
            </div>
            <div class="box">
              <div class="label">Código de Série (QR)</div>
              <div class="value" style="font-family: monospace;">${item.serialNumber} (${item.category})</div>
            </div>
            <div class="box">
              <div class="label">Colaborador / Solicitante</div>
              <div class="value">${item.borrowerName} ${item.borrowerDocument ? `· Doc: ${item.borrowerDocument}` : ''}</div>
            </div>
            <div class="box">
              <div class="label">Departamento / Setor</div>
              <div class="value">${item.department}</div>
            </div>
            <div class="box">
              <div class="label">Data de Retirada (Check-out)</div>
              <div class="value">${loanDateFormatted} · Estado: ${item.conditionOut}</div>
            </div>
            <div class="box">
              <div class="label">Previsão de Devolução / Check-in</div>
              <div class="value">${expectedFormatted} (${returnedFormatted})</div>
            </div>
          </div>

          <div class="box" style="margin-bottom: 12px;">
            <div class="label">Finalidade do Empréstimo</div>
            <div class="value" style="font-weight: 500;">${item.purpose}</div>
          </div>

          ${
            item.notes
              ? `<div class="box"><div class="label">Observações / Acessórios Inclusos</div><div class="value" style="font-weight: 500;">${item.notes}</div></div>`
              : ''
          }

          <div class="clause">
            Declaro ter recebido o equipamento acima identificado em perfeitas condições de funcionamento, comprometendo-me a zelar por sua guarda, conservação e devolução até a data prevista acima, comunicando imediatamente ao setor responsável qualquer ocorrência.
          </div>

          <div class="signatures">
            <div class="line"><strong>${item.borrowerName}</strong><br/>Colaborador Responsável</div>
            <div class="line"><strong>Gestão Patrimonial Patrify</strong><br/>Conferência de Expedição / Devolução</div>
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
