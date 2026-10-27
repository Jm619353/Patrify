import { Component, HostListener, ElementRef, Directive, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss']
})


export class LandingpageComponent implements AfterViewInit {

  
  
  constructor(private router: Router) { }

  login () {
    this.router.navigate (['login']);
  }

  ngAfterViewInit() {

    const ASCItext = 
`                                                                        
                                                                        
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@            
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          
     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       
       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@      
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     
              @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   
                                                    @@@@@@@@@@@@@@@@@   
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@@@@@@@@@  
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    @@@@@@@@@@@@@@@@   
  @@@@@@@@@@@@@@                                 @@@@@@@@@@@@@@@@@@@@   
  @@@@@@@@@@@@@@  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    
  @@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     
  @@@@@@@@@@@@@    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       
  @@@@@@@@@@@@@     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@         
  @@@@@@@@@@@         @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@            
  @@@@@@@@@@            @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
  @@@@@@@                    @@@@@@@@@@@@@@@@@@@@                       
  @@@@                                                                  
                                                                        
                                                                           `;

console.log(ASCItext);
    

    const toTop = document.getElementById('btnToTop') as HTMLButtonElement;

  toTop.addEventListener('click', () => {
    // Scroll suave até o topo da página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

    window.addEventListener('scroll', () => {
      if(window.pageYOffset > 200) {
        toTop?.classList.add("active");
      } else {
        toTop?.classList.remove("active");
      }
    })
    

    gsap.registerPlugin(ScrollTrigger);

    gsap.from("#contentOne-title", {
      y: -100,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.contentOne',
        start: "top 60%",
        end: "bottom bottom",
      }
    })

    gsap.from("#contentOne-subtitle", {
      x: 100,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.contentOne',
        start: "top 60%",
        end: "bottom bottom",
      }
    })

    gsap.from('.patternDot', {
      scale: 0,
      duration: 2,
      ease: "elastic.out",
      scrollTrigger: {
        trigger: ".contentOne",
        start: "Bottom 25%",
        end: "Bottom Bottom",
      }
    })

    gsap.from('.patternLine', {
      clipPath: "inset(0 0 0 100%)",
      duration: 1,
      ease: 'Power3.out',
      scrollTrigger: {
        trigger: ".contentOne",
        start: "10% 25%",
        end: "bottom bottom",
      }
    })

    gsap.from('.patternLine2', {
      clipPath: "inset(0 0 0 100%)",
      duration: 1,
      delay: 0.5,
      ease: 'Power3.out',
      scrollTrigger: {
        trigger: ".contentOne",
        start: "10% 25%",
        end: "bottom bottom",
      }
    })

    gsap.from("#outtext", {
      y: 100,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.contentTwo',
        start: "top 60%",
        end: "bottom bottom",
      }
    })


    gsap.from('#card1', {
      y: -100,
      duration: 2,
      opacity: 0,
      ease: "Power3.out",
      scrollTrigger: {
        trigger: ".contentTwo",
        start: "25% 60%",
        end: "bottom 75%",
        
      }
    })
    gsap.from('#card2', {
      y: -100,
      duration: 2,
      opacity: 0,
      delay: 0.2,
      ease: "Power3.out",
      scrollTrigger: {
        trigger: ".contentTwo",
        start: "25% 60%",
        end: "bottom 75%",
        
      }
    })
    gsap.from('#card3', {
      y: -100,
      duration: 2,
      opacity: 0,
      delay: 0.4,
      ease: "Power3.out",
      scrollTrigger: {
        trigger: ".contentTwo",
        start: "25% 60%",
        end: "bottom 75%",
      }
    })
    gsap.from('#card4', {
      y: -100,
      duration: 2,
      opacity: 0,
      delay: 0.6,
      ease: "Power3.out",
      scrollTrigger: {
        trigger: ".contentTwo",
        start: "25% 60%",
        end: "bottom 75%",
        
      }
    })

    gsap.from('#contentThree-title', {
      x: -100,
      duration: 0.5,
      opacity: 0,
      ease: "Power3.out",
      scrollTrigger: {
        trigger: ".contentThree ",
        start: "25% 60%",
        end: "bottom 75%",
      }
    })

    gsap.from('.titleLine', {
      duration: 1,
      clipPath: "inset(0 50% 0 50%)",
      ease: "Power3.out",
      delay: 0.5,
      scrollTrigger: {
        trigger: ".contentThree ",
        start: "25% 60%",
        end: "bottom 75%",
      }
    })

    gsap.from('.main', {
      duration: 1,
      clipPath: "inset(0 50% 0 50%)",
      ease: "Power3.out",
      delay: 1,
      scrollTrigger: {
        trigger: ".contentThree-title",
        start: "25% 60%",
        end: "bottom 75%",
      }
    })

    const columns = document.querySelectorAll('.column');
    const innerElements = document.querySelectorAll('.inner-element');

    columns.forEach(click => {
        click.addEventListener('click', event => {
            // Iterate over all columns
            columns.forEach(column => {
                if (column === click) {
                    // Set the clicked column width to 100%
                    column.classList.add('expanded');
                } else {
                    // Shrink the width of other columns
                    column.classList.remove('expanded');
                }
            });

            // Iterate over all inner elements
            innerElements.forEach(innerElement => {
                // Add the active class to the inner element of the clicked column
                if (innerElement.parentElement === click) {
                    innerElement.classList.add('active');
                } else {
                    innerElement.classList.remove('active');
                }
            });
        });
    });
  }
  }
