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
import { AuthService } from '../../core/services/auth.service';
import { isValidCnpj, normalizeCnpj } from '../../shared/utils/cnpj';

const cnpjValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  return isValidCnpj(control.value) ? null : { cnpj: true };
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  submitting = false;

  loginForm: FormGroup;
  showLoginPassword = false;

  readonly currentYear = new Date().getFullYear();
  readonly typingWords = ['Gerencie', 'Aprimore', 'Proteja'];
  typingText = '';

  private wordIndex = 0;
  private charIndex = 0;
  private deleting = false;
  private typingTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      cnpj: ['', [Validators.required, cnpjValidator]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.auth.hasValidToken()) {
      this.router.navigate(['/home']);
      return;
    }

    this.scheduleTyping(350);
  }

  ngOnDestroy(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  get loginControls() {
    return this.loginForm.controls;
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { cnpj, password } = this.loginForm.getRawValue();
    this.submitting = true;

    this.auth.login({ cnpj: normalizeCnpj(cnpj), password }).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success('Bem-vindo de volta ao Patrify.', 'Login realizado');
        this.navigateAfterAuth();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/home';
    this.router.navigateByUrl(target);
  }

  private scheduleTyping(delay: number): void {
    this.typingTimer = setTimeout(() => this.animateTyping(), delay);
  }

  private animateTyping(): void {
    const word = this.typingWords[this.wordIndex];
    let delay = 110;

    if (!this.deleting) {
      this.charIndex += 1;
      this.typingText = word.slice(0, this.charIndex);

      if (this.charIndex >= word.length) {
        this.deleting = true;
        delay = 1600;
      }
    } else {
      this.charIndex -= 1;
      this.typingText = word.slice(0, this.charIndex);
      delay = 55;

      if (this.charIndex <= 0) {
        this.deleting = false;
        this.wordIndex = (this.wordIndex + 1) % this.typingWords.length;
        delay = 400;
      }
    }

    this.scheduleTyping(delay);
  }
}
