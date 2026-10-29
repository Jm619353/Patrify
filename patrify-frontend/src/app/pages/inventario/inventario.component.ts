import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  expand,
  forkJoin,
  reduce,
  Subject,
  takeUntil
} from 'rxjs';
import { PaginationMeta } from '../../core/models/api.model';
import {
  PATRIMONY_CATEGORIES,
  PATRIMONY_CONDITIONS,
  PATRIMONY_MOVEMENT_TYPES,
  PATRIMONY_STATUSES,
  Patrimony,
  PatrimonyCategory,
  PatrimonyCondition,
  PatrimonyMovementPayload,
  PatrimonyPayload,
  PatrimonyQrCode,
  PatrimonyQuery,
  PatrimonySort,
  PatrimonyStatus
} from '../../core/models/patrimony.model';
import { AuthService } from '../../core/services/auth.service';
import { PatrimonyService } from '../../core/services/patrimony.service';
import { PreferencesService } from '../../core/services/preferences.service';

const EMPTY_META: PaginationMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false
};

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit, OnDestroy {
  readonly categories = PATRIMONY_CATEGORIES;
  readonly statuses = PATRIMONY_STATUSES;
  readonly conditions = PATRIMONY_CONDITIONS;
  readonly movementTypes = PATRIMONY_MOVEMENT_TYPES.filter((type) => type !== 'Cadastro');

  items: Patrimony[] = [];
  meta: PaginationMeta = { ...EMPTY_META };
  loading = true;
  exporting = false;
  printingTags = false;

  filters: {
    search: string;
    category: PatrimonyCategory | '';
    status: PatrimonyStatus | '';
    condition: PatrimonyCondition | '';
    sort: PatrimonySort;
    order: 'asc' | 'desc';
  } = {
    search: '',
    category: '',
    status: '',
    condition: '',
    sort: 'createdAt',
    order: 'desc'
  };

  page = 1;
  pageSize = 10;

  modalOpen = false;
  editing: Patrimony | null = null;
  saving = false;
  form: PatrimonyPayload = this.emptyForm();
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  detailsOpen = false;
  detailsTab: 'qrcode' | 'info' | 'movements' = 'qrcode';
  detailsItem: Patrimony | null = null;
  qrData: PatrimonyQrCode | null = null;
  qrLoading = false;
  movementSaving = false;
  movementForm: PatrimonyMovementPayload = {
    type: 'Transferência',
    description: '',
    location: '',
    responsible: ''
  };

  confirmOpen = false;
  deleting: Patrimony | null = null;
  deletingBusy = false;

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly patrimonyService: PatrimonyService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private readonly route: ActivatedRoute,
    private readonly preferences: PreferencesService
  ) {}

  ngOnInit(): void {
    this.pageSize = this.preferences.pageSize;
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filters.search = value;
        this.page = 1;
        this.load();
      });

    this.load();

    if (this.route.snapshot.queryParamMap.get('create') === '1') {
      this.openCreate();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageNumbers(): number[] {
    const total = this.meta.totalPages;
    if (total <= 1) return total === 1 ? [1] : [];

    const start = Math.max(1, Math.min(this.page - 2, total - 4));
    const end = Math.min(total, start + 4);
    const pages: number[] = [];
    for (let current = start; current <= end; current += 1) pages.push(current);
    return pages;
  }

  get hasFilters(): boolean {
    return Boolean(
      this.filters.search ||
        this.filters.category ||
        this.filters.status ||
        this.filters.condition
    );
  }

  get rangeStart(): number {
    return this.meta.total === 0 ? 0 : (this.meta.page - 1) * this.meta.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.meta.page * this.meta.pageSize, this.meta.total);
  }

  get companyName(): string {
    return this.auth.currentUser?.name || 'Patrify Corporativo';
  }

  load(): void {
    this.loading = true;
    const query: PatrimonyQuery = {
      page: this.page,
      pageSize: this.pageSize,
      search: this.filters.search || undefined,
      category: this.filters.category || undefined,
      status: this.filters.status || undefined,
      condition: this.filters.condition || undefined,
      sort: this.filters.sort,
      order: this.filters.order
    };

    this.patrimonyService.list(query).subscribe({
      next: ({ data, meta }) => {
        this.items = data;
        this.meta = meta ?? { ...EMPTY_META };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      category: '',
      status: '',
      condition: '',
      sort: 'createdAt',
      order: 'desc'
    };
    this.page = 1;
    this.load();
  }

  sortBy(field: PatrimonySort): void {
    if (this.filters.sort === field) {
      this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort = field;
      this.filters.order = field === 'name' ? 'asc' : 'desc';
    }
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.preferences.pageSize = size;
    this.page = 1;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.form = this.emptyForm();
    this.selectedFile = null;
    this.imagePreview = null;
    this.modalOpen = true;
  }

  duplicateItem(item: Patrimony): void {
    this.editing = null;
    this.form = {
      name: `${item.name} (Cópia)`,
      value: item.value,
      purchaseDate: new Date().toISOString().slice(0, 10),
      location: item.location || '',
      status: item.status,
      condition: item.condition,
      category: item.category,
      quantity: item.quantity,
      responsible: item.responsible || '',
      invoiceNumber: item.invoiceNumber || '',
      warrantyUntil: item.warrantyUntil || '',
      notes: item.notes || ''
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.modalOpen = true;
  }

  openEdit(item: Patrimony): void {
    this.editing = item;
    this.form = {
      name: item.name,
      value: item.value,
      purchaseDate: item.purchaseDate,
      location: item.location || '',
      status: item.status,
      condition: item.condition,
      category: item.category,
      quantity: item.quantity,
      responsible: item.responsible || '',
      invoiceNumber: item.invoiceNumber || '',
      warrantyUntil: item.warrantyUntil || '',
      notes: item.notes || ''
    };
    this.selectedFile = null;
    this.imagePreview = item.imageUrl;
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalOpen = false;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  openDetails(item: Patrimony, tab: 'qrcode' | 'info' | 'movements' = 'qrcode'): void {
    this.detailsItem = item;
    this.detailsTab = tab;
    this.detailsOpen = true;
    this.qrData = null;
    this.qrLoading = true;
    this.movementForm = {
      type: 'Transferência',
      description: '',
      location: item.location || '',
      responsible: item.responsible || '',
      status: item.status,
      condition: item.condition
    };

    this.patrimonyService.getQrCode(item.id).subscribe({
      next: (qr) => {
        this.qrData = qr;
        this.qrLoading = false;
      },
      error: () => {
        this.qrLoading = false;
      }
    });
  }

  closeDetails(): void {
    if (this.movementSaving) return;
    this.detailsOpen = false;
    this.detailsItem = null;
    this.qrData = null;
  }

  submitMovement(): void {
    if (!this.detailsItem) return;
    if (!this.movementForm.description.trim() || this.movementForm.description.trim().length < 2) {
      this.toastr.warning('Descreva o motivo ou detalhes da movimentação.', 'Campo obrigatório');
      return;
    }

    this.movementSaving = true;
    this.patrimonyService
      .addMovement(this.detailsItem.id, {
        type: this.movementForm.type,
        description: this.movementForm.description.trim(),
        location: this.movementForm.location?.trim() || undefined,
        responsible: this.movementForm.responsible?.trim() || undefined,
        status: this.movementForm.status,
        condition: this.movementForm.condition
      })
      .subscribe({
        next: (updated) => {
          this.detailsItem = updated;
          this.movementSaving = false;
          this.movementForm.description = '';
          this.toastr.success('Movimentação registrada no histórico do bem.', 'Histórico atualizado');
          this.load();
        },
        error: () => {
          this.movementSaving = false;
        }
      });
  }

  copyVerificationLink(): void {
    if (!this.qrData?.verificationUrl || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.qrData.verificationUrl).then(() => {
      this.toastr.success('Link público do QR Code copiado.', 'Link copiado');
    });
  }

  downloadQrCode(): void {
    if (!this.qrData?.qrCodeDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = this.qrData.qrCodeDataUrl;
    anchor.download = `qrcode-${this.qrData.serialNumber}.png`;
    anchor.click();
  }

  printSingleTag(): void {
    if (!this.detailsItem || !this.qrData) return;
    this.openPrintWindow([
      {
        item: this.detailsItem,
        qrCodeDataUrl: this.qrData.qrCodeDataUrl
      }
    ]);
  }

  printPageTags(): void {
    if (this.items.length === 0 || this.printingTags) return;
    this.printingTags = true;

    forkJoin(this.items.map((item) => this.patrimonyService.getQrCode(item.id))).subscribe({
      next: (qrResults) => {
        this.printingTags = false;
        const tags = this.items.map((item, index) => ({
          item,
          qrCodeDataUrl: qrResults[index].qrCodeDataUrl
        }));
        this.openPrintWindow(tags);
      },
      error: () => {
        this.printingTags = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.toastr.warning('Use uma imagem JPEG, PNG ou WEBP.', 'Formato inválido');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastr.warning('A imagem deve ter no máximo 5 MB.', 'Arquivo muito grande');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreview = this.editing?.imageUrl || null;
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toastr.warning('Informe o nome do patrimônio.', 'Campo obrigatório');
      return;
    }
    if (!this.form.purchaseDate) {
      this.toastr.warning('Informe a data de aquisição.', 'Campo obrigatório');
      return;
    }
    if (this.form.value < 0 || Number.isNaN(Number(this.form.value))) {
      this.toastr.warning('Informe um valor válido.', 'Campo inválido');
      return;
    }

    this.saving = true;
    const payload: PatrimonyPayload = {
      ...this.form,
      name: this.form.name.trim(),
      value: Number(this.form.value),
      quantity: Number(this.form.quantity) || 1,
      location: this.form.location?.trim() || '',
      responsible: this.form.responsible?.trim() || '',
      invoiceNumber: this.form.invoiceNumber?.trim() || '',
      warrantyUntil: this.form.warrantyUntil || '',
      notes: this.form.notes?.trim() || ''
    };

    const request = this.editing
      ? this.patrimonyService.update(this.editing.id, payload)
      : this.patrimonyService.create(payload);

    request.subscribe({
      next: (saved) => {
        if (this.selectedFile) {
          this.patrimonyService.uploadImage(saved.id, this.selectedFile).subscribe({
            next: () => this.finishSave(),
            error: () => {
              this.saving = false;
              this.modalOpen = false;
              this.load();
              this.toastr.warning(
                'O patrimônio foi salvo, mas a imagem não pôde ser enviada.',
                'Imagem não enviada'
              );
            }
          });
        } else {
          this.finishSave();
        }
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  requestDelete(item: Patrimony): void {
    this.deleting = item;
    this.confirmOpen = true;
  }

  cancelDelete(): void {
    if (this.deletingBusy) return;
    this.confirmOpen = false;
    this.deleting = null;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.deletingBusy = true;
    const id = this.deleting.id;

    this.patrimonyService.remove(id).subscribe({
      next: () => {
        this.deletingBusy = false;
        this.confirmOpen = false;
        this.deleting = null;
        this.toastr.success('Patrimônio removido do inventário.', 'Removido');
        if (this.items.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.load();
      },
      error: () => {
        this.deletingBusy = false;
      }
    });
  }

  exportCsv(): void {
    this.exporting = true;
    this.fetchAllForExport().subscribe({
      next: (items) => {
        this.downloadCsv(items);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
      }
    });
  }

  trackById(index: number, item: Patrimony): string {
    return item.id;
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

  private openPrintWindow(tags: Array<{ item: Patrimony; qrCodeDataUrl: string }>): void {
    const popup = window.open('', '_blank', 'width=860,height=720');
    if (!popup) {
      this.toastr.warning('Permita pop-ups no navegador para imprimir as etiquetas.', 'Pop-up bloqueado');
      return;
    }

    const company = this.companyName;
    const cardsHtml = tags
      .map(
        ({ item, qrCodeDataUrl }) => `
      <div class="tag">
        <img class="qr" src="${qrCodeDataUrl}" alt="QR ${item.serialNumber}" />
        <div class="info">
          <div class="brand">Patrify · Plaqueta Patrimonial</div>
          <div class="company">${company}</div>
          <div class="name">${item.name}</div>
          <div class="serial">${item.serialNumber}</div>
          <div class="meta">${item.category}${item.location ? ` · ${item.location}` : ''}</div>
        </div>
      </div>`
      )
      .join('');

    popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas Patrimoniais QR - Patrify</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { margin: 20px; background: #fff; color: #0f172a; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 14px;
    }
    .tag {
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      page-break-inside: avoid;
    }
    .qr { width: 108px; height: 108px; flex-shrink: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3px; }
    .info { flex: 1; min-width: 0; }
    .brand { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: #7c3aed; }
    .company { font-size: 11px; font-weight: 600; color: #475569; margin-top: 2px; }
    .name { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px; line-height: 1.25; }
    .serial {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 7px;
      background: #0f172a;
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      border-radius: 5px;
      letter-spacing: 0.08em;
    }
    .meta { font-size: 10px; color: #64748b; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="grid">${cardsHtml}</div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    popup.document.close();
  }

  private fetchAllForExport(): import('rxjs').Observable<Patrimony[]> {
    const query: PatrimonyQuery = {
      page: 1,
      pageSize: 100,
      search: this.filters.search || undefined,
      category: this.filters.category || undefined,
      status: this.filters.status || undefined,
      condition: this.filters.condition || undefined,
      sort: this.filters.sort,
      order: this.filters.order
    };

    return this.patrimonyService.list(query).pipe(
      expand((response) =>
        response.meta?.hasNextPage
          ? this.patrimonyService.list({
              ...query,
              page: response.meta.page + 1
            })
          : EMPTY
      ),
      reduce((accumulated, response) => [...accumulated, ...response.data], [] as Patrimony[])
    );
  }

  private downloadCsv(items: Patrimony[]): void {
    const header = [
      'Código de série',
      'Nome',
      'Categoria',
      'Status',
      'Conservação',
      'Localização',
      'Responsável',
      'Nota Fiscal',
      'Garantia até',
      'Valor de aquisição',
      'Valor contábil estimado',
      'Data de aquisição',
      'Quantidade'
    ];

    const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = items.map((item) =>
      [
        item.serialNumber,
        item.name,
        item.category,
        item.status,
        item.condition,
        item.location || '',
        item.responsible || '',
        item.invoiceNumber || '',
        item.warrantyUntil || '',
        item.value.toFixed(2).replace('.', ','),
        (item.depreciation?.totalDepreciatedValue ?? item.value).toFixed(2).replace('.', ','),
        item.purchaseDate,
        item.quantity
      ]
        .map(escape)
        .join(';')
    );

    const csv = `\uFEFF${[header.map(escape).join(';'), ...rows].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `patrify-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.toastr.success(`${items.length} patrimônios exportados.`, 'Exportação concluída');
  }

  private finishSave(): void {
    this.saving = false;
    this.modalOpen = false;
    this.selectedFile = null;
    this.imagePreview = null;
    this.toastr.success(
      this.editing ? 'Patrimônio atualizado com sucesso.' : 'Patrimônio cadastrado com sucesso.',
      'Tudo certo'
    );
    this.load();
  }

  private emptyForm(): PatrimonyPayload {
    return {
      name: '',
      value: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      location: '',
      status: 'Ativo',
      condition: 'Novo',
      category: 'Tecnologia',
      quantity: 1,
      responsible: '',
      invoiceNumber: '',
      warrantyUntil: '',
      notes: ''
    };
  }
}
