import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiError } from '../../core/models/api.model';
import { UpdateProfilePayload, User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { formatCnpj } from '../../shared/utils/cnpj';

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
};

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('newPassword')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  if (!password || !confirmation) return null;
  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-userpage',
  templateUrl: './userpage.component.html',
  styleUrls: ['./userpage.component.css']
})
export class UserpageComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  user: User | null = null;
  loading = true;
  savingProfile = false;
  savingPassword = false;
  activeTab: 'profile' | 'security' = 'profile';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.user = this.auth.currentUser;
    this.loadProfile();
  }

  get initials(): string {
    if (!this.user?.name) return 'P';
    return this.user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  get cnpj(): string {
    return formatCnpj(this.user?.cnpj);
  }

  get memberSince(): string {
    return formatDate(this.user?.createdAt);
  }

  get lastLogin(): string {
    return formatDate(this.user?.lastLoginAt);
  }

  get profileControls() {
    return this.profileForm.controls;
  }

  get passwordControls() {
    return this.passwordForm.controls;
  }

  get passwordMismatch(): boolean {
    return (
      this.passwordForm.hasError('passwordMismatch') &&
      this.passwordControls['confirmPassword'].touched
    );
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.auth.updateUser(user);
        this.profileForm.patchValue(
          {
            name: user.name,
            email: user.email,
            phone1: user.phone1 ?? '',
            phone2: user.phone2 ?? '',
            branchType: user.branchType ?? '',
            companySize: user.companySize ?? ''
          },
          { emitEvent: false }
        );
        this.profileForm.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastr.warning('Revise os campos destacados antes de salvar.', 'Formulário incompleto');
      return;
    }

    if (!this.profileForm.dirty) {
      this.toastr.info('Nenhuma alteração para salvar.', 'Tudo atualizado');
      return;
    }

    const raw = this.profileForm.getRawValue();
    const payload: UpdateProfilePayload = {
      name: String(raw.name).trim(),
      email: String(raw.email).trim().toLowerCase(),
      phone1: String(raw.phone1 ?? '').trim(),
      phone2: String(raw.phone2 ?? '').trim(),
      branchType: String(raw.branchType ?? '').trim(),
      companySize: String(raw.companySize ?? '').trim()
    };

    this.savingProfile = true;
    this.userService.updateProfile(payload).subscribe({
      next: (user) => {
        this.user = user;
        this.auth.updateUser(user);
        this.profileForm.markAsPristine();
        this.savingProfile = false;
        this.toastr.success('Dados atualizados com sucesso.', 'Perfil salvo');
      },
      error: (error: ApiError) => {
        this.savingProfile = false;
        this.applyServerErrors(error);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastr.warning('Revise os campos destacados antes de continuar.', 'Formulário incompleto');
      return;
    }

    this.savingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: (response) => {
        this.passwordForm.reset();
        this.passwordForm.markAsPristine();
        this.savingPassword = false;
        this.toastr.success(
          response.message || 'Sua senha foi atualizada com sucesso.',
          'Senha alterada'
        );
      },
      error: () => {
        this.savingPassword = false;
      }
    });
  }

  setTab(tab: 'profile' | 'security'): void {
    this.activeTab = tab;
  }

  private buildForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      phone1: ['', [Validators.maxLength(20)]],
      phone2: ['', [Validators.maxLength(20)]],
      branchType: ['', [Validators.maxLength(50)]],
      companySize: ['', [Validators.maxLength(50)]]
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(72),
            Validators.pattern(/[a-zA-Z]/),
            Validators.pattern(/\d/)
          ]
        ],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordsMatch }
    );
  }

  private applyServerErrors(error: ApiError): void {
    const details = error?.details ?? [];
    let matched = false;

    details.forEach((detail) => {
      const control = this.profileForm.get(detail.field);
      if (control) {
        control.setErrors({ server: detail.message });
        control.markAsTouched();
        matched = true;
      }
    });

    if (!matched) {
      this.toastr.error(error?.message || 'Não foi possível salvar os dados.', 'Erro ao salvar');
    }
  }
}
