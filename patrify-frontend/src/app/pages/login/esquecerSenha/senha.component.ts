import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { isValidCnpj, normalizeCnpj } from '../../../shared/utils/cnpj';

const cnpjValidator = (control: AbstractControl) => {
  if (!control.value) return null;
  return isValidCnpj(control.value) ? null : { cnpj: true };
};

@Component({
  selector: 'senha',
  templateUrl: './senha.component.html',
  styleUrls: ['./senha.component.scss']
})
export class SenhaComponent {
  form: FormGroup;
  submitting = false;
  sent = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      cnpj: ['', [Validators.required, cnpjValidator]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]]
    });
  }

  get controls() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { cnpj, email } = this.form.getRawValue();
    this.submitting = true;

    this.auth
      .forgotPassword({
        cnpj: normalizeCnpj(cnpj),
        email: String(email).trim().toLowerCase()
      })
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.sent = true;
          this.toastr.success(
            response.message || 'Se os dados conferirem, enviaremos as instruções por e-mail.',
            'Solicitação registrada'
          );
        },
        error: () => {
          this.submitting = false;
        }
      });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  retry(): void {
    this.sent = false;
    this.form.markAsPristine();
  }
}
