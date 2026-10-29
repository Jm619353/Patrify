import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Patrimony, PatrimonySummary } from '../../core/models/patrimony.model';
import { AuthService } from '../../core/services/auth.service';
import { PatrimonyService } from '../../core/services/patrimony.service';
import { formatCnpj } from '../../shared/utils/cnpj';

const AUDIT_STORAGE_KEY = 'patrify.audit.verifiedIds';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.component.html'
})
export class AuditoriaComponent implements OnInit {
  activeTab: 'audit' | 'term' | 'accounting' = 'audit';
  loading = true;

  items: Patrimony[] = [];
  summary: PatrimonySummary | null = null;

  // Aba 1: Conferência física / Auditoria
  scannerSerial = '';
  auditFilter: 'all' | 'pending' | 'verified' = 'all';
  verifiedIds = new Set<string>();
  auditingId: string | null = null;

  // Aba 2: Termo de Responsabilidade (Cautela)
  selectedForTerm = new Set<string>();
  termRecipient = {
    name: '',
    document: '',
    role: '',
    department: '',
    notes: 'Equipamento(s) entregue(s) em perfeitas condições de funcionamento para uso exclusivo nas atividades profissionais.'
  };

  constructor(
    private readonly patrimonyService: PatrimonyService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.restoreAuditState();
    this.loadData();
  }

  get verifiedCount(): number {
    return this.items.filter((item) => this.verifiedIds.has(item.id)).length;
  }

  get auditProgressPercent(): number {
    if (this.items.length === 0) return 0;
    return Math.round((this.verifiedCount / this.items.length) * 100);
  }

  get filteredAuditItems(): Patrimony[] {
    if (this.auditFilter === 'verified') {
      return this.items.filter((item) => this.verifiedIds.has(item.id));
    }
    if (this.auditFilter === 'pending') {
      return this.items.filter((item) => !this.verifiedIds.has(item.id));
    }
    return this.items;
  }

  get selectedTermItems(): Patrimony[] {
    return this.items.filter((item) => this.selectedForTerm.has(item.id));
  }

  get selectedTermTotalValue(): number {
    return this.selectedTermItems.reduce((acc, item) => acc + item.value * item.quantity, 0);
  }

  get totalAcquisitionValue(): number {
    return this.items.reduce((acc, item) => acc + item.value * item.quantity, 0);
  }

  get totalDepreciatedValue(): number {
    return this.items.reduce(
      (acc, item) => acc + (item.depreciation?.totalDepreciatedValue ?? item.value * item.quantity),
      0
    );
  }

  get totalDepreciationLoss(): number {
    return Math.max(0, this.totalAcquisitionValue - this.totalDepreciatedValue);
  }

