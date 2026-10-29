import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  MaintenanceOrder,
  MaintenancePayload,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceSummary,
  MaintenanceType
} from '../../core/models/maintenance.model';
import { Patrimony } from '../../core/models/patrimony.model';
import { AuthService } from '../../core/services/auth.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { PatrimonyService } from '../../core/services/patrimony.service';

@Component({
  selector: 'app-manutencoes',
  templateUrl: './manutencoes.component.html'
})
export class ManutencoesComponent implements OnInit {
  readonly types = MAINTENANCE_TYPES;
  readonly priorities = MAINTENANCE_PRIORITIES;
  readonly statuses = MAINTENANCE_STATUSES;

  orders: MaintenanceOrder[] = [];
  patrimonies: Patrimony[] = [];
  summary: MaintenanceSummary = {
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    totalCost: 0
  };

  loading = true;
  saving = false;
  modalOpen = false;
  editing: MaintenanceOrder | null = null;

  filters: {
    search: string;
    status: MaintenanceStatus | '';
    type: MaintenanceType | '';
    priority: MaintenancePriority | '';
  } = {
    search: '',
    status: '',
    type: '',
    priority: ''
  };

  form: MaintenancePayload = this.emptyForm();

  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly patrimonyService: PatrimonyService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPatrimonies();
    this.load();
  }

  get hasFilters(): boolean {
    return Boolean(
      this.filters.search || this.filters.status || this.filters.type || this.filters.priority
    );
  }

  loadPatrimonies(): void {
    this.patrimonyService.list({ page: 1, pageSize: 100 }).subscribe({
      next: ({ data }) => {
        this.patrimonies = data;
        if (!this.form.patrimonyId && data.length > 0) {
          this.form.patrimonyId = data[0].id;
        }
      }
    });
  }

  load(): void {
    this.loading = true;
    this.maintenanceService
      .list({
        search: this.filters.search.trim() || undefined,
        status: this.filters.status || undefined,
        type: this.filters.type || undefined,
        priority: this.filters.priority || undefined
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.orders = data;
          this.summary = meta || {
            total: data.length,
            open: 0,
            inProgress: 0,
            completed: 0,
            totalCost: 0
          };
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', type: '', priority: '' };
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.form = this.emptyForm();
    if (this.patrimonies.length > 0) {
      this.form.patrimonyId = this.patrimonies[0].id;
    }
    this.modalOpen = true;
  }

  openEdit(order: MaintenanceOrder): void {
    this.editing = order;
    this.form = {
      patrimonyId: order.patrimonyId,
      title: order.title,
      type: order.type,
      priority: order.priority,
      status: order.status,
      provider: order.provider || '',
      cost: order.cost,
      scheduledDate: order.scheduledDate,
      notes: order.notes || ''
    };
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
  }

  save(): void {
    if (!this.form.patrimonyId) {
      this.toastr.warning('Selecione o patrimônio.', 'Campo obrigatório');
      return;
    }
    if (!this.form.title.trim()) {
      this.toastr.warning('Informe a descrição do serviço.', 'Campo obrigatório');
      return;
    }

    this.saving = true;
    const payload: MaintenancePayload = {
      ...this.form,
      title: this.form.title.trim(),
      cost: Number(this.form.cost) || 0,
      provider: this.form.provider?.trim() || '',
      notes: this.form.notes?.trim() || ''
    };

    const req$ = this.editing
      ? this.maintenanceService.update(this.editing.id, payload)
      : this.maintenanceService.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.modalOpen = false;
        this.toastr.success(
          this.editing
            ? 'Ordem de manutenção atualizada.'
            : 'Ordem de manutenção aberta e registrada no histórico do patrimônio.',
          'Manutenção salva'
        );
        this.load();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  changeStatus(order: MaintenanceOrder, status: MaintenanceStatus): void {
    this.maintenanceService.update(order.id, { status }).subscribe({
      next: () => {
        this.toastr.success(`Status alterado para "${status}".`, 'Ordem atualizada');
        this.load();
      }
    });
  }

  deleteOrder(order: MaintenanceOrder): void {
    this.maintenanceService.remove(order.id).subscribe({
      next: () => {
        this.toastr.success('Ordem de manutenção removida.', 'Removida');
        this.load();
      }
    });
  }

  statusBadge(status: MaintenanceStatus): string {
    switch (status) {
      case 'Concluída':
        return 'badge-success';
      case 'Em andamento':
        return 'badge-warning';
      case 'Cancelada':
        return 'badge-neutral';
      default:
        return 'badge-danger';
    }
  }

  priorityBadge(priority: MaintenancePriority): string {
    switch (priority) {
      case 'Crítica':
      case 'Alta':
        return 'badge-danger';
      case 'Média':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }

  printServiceOrder(order: MaintenanceOrder): void {
    const company = this.auth.currentUser?.name || 'Patrify Corporativo';
    const cnpj = this.auth.currentUser?.cnpj || '';
    const popup = window.open('', '_blank', 'width=820,height=700');
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Ordem de Serviço - ${order.serialNumber}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { margin: 32px; color: #0f172a; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
    .brand { font-size: 20px; font-weight: 800; color: #7c3aed; }
    .subtitle { font-size: 12px; color: #64748b; }
    .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-top: 18px; }
    .box-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 64px; text-align: center; font-size: 12px; }
    .sig-line { border-top: 1px solid #0f172a; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">PATRIFY · ORDEM DE SERVIÇO E MANUTENÇÃO</div>
      <div class="subtitle">${company}${cnpj ? ` · CNPJ ${cnpj}` : ''}</div>
    </div>
    <div style="text-align:right;font-size:12px;">
      <strong>OS Nº:</strong> ${order.id.slice(-8).toUpperCase()}<br/>
      <strong>Status:</strong> ${order.status}
    </div>
  </div>

  <div class="box">
    <div class="box-title">1. Identificação do Patrimônio</div>
    <div class="grid">
      <div><strong>Equipamento / Bem:</strong> ${order.patrimonyName}</div>
      <div><strong>Código de Série:</strong> ${order.serialNumber}</div>
      <div><strong>Categoria:</strong> ${order.category}</div>
      <div><strong>Data Programada:</strong> ${order.scheduledDate}</div>
    </div>
  </div>

  <div class="box">
    <div class="box-title">2. Dados da Manutenção</div>
    <div class="grid">
      <div><strong>Tipo:</strong> ${order.type}</div>
      <div><strong>Prioridade:</strong> ${order.priority}</div>
      <div><strong>Prestador / Fornecedor:</strong> ${order.provider || 'Equipe Interna'}</div>
      <div><strong>Custo Estimado / Efetivo:</strong> R$ ${order.cost.toFixed(2).replace('.', ',')}</div>
    </div>
    <div style="margin-top:12px;font-size:13px;">
      <strong>Descrição do Serviço:</strong><br/>${order.title}
    </div>
    ${
      order.notes
        ? `<div style="margin-top:10px;font-size:13px;"><strong>Laudo / Observações Técnicas:</strong><br/>${order.notes}</div>`
        : ''
    }
  </div>

  <div class="signatures">
    <div class="sig-line">Responsável pela Abertura / Patrimônio</div>
    <div class="sig-line">Técnico / Prestador Executante</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    popup.document.close();
  }

  private emptyForm(): MaintenancePayload {
    return {
      patrimonyId: '',
      title: '',
      type: 'Preventiva',
      priority: 'Média',
      status: 'Aberta',
      provider: '',
      cost: 0,
      scheduledDate: new Date().toISOString().slice(0, 10),
      notes: ''
    };
  }
}
