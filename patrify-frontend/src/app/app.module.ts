import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { PageTitleStrategy } from './core/page-title.strategy';
import { AppLayoutComponent } from './shared/layout/app-layout.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { CnpjMaskDirective } from './shared/directives/cnpj-mask.directive';

import { LoginComponent } from './pages/login/login.component';
import { SenhaComponent } from './pages/login/esquecerSenha/senha.component';
import { RecsenhaComponent } from './recsenha/recsenha.component';
import { HomeComponent } from './pages/home/home.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { DescarteComponent } from './pages/descarte/descarte.component';
import { UserpageComponent } from './pages/userpage/userpage.component';
import { ConfigComponent } from './pages/config/config.component';
import { LandingpageComponent } from './pages/landingpage/landingpage.component';
import { VerificarComponent } from './pages/verificar/verificar.component';
import { ManutencoesComponent } from './pages/manutencoes/manutencoes.component';
import { AuditoriaComponent } from './pages/auditoria/auditoria.component';
import { EmprestimosComponent } from './pages/emprestimos/emprestimos.component';
import { SegurosComponent } from './pages/seguros/seguros.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SidebarComponent } from './pages/global/sidebar/sidebar.component';
import { HeaderComponent } from './pages/global/header/header.component';

import { ToastrModule } from 'ngx-toastr';

registerLocaleData(localePt, 'pt-BR');

@NgModule({
  declarations: [
    AppComponent,
    AppLayoutComponent,
    ConfirmDialogComponent,
    CnpjMaskDirective,
    SidebarComponent,
    HeaderComponent,
    LoginComponent,
    SenhaComponent,
    RecsenhaComponent,
    HomeComponent,
    InventarioComponent,
    DescarteComponent,
    UserpageComponent,
    ConfigComponent,
    LandingpageComponent,
    VerificarComponent,
    ManutencoesComponent,
    AuditoriaComponent,
    EmprestimosComponent,
    SegurosComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      timeOut: 4500,
      progressBar: true,
      closeButton: true,
      preventDuplicates: true,
      newestOnTop: true
    })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
