import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})



export class AppComponent implements OnInit {
  
  loading: boolean = false;

  constructor(private router: Router) { }

  
  ngOnInit() {
    
    (window as any).gsap = gsap;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // console.log('Navigation started');
        this.loading = true;
  
      } else if (event instanceof NavigationEnd) {
        // console.log('Navigation ended');
       setTimeout(() => {
        if (this.loading) { // Check if navigation is still ongoing
          // console.log('Navigation took too long, resetting loading state');
          this.loading = false;
        }
      }, 800); // Adjust the timeout duration as needed
      }
    });
  }
}
