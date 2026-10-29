import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  PATRIMONY_CATEGORIES,
  PATRIMONY_CONDITIONS,
  PATRIMONY_STATUSES,
  PatrimonyCategory,
  PatrimonyCondition,
  PatrimonyStatus
} from '../../core/models/patrimony.model';
import { SubscriptionPlan } from '../../core/models/user.model';
import {
  AdminPatrimonyItem,
  AdminService,
  AdminSummary,
  AdminUserItem
} from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { formatCnpj } from '../../shared/utils/cnpj';

type AdminTab = 'users' | 'patrimonies' | 'plans';

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  priceLabel: string;
  limitLabel: string;
  maxPatrimonies: number | null;
  badgeClass: string;
  accentClass: string;
  features: string[];
  lockedFeatures: string[];
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  readonly categories = PATRIMONY_CATEGORIES;
  readonly statuses = PATRIMONY_STATUSES;
  readonly conditions = PATRIMONY_CONDITIONS;

  readonly plans: PlanDefinition[] = [
    {
      id: 'basic',
      name: 'Plano Básico',
      tagline: 'Essencial para pequenas operações e controle inicial',
      priceLabel: 'R$ 149/mês',
      limitLabel: 'Até 50 patrimônios',
      maxPatrimonies: 50,
      badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
      accentClass: 'border-slate-300',
      features: [
        'Dashboard Executivo e KPIs',
        'Inventário Patrimonial (até 50 bens)',
        'Etiquetas QR Code e Ficha Pública',
        'Mapa de Descarte Ecológico'
      ],
      lockedFeatures: [
        'Empréstimos e Cautelas (Check-out/Check-in)',
        'Plano de Manutenções e Ordens de Serviço',
        'Apólices de Seguros, Garantias e Sinistros',
        'Auditoria Física, Termos CLT e Balanço Contábil'
      ]
    },
    {
      id: 'pro',
      name: 'Plano Profissional',
      tagline: 'Controle operacional completo para empresas em expansão',
      priceLabel: 'R$ 349/mês',
      limitLabel: 'Até 500 patrimônios',
      maxPatrimonies: 500,
      badgeClass: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20',
      accentClass: 'border-brand-500',
      features: [
        'Tudo do Plano Básico (até 500 bens)',
        'Empréstimos e Cautelas Temporárias (Check-in/Out)',
        'Plano de Manutenções Preventivas e Corretivas',
        'Emissão de Ordens de Serviço (OS) e Recibos'
      ],
      lockedFeatures: [
        'Apólices de Seguros, Garantias e Sinistros',
        'Auditoria Física, Termos CLT e Balanço Contábil'
      ]
    },
    {
      id: 'enterprise',
      name: 'Plano Enterprise',
      tagline: 'Governança corporativa ilimitada, seguros e compliance contábil',
      priceLabel: 'R$ 790/mês',
      limitLabel: 'Patrimônios ilimitados',
      maxPatrimonies: null,
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
      accentClass: 'border-emerald-500',
      features: [
        'Patrimônios e Unidades Ilimitados',
        'Todos os módulos do Plano Profissional',
        'Gestão de Seguros, Garantias Estendidas e Sinistros',
        'Auditoria com Scanner, Termos CLT e Balanço Contábil'
      ],
      lockedFeatures: []
    }
  ];

  activeTab: AdminTab = 'users';

  summary: AdminSummary = {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalPatrimonies: 0,
    totalUnits: 0,
    totalAssetValue: 0,
    totalMaintenances: 0,
    totalLoans: 0,
    totalInsurances: 0
  };

  users: AdminUserItem[] = [];
  allUsersCatalog: AdminUserItem[] = [];
  patrimonies: AdminPatrimonyItem[] = [];

  loadingOverview = true;
  loadingPatrimonies = true;
  savingUser = false;
  savingPatrimony = false;
  showUserPassword = false;

  // Filtros de usuários
  userSearch = '';
  userPlanFilter = '';

  // Filtros de patrimônios
  patSearch = '';
  patUserFilter = '';
  patCategoryFilter = '';
  patStatusFilter = '';

  // Modal de Empresa / Usuário
  userModalOpen = false;
  editingUser: AdminUserItem | null = null;
  deleteUserCandidate: AdminUserItem | null = null;

  // Modal de Patrimônio Global
  patModalOpen = false;
  editingPatrimony: AdminPatrimonyItem | null = null;
  deletePatrimonyCandidate: AdminPatrimonyItem | null = null;

  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    legalName: [''],
    cnpj: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    phone1: [''],
    address: [''],
    economicActivity: [''],
    branchType: ['Matriz'],
    companySize: ['Médio porte'],
    role: ['company' as 'admin' | 'company'],
    plan: ['basic' as SubscriptionPlan],
    active: [true]
  });

  readonly patrimonyForm = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    category: ['Tecnologia' as PatrimonyCategory, [Validators.required]],
    status: ['Ativo' as PatrimonyStatus, [Validators.required]],
    condition: ['Excelente' as PatrimonyCondition, [Validators.required]],
    value: [0, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    purchaseDate: [this.todayIso(), [Validators.required]],
    location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    responsible: [''],
    invoiceNumber: [''],
    warrantyUntil: [''],
    notes: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminService: AdminService,
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadPatrimonies();
  }

  get filteredUsers(): AdminUserItem[] {
    if (!this.userPlanFilter) return this.users;
    return this.users.filter((u) => (u.plan || 'basic') === this.userPlanFilter);
  }

  get calculatedBatchTotal(): number {
    const val = Number(this.patrimonyForm.controls.value.value) || 0;
    const qty = Number(this.patrimonyForm.controls.quantity.value) || 1;
    return val * qty;
  }

  formatCnpjValue(value: string | null | undefined): string {
    return formatCnpj(value || '');
  }

  getPlanDef(plan: SubscriptionPlan | undefined): PlanDefinition {
    return this.plans.find((p) => p.id === (plan || 'basic')) || this.plans[0];
  }

  quotaPercent(user: AdminUserItem): number {
    const def = this.getPlanDef(user.plan);
    if (!def.maxPatrimonies) return 15;
    return Math.min(100, Math.round((user.metrics.patrimonyCount / def.maxPatrimonies) * 100));
  }

  loadOverview(): void {
    this.loadingOverview = true;
    this.adminService.getOverview(this.userSearch.trim() || undefined).subscribe({
      next: (res) => {
        this.summary = res.data.summary;
        this.users = res.data.users;
        if (!this.userSearch.trim()) {
          this.allUsersCatalog = res.data.users;
        }
        this.loadingOverview = false;
      },
      error: () => {
        this.loadingOverview = false;
      }
    });
  }

  loadPatrimonies(): void {
    this.loadingPatrimonies = true;
    this.adminService
      .listAllPatrimonies({
        search: this.patSearch.trim() || undefined,
        userId: this.patUserFilter || undefined,
        category: this.patCategoryFilter || undefined,
        status: this.patStatusFilter || undefined
      })
      .subscribe({
        next: (res) => {
          this.patrimonies = res.data;
          this.loadingPatrimonies = false;
        },
        error: () => {
          this.loadingPatrimonies = false;
        }
      });
  }

  clearPatrimonyFilters(): void {
    this.patSearch = '';
    this.patUserFilter = '';
    this.patCategoryFilter = '';
    this.patStatusFilter = '';
    this.loadPatrimonies();
  }

  inspectCompanyPatrimonies(user: AdminUserItem): void {
    this.patUserFilter = user.id;
    this.activeTab = 'patrimonies';
    this.loadPatrimonies();
  }

  selectPlanInForm(plan: SubscriptionPlan): void {
    this.userForm.patchValue({ plan });
  }

  quickChangePlan(user: AdminUserItem, plan: SubscriptionPlan): void {
    if (user.plan === plan) return;
    this.adminService.updateUser(user.id, { plan }).subscribe({
      next: () => {
        const def = this.getPlanDef(plan);
        this.toastr.success(
          `Plano da empresa ${user.name} alterado para ${def.name} (${def.limitLabel}).`,
          'Plano atualizado'
        );
        if (user.id === this.auth.currentUser?.id && this.auth.currentUser) {
          this.auth.updateUser({ ...this.auth.currentUser, plan });
        }
        this.loadOverview();
      }
    });
  }

  openCreateUserModal(defaultPlan: SubscriptionPlan = 'pro'): void {
    this.editingUser = null;
    this.showUserPassword = false;
    this.userForm.reset({
      name: '',
      legalName: '',
      cnpj: '',
      email: '',
      password: '',
      phone1: '',
      address: '',
      economicActivity: '',
      branchType: 'Matriz',
      companySize: 'Médio porte',
      role: 'company',
      plan: defaultPlan,
      active: true
    });
    this.userModalOpen = true;
  }

  openEditUserModal(user: AdminUserItem): void {
    this.editingUser = user;
    this.showUserPassword = false;
    this.userForm.reset({
      name: user.name,
      legalName: user.legalName || '',
      cnpj: formatCnpj(user.cnpj),
      email: user.email,
      password: '',
      phone1: user.phone1 || '',
      address: user.address || '',
      economicActivity: user.economicActivity || '',
      branchType: user.branchType || 'Matriz',
      companySize: user.companySize || 'Médio porte',
      role: user.role || 'company',
      plan: user.plan || 'basic',
      active: user.active !== false
    });
    this.userModalOpen = true;
  }

  closeUserModal(): void {
    if (this.savingUser) return;
    this.userModalOpen = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();

    if (!this.editingUser && (!raw.password || raw.password.trim().length < 6)) {
      this.toastr.warning(
        'Informe uma senha inicial de no mínimo 6 caracteres.',
        'Senha obrigatória'
      );
      return;
    }

    this.savingUser = true;

    if (this.editingUser) {
      const payload: Record<string, unknown> = {
        name: raw.name.trim(),
        legalName: raw.legalName?.trim() || null,
        cnpj: raw.cnpj,
        email: raw.email.trim(),
        phone1: raw.phone1?.trim() || null,
        address: raw.address?.trim() || null,
        economicActivity: raw.economicActivity?.trim() || null,
        branchType: raw.branchType || 'Matriz',
        companySize: raw.companySize || 'Médio porte',
        role: raw.role,
        plan: raw.plan,
        active: raw.active
      };
      if (raw.password && raw.password.trim().length >= 6) {
        payload['password'] = raw.password.trim();
      }

      this.adminService.updateUser(this.editingUser.id, payload).subscribe({
        next: () => {
          this.savingUser = false;
          this.userModalOpen = false;
          this.editingUser = null;
          this.toastr.success('Dados e plano da empresa atualizados com sucesso!', 'Salvo');
          this.loadOverview();
          this.loadPatrimonies();
        },
        error: () => {
          this.savingUser = false;
        }
      });
    } else {
      this.adminService
        .createUser({
          name: raw.name.trim(),
          legalName: raw.legalName?.trim() || raw.name.trim(),
          cnpj: raw.cnpj,
          email: raw.email.trim(),
          password: raw.password.trim(),
          phone1: raw.phone1?.trim() || null,
          address: raw.address?.trim() || null,
          economicActivity: raw.economicActivity?.trim() || null,
          branchType: raw.branchType || 'Matriz',
          companySize: raw.companySize || 'Médio porte',
          role: raw.role,
          plan: raw.plan,
          active: raw.active
        })
        .subscribe({
          next: () => {
            this.savingUser = false;
            this.userModalOpen = false;
            this.toastr.success('Nova empresa cadastrada na plataforma!', 'Empresa criada');
            this.loadOverview();
          },
          error: () => {
            this.savingUser = false;
          }
        });
    }
  }

  toggleUserActive(user: AdminUserItem): void {
    const newActive = !user.active;
    this.adminService.updateUser(user.id, { active: newActive }).subscribe({
      next: () => {
        this.toastr.info(
          newActive
            ? `Acesso da empresa ${user.name} foi liberado.`
            : `Acesso da empresa ${user.name} foi suspenso.`,
          newActive ? 'Conta Ativada' : 'Conta Suspensa'
        );
        this.loadOverview();
      }
    });
  }

  impersonate(user: AdminUserItem): void {
    this.adminService.impersonateUser(user.id).subscribe({
      next: (res) => {
        this.auth.adoptSession(res.data.token, res.data.user);
        const planDef = this.getPlanDef(res.data.user.plan);
        this.toastr.success(
          `Sessão alternada para ${res.data.user.name} (${planDef.name}).`,
          'Modo de Visualização'
        );
        this.router.navigate(['/home']);
      }
    });
  }

  askDeleteUser(user: AdminUserItem): void {
    this.deleteUserCandidate = user;
  }

  confirmDeleteUser(): void {
    if (!this.deleteUserCandidate) return;
    const id = this.deleteUserCandidate.id;
    this.adminService.deleteUser(id).subscribe({
      next: () => {
        this.toastr.success(
          'Empresa e todos os seus vínculos foram excluídos.',
          'Empresa removida'
        );
        this.deleteUserCandidate = null;
        this.loadOverview();
        this.loadPatrimonies();
      },
      error: () => {
        this.deleteUserCandidate = null;
      }
    });
  }

  openCreatePatrimonyModal(defaultUserId?: string): void {
    this.editingPatrimony = null;
    const ownerId =
      defaultUserId ||
      this.patUserFilter ||
      this.allUsersCatalog[0]?.id ||
      this.users[0]?.id ||
      '';
    this.patrimonyForm.reset({
      userId: ownerId,
      name: '',
      category: 'Tecnologia',
      status: 'Ativo',
      condition: 'Excelente',
      value: 0,
      quantity: 1,
      purchaseDate: this.todayIso(),
      location: '',
      responsible: '',
      invoiceNumber: '',
      warrantyUntil: '',
      notes: ''
    });
    this.patModalOpen = true;
  }

  openEditPatrimonyModal(pat: AdminPatrimonyItem): void {
    this.editingPatrimony = pat;
    this.patrimonyForm.reset({
      userId: pat.owner?.id || '',
      name: pat.name,
      category: pat.category,
      status: pat.status,
      condition: pat.condition,
      value: pat.value,
      quantity: pat.quantity || 1,
      purchaseDate: pat.purchaseDate || this.todayIso(),
      location: pat.location || '',
      responsible: pat.responsible || '',
      invoiceNumber: pat.invoiceNumber || '',
      warrantyUntil: pat.warrantyUntil || '',
      notes: pat.notes || ''
    });
    this.patModalOpen = true;
  }

  closePatrimonyModal(): void {
    if (this.savingPatrimony) return;
    this.patModalOpen = false;
    this.editingPatrimony = null;
  }

  savePatrimony(): void {
    if (this.patrimonyForm.invalid) {
      this.patrimonyForm.markAllAsTouched();
      return;
    }

    const raw = this.patrimonyForm.getRawValue();
    this.savingPatrimony = true;

    const payload = {
      userId: raw.userId,
      name: raw.name.trim(),
      category: raw.category,
      status: raw.status,
      condition: raw.condition,
      value: Number(raw.value) || 0,
      quantity: Number(raw.quantity) || 1,
      purchaseDate: raw.purchaseDate,
      location: raw.location.trim(),
      responsible: raw.responsible?.trim() || null,
      invoiceNumber: raw.invoiceNumber?.trim() || null,
      warrantyUntil: raw.warrantyUntil || null,
      notes: raw.notes?.trim() || null
    };

    if (this.editingPatrimony) {
      this.adminService.updatePatrimony(this.editingPatrimony.id, payload).subscribe({
        next: () => {
          this.savingPatrimony = false;
          this.patModalOpen = false;
          this.editingPatrimony = null;
          this.toastr.success('Patrimônio atualizado pela administração!', 'Salvo');
          this.loadOverview();
          this.loadPatrimonies();
        },
        error: () => {
          this.savingPatrimony = false;
        }
      });
    } else {
      this.adminService.createPatrimony(payload).subscribe({
        next: () => {
          this.savingPatrimony = false;
          this.patModalOpen = false;
          this.toastr.success('Patrimônio criado e vinculado à empresa selecionada!', 'Criado');
          this.loadOverview();
          this.loadPatrimonies();
        },
        error: () => {
          this.savingPatrimony = false;
        }
      });
    }
  }

  askDeletePatrimony(pat: AdminPatrimonyItem): void {
    this.deletePatrimonyCandidate = pat;
  }

  confirmDeletePatrimony(): void {
    if (!this.deletePatrimonyCandidate) return;
    const id = this.deletePatrimonyCandidate.id;
    this.adminService.deletePatrimony(id).subscribe({
      next: () => {
        this.toastr.success('Patrimônio removido pela administração.', 'Excluído');
        this.deletePatrimonyCandidate = null;
        this.loadOverview();
        this.loadPatrimonies();
      },
      error: () => {
        this.deletePatrimonyCandidate = null;
      }
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
