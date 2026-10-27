import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { BackendService } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class AuthguardService implements CanActivate {

    constructor(private router: Router, private backendService: BackendService) { }
  
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
      const token = localStorage.getItem('token'); // Get token from local storage
      if (!token) { // Check if token exists
        this.router.navigate(['/login']); // Redirect to login if not found
        return false;
      }
      // Verificar se o usuário está autenticado usando o token
    else if (token) {

      this.backendService.SignedUser(token)
        .subscribe(
          response => {
            // Manipular a resposta bem-sucedida aqui (por exemplo, exibir mensagem de sucesso)
            
          },
          error => {
            this.router.navigate(['/login']);
            // Manipular erros de autenticação aqui (por exemplo, exibir mensagem de erro)
            // console.error('Erro ao verificar autenticação do usuário:', error);
          }
        );
    } else {
      console.error('Token não encontrado no localStorage.');
    }
  
      // If you have token validation logic, add it here
      // e.g., check token expiration, validity, etc.
  
      return true; // Allow navigation if token is valid
    }
  }