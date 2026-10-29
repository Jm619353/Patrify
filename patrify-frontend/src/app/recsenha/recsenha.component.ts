import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../core/services/auth.service';

const strongPasswordValidator = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return null;

  const errors: ValidationErrors = {};
  if (value.length < 8) errors['minLength'] = true;
  if (value.length > 72) errors['maxLength'] = true;
  if (!/[a-zA-Z]/.test(value)) errors['letter'] = true;
  if (!/\d/.test(value)) errors['digit'] = true;

  return Object.keys(errors).length > 0 ? errors : null;
};

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  if (!password || !confirmation) return null;
  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-recsenha',
  templateUrl: './recsenha.component.html',
  styleUrls: ['./recsenha.component.css']
})
export class RecsenhaComponent implements OnInit, OnDestroy {
  form: FormGroup;
  token = '';
  tokenMissing = false;
  submitting = false;
  success = false;

  showPassword = false;
  showConfirmPassword = false;

  private redirectTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, strongPasswordValidator]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordsMatch }
    );
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenMissing = true;
      return;
    }
    this.token = token;
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }

  get controls() {
    return this.form.controls;
  }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.controls['confirmPassword'].touched;
  }

  get passwordStrength(): number {
    const value = String(this.controls['password'].value ?? '');
    if (!value) return 0;

    let score = 0;
    if (value.length >= 8) score += 25;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 25;
    if (/\d/.test(value)) score += 25;
    if (/[^A-Za-z0-9]/.test(value)) score += 25;
    return score;
  }

  get passwordStrengthLabel(): string {
    if (!this.controls['password'].value) return 'Mínimo de 8 caracteres, letras e números';
    if (this.passwordStrength < 50) return 'Senha fraca';
    if (this.passwordStrength < 100) return 'Senha razoável';
    return 'Senha forte';
  }

  get passwordStrengthClass(): string {
    if (this.passwordStrength < 50) return 'bg-rose-500';
    if (this.passwordStrength < 100) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  submit(): void {
    if (this.tokenMissing || !this.token) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { password } = this.form.getRawValue();

    this.auth.resetPassword({ token: this.token, password }).subscribe({
      next: (response) => {
        this.submitting = false;
        this.success = true;
        this.toastr.success(
          response.message || 'Sua senha foi redefinida com sucesso.',
          'Senha atualizada'
        );
        this.redirectTimer = setTimeout(() => this.router.navigate(['/login']), 5000);
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  requestNewLink(): void {
    this.router.navigate(['/senha']);
  }
}
