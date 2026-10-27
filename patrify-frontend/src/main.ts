import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

  gsap.registerPlugin(ScrollTrigger);
  
  window.addEventListener('load', () => {
    const loader: HTMLElement | null = document.querySelector(".loading");
    if (loader) {
      loader.classList.add("loader-hidden");
      loader.addEventListener('transitionend', () => {
        if (document.body && loader.parentNode) {
          document.body.removeChild(loader);
        }
      });
    }
  });