  loadData(): void {
    this.loading = true;
    this.patrimonyService.list({ page: 1, pageSize: 100 }).subscribe({
      next: ({ data }) => {
        this.items = data;
        data.forEach((item) => {
          const hasAuditMovement = item.movements?.some((m) => m.type === 'Auditoria');
          if (hasAuditMovement) {
            this.verifiedIds.add(item.id);
          }
        });
        this.persistAuditState();
        if (this.selectedForTerm.size === 0 && data.length > 0) {
          this.selectedForTerm.add(data[0].id);
          if (data[0].responsible) {
            this.termRecipient.name = data[0].responsible;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.patrimonyService.summary().subscribe({
      next: (summary) => {
        this.summary = summary;
      }
    });
  }

  onScanSerial(): void {
    const serial = this.scannerSerial.trim().toUpperCase();
    if (!serial) return;

    const found = this.items.find((item) => item.serialNumber.toUpperCase() === serial);
    if (!found) {
      this.toastr.error(
        `Nenhum patrimônio com o código "${serial}" foi localizado no inventário.`,
        'Código não encontrado'
      );
      return;
    }

    this.scannerSerial = '';
    this.verifyPatrimony(found);
  }

  verifyPatrimony(item: Patrimony): void {
    if (this.auditingId) return;
    this.auditingId = item.id;

    this.patrimonyService
      .addMovement(item.id, {
        type: 'Auditoria',
        description: `Presença física e integridade conferidas em auditoria patrimonial (${
          item.location || 'Local padrão'
        }).`
      })
      .subscribe({
        next: (updated) => {
          const index = this.items.findIndex((entry) => entry.id === item.id);
          if (index >= 0) this.items[index] = updated;
          this.verifiedIds.add(item.id);
          this.persistAuditState();
          this.auditingId = null;
          this.toastr.success(
            `${item.serialNumber} (${item.name}) conferido com sucesso.`,
            'Patrimônio auditado'
          );
        },
        error: () => {
          this.auditingId = null;
        }
      });
  }

  resetAuditSession(): void {
    this.verifiedIds.clear();
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    this.toastr.info('Sessão local de conferência reiniciada.', 'Nova conferência');
  }

  toggleTermSelection(item: Patrimony): void {
    if (this.selectedForTerm.has(item.id)) {
      this.selectedForTerm.delete(item.id);
    } else {
      this.selectedForTerm.add(item.id);
      if (!this.termRecipient.name && item.responsible) {
        this.termRecipient.name = item.responsible;
      }
    }
  }

  selectAllForTerm(): void {
    if (this.selectedForTerm.size === this.items.length) {
      this.selectedForTerm.clear();
    } else {
      this.items.forEach((item) => this.selectedForTerm.add(item.id));
    }
  }

  printResponsibilityTerm(): void {
    const selected = this.selectedTermItems;
    if (selected.length === 0) {
      this.toastr.warning('Selecione ao menos um patrimônio para emitir o termo.', 'Nenhum bem');
      return;
    }
    if (!this.termRecipient.name.trim()) {
      this.toastr.warning('Informe o nome do colaborador ou responsável recebedor.', 'Campo obrigatório');
      return;
    }

    const user = this.auth.currentUser;
    const companyName = user?.legalName || user?.name || 'Empresa Proprietária';
    const companyCnpj = formatCnpj(user?.cnpj) || '—';
    const todayStr = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' });

    const rowsHtml = selected
      .map(
        (item) => `
      <tr>
        <td style="font-family:monospace;font-weight:700;">${item.serialNumber}</td>
        <td><strong>${item.name}</strong><br/><span style="font-size:11px;color:#64748b;">${
          item.category
        }${item.invoiceNumber ? ` · NF: ${item.invoiceNumber}` : ''}</span></td>
        <td>${item.condition}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;font-weight:600;">R$ ${(item.value * item.quantity)
          .toFixed(2)
          .replace('.', ',')}</td>
      </tr>`
      )
      .join('');

    const popup = window.open('', '_blank', 'width=900,height=780');
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo de Responsabilidade Patrimonial - ${this.termRecipient.name}</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { margin: 36px; color: #0f172a; line-height: 1.55; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; }
    .title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
    .subtitle { font-size: 12px; color: #475569; margin-top: 4px; }
    .section { margin-top: 20px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #7c3aed; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; }
    .clauses { font-size: 12px; text-align: justify; color: #334155; }
    .clauses li { margin-bottom: 6px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; text-align: center; }
    .sig-box { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Termo de Responsabilidade e Guarda de Patrimônio</div>
      <div class="subtitle">${companyName} · CNPJ: ${companyCnpj}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b;">
      Emissão: ${todayStr}<br/>
      Sistema Patrify
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Identificação do Responsável / Recebedor</div>
    <div class="info-grid">
      <div><strong>Nome / Colaborador:</strong> ${this.termRecipient.name}</div>
      <div><strong>CPF / Matrícula:</strong> ${this.termRecipient.document || '_______________________'}</div>
      <div><strong>Cargo / Função:</strong> ${this.termRecipient.role || '_______________________'}</div>
      <div><strong>Departamento / Setor:</strong> ${this.termRecipient.department || '_______________________'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Relação de Bens Patrimoniais Entregues</div>
    <table>
      <thead>
        <tr>
          <th>Código de Série</th>
          <th>Descrição do Patrimônio</th>
          <th>Conservação</th>
          <th style="text-align:center;">Qtd</th>
          <th style="text-align:right;">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr>
          <td colspan="4" style="text-align:right;font-weight:700;">VALOR TOTAL SOB GUARDA:</td>
          <td style="text-align:right;font-weight:800;">R$ ${this.selectedTermTotalValue
            .toFixed(2)
            .replace('.', ',')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Condições de Uso, Guarda e Conservação</div>
    <ol class="clauses">
      <li>Declaro ter recebido da empresa <strong>${companyName}</strong> os bens patrimoniais discriminados neste termo, em perfeito estado de conservação e funcionamento, para uso exclusivo no desempenho de minhas atribuições profissionais.</li>
      <li>Comprometo-me a zelar pela integridade, segurança e conservação dos equipamentos, comunicando imediatamente ao setor responsável qualquer defeito, avaria, extravio ou necessidade de manutenção.</li>
      <li>Nos termos do Art. 462, §1º da CLT, fico ciente da responsabilidade por eventuais danos causados por dolo, mau uso comprovado ou negligência na guarda dos bens.</li>
      <li>Comprometo-me a devolver os bens imediatamente em caso de solicitação da empresa, mudança de função ou desligamento do quadro de colaboradores.</li>
    </ol>
    ${
      this.termRecipient.notes
        ? `<p style="margin-top:8px;font-size:12px;"><strong>Observações da Entrega:</strong> ${this.termRecipient.notes}</p>`
        : ''
    }
  </div>

  <p style="margin-top:24px;">Data de recebimento: ${todayStr}</p>

  <div class="signatures">
    <div class="sig-box">
      <strong>${this.termRecipient.name}</strong><br/>
      Assinatura do Colaborador / Responsável
    </div>
    <div class="sig-box">
      <strong>${companyName}</strong><br/>
      Gestão Patrimonial / Representante Legal
    </div>
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    popup.document.close();
  }

  printExecutiveReport(): void {
    const user = this.auth.currentUser;
    const companyName = user?.legalName || user?.name || 'Empresa Proprietária';
    const companyCnpj = formatCnpj(user?.cnpj) || '—';
    const todayStr = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' });

    const rowsHtml = this.items
      .map(
        (item) => `
      <tr>
        <td style="font-family:monospace;font-weight:700;">${item.serialNumber}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.location || '—'}</td>
        <td>${item.status} / ${item.condition}</td>
        <td style="text-align:right;">R$ ${(item.value * item.quantity).toFixed(2).replace('.', ',')}</td>
        <td style="text-align:right;">${item.depreciation?.depreciationPercent ?? 0}%</td>
        <td style="text-align:right;font-weight:700;">R$ ${(
          item.depreciation?.totalDepreciatedValue ?? item.value * item.quantity
        )
          .toFixed(2)
          .replace('.', ',')}</td>
      </tr>`
      )
      .join('');

    const popup = window.open('', '_blank', 'width=980,height=800');
    if (!popup) return;

    popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Laudo Contábil e Relatório Executivo de Patrimônio</title>
  <style>
    * { box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
    body { margin: 32px; color: #0f172a; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 11px; }
    th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:18px;font-weight:800;">BALANÇO PATRIMONIAL & LAUDO DE DEPRECIAÇÃO CONTÁBIL</div>
      <div style="color:#475569;margin-top:3px;">${companyName} · CNPJ: ${companyCnpj}</div>
    </div>
    <div style="text-align:right;color:#64748b;">
      Emitido em ${todayStr}<br/>
      Auditoria Conferida: ${this.verifiedCount}/${this.items.length} bens (${this.auditProgressPercent}%)
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total de Patrimônios</div>
      <div class="kpi-val">${this.items.length} itens</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Valor Bruto de Aquisição</div>
      <div class="kpi-val">R$ ${this.totalAcquisitionValue.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Depreciação Acumulada</div>
      <div class="kpi-val" style="color:#b45309;">- R$ ${this.totalDepreciationLoss.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Valor Contábil Líquido</div>
      <div class="kpi-val" style="color:#047857;">R$ ${this.totalDepreciatedValue.toFixed(2).replace('.', ',')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Série</th>
        <th>Patrimônio</th>
        <th>Categoria</th>
        <th>Localização</th>
        <th>Situação</th>
        <th style="text-align:right;">Vlr. Aquisição</th>
        <th style="text-align:right;">Deprec.</th>
        <th style="text-align:right;">Vlr. Contábil</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    popup.document.close();
  }

  private restoreAuditState(): void {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.verifiedIds = new Set(parsed.map(String));
        }
      }
    } catch {
      this.verifiedIds = new Set();
    }
  }

  private persistAuditState(): void {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([...this.verifiedIds]));
    } catch {
      // Ignore storage errors
    }
  }
}
