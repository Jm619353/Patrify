import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionPlan } from '../models/user.model';
import { AuthService } from '../services/auth.service';

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  basic: 'Plano Básico',
  pro: 'Plano Profissional',
  enterprise: 'Plano Enterprise'
};

@Injectable({ providedIn: 'root' })
export class PlanGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const minPlan = route.data['minPlan'] as SubscriptionPlan | undefined;
    if (!minPlan) return true;

    if (this.auth.hasPlanAccess(minPlan)) {
      return true;
    }

    const planName = PLAN_NAMES[minPlan] || minPlan;
    this.toastr.warning(
      `Esta função faz parte do ${planName}. Solicite a evolução do seu plano ao Administrador do Sistema.`,
      'Recurso bloqueado no seu plano'
    );
    return this.router.createUrlTree(['/home']);
  }
}
