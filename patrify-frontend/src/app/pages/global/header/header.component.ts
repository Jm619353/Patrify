import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'header-global',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentRoute: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url.substring(1).toUpperCase();
    
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url.substring(1).toUpperCase();
        console.log(this.currentRoute);
      }
    });
  }
}
