import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { PlanGuard } from './core/guards/plan.guard';
import { AppLayoutComponent } from './shared/layout/app-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { SenhaComponent } from './pages/login/esquecerSenha/senha.component';
import { RecsenhaComponent } from './recsenha/recsenha.component';
import { LandingpageComponent } from './pages/landingpage/landingpage.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { DescarteComponent } from './pages/descarte/descarte.component';
import { UserpageComponent } from './pages/userpage/userpage.component';
import { ConfigComponent } from './pages/config/config.component';
import { VerificarComponent } from './pages/verificar/verificar.component';
import { ManutencoesComponent } from './pages/manutencoes/manutencoes.component';
import { AuditoriaComponent } from './pages/auditoria/auditoria.component';
import { EmprestimosComponent } from './pages/emprestimos/emprestimos.component';
import { SegurosComponent } from './pages/seguros/seguros.component';
import { AdminComponent } from './pages/admin/admin.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Entrar' },
  { path: 'senha', component: SenhaComponent, title: 'Recuperar senha' },
  { path: 'recsenha', component: RecsenhaComponent, title: 'Redefinir senha' },
  { path: 'patrify', component: LandingpageComponent, title: 'Gestão patrimonial' },
  { path: 'verificar', component: VerificarComponent, title: 'Verificação de patrimônio' },
  { path: 'verificar/:serial', component: VerificarComponent, title: 'Ficha do patrimônio' },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
        title: 'Dashboard',
        data: { title: 'Dashboard', subtitle: 'Visão geral do seu patrimônio' }
      },
      {
        path: 'admin',
        component: AdminComponent,
        title: 'Administração do Sistema',
        data: {
          title: 'Administração do Sistema',
          subtitle: 'Controle global de empresas, usuários e todos os patrimônios da plataforma'
        }
      },
      {
        path: 'inventario',
        component: InventarioComponent,
        title: 'Inventário',
        data: { title: 'Inventário', subtitle: 'Cadastre, edite e acompanhe todos os seus bens' }
      },
      {
        path: 'emprestimos',
        component: EmprestimosComponent,
        canActivate: [PlanGuard],
        title: 'Empréstimos e Cautelas',
        data: {
          title: 'Empréstimos e Cautelas',
          subtitle: 'Check-out, devoluções (check-in) e controle de prazos',
          minPlan: 'pro'
        }
      },
      {
        path: 'manutencoes',
        component: ManutencoesComponent,
        canActivate: [PlanGuard],
        title: 'Manutenções e OS',
        data: {
          title: 'Manutenções e OS',
          subtitle: 'Controle preventivo, corretivo e custos operacionais',
          minPlan: 'pro'
        }
      },
      {
        path: 'seguros',
        component: SegurosComponent,
        canActivate: [PlanGuard],
        title: 'Seguros e Garantias',
        data: {
          title: 'Seguros e Garantias',
          subtitle: 'Apólices, cobertura patrimonial, renovações e sinistros',
          minPlan: 'enterprise'
        }
      },
      {
        path: 'auditoria',
        component: AuditoriaComponent,
        canActivate: [PlanGuard],
        title: 'Auditoria e Termos',
        data: {
          title: 'Auditoria e Termos',
          subtitle: 'Conferência física, cautelas CLT e balanço contábil',
          minPlan: 'enterprise'
        }
      },
      {
        path: 'descarte',
        component: DescarteComponent,
        title: 'Descarte inteligente',
        data: { title: 'Descarte inteligente', subtitle: 'Encontre pontos de descarte próximos a você' }
      },
      {
        path: 'usuario',
        component: UserpageComponent,
        title: 'Meu perfil',
        data: { title: 'Meu perfil', subtitle: 'Dados da empresa e segurança da conta' }
      },
      {
        path: 'configs',
        component: ConfigComponent,
        title: 'Configurações',
        data: { title: 'Configurações', subtitle: 'Preferências e informações da sessão' }
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'patrify' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
