import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  logout(){
    localStorage.removeItem('token');
  }

  sidebarFixed = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.sidebarFixed = scrollOffset > 0; // Defina a altura na qual a barra lateral deve ficar fixa
  }
}
