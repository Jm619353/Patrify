import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { LoginComponent } from './pages/login/login.component';
import { SenhaComponent } from './pages/login/esquecerSenha/senha.component';
import { UserpageComponent } from './pages/userpage/userpage.component';
import { HomeComponent } from './pages/home/home.component';
import { ConfigComponent } from './pages/config/config.component';
import { LandingpageComponent } from './pages/landingpage/landingpage.component';
import { DescarteComponent } from './pages/descarte/descarte.component';
import { AuthguardService } from '../app/service/authguard.service';
import { RecsenhaComponent } from './recsenha/recsenha.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent,  }, // Rota para login page
  { path: 'inventario', component: InventarioComponent, canActivate: [AuthguardService] }, // Rota para inventory page
  {path: 'senha', component: SenhaComponent,  }, // Rota para esqueci a senha page
  {path: 'recsenha', component: RecsenhaComponent},
  {path: 'usuario', component: UserpageComponent, canActivate: [AuthguardService] }, // Rota para pagina do usuário
  {path: 'home', component: HomeComponent, canActivate: [AuthguardService] }, // Rota para pagina de inicio
  {path: 'configs', component: ConfigComponent, canActivate: [AuthguardService] },
  {path: 'descarte', component: DescarteComponent, canActivate: [AuthguardService] },
  {path: 'patrify', component: LandingpageComponent},
  { path: '', redirectTo: 'patrify', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { 

}
