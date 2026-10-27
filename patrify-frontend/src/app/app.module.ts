import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { SenhaComponent } from './pages/login/esquecerSenha/senha.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { SidebarComponent } from './pages/global/sidebar/sidebar.component';
import { HeaderComponent } from './pages/global/header/header.component';
import { FiltroComponent } from './pages/inventario/filtro/filtro.component';
import { UserpageComponent } from './pages/userpage/userpage.component';
import { HomeComponent } from './pages/home/home.component';
import { CommonModule } from '@angular/common';
import { ConfigComponent } from './pages/config/config.component';
import { RouterModule } from '@angular/router';
import { LandingpageComponent } from './pages/landingpage/landingpage.component';
import { HeaderlandingComponent } from './pages/landingpage/headerlanding/headerlanding.component';
import { DescarteComponent } from './pages/descarte/descarte.component';
import { NotifierModule } from 'angular-notifier';
import { ToastrModule } from 'ngx-toastr';
import { RecsenhaComponent } from './recsenha/recsenha.component';
import { ChartComponent } from './pages/home/chart/chart.component';
import { CurrencyMaskModule } from "ng2-currency-mask";
// import { AuthGuard } from './service/authguard.service';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SenhaComponent,
    InventarioComponent,
    SidebarComponent,
    HeaderComponent,
    FiltroComponent,
    UserpageComponent,
    HomeComponent,
    ConfigComponent,
    LandingpageComponent,
    HeaderlandingComponent,
    DescarteComponent,
    RecsenhaComponent,
    ChartComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    CurrencyMaskModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot([]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
