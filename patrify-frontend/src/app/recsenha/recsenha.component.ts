import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../service/backend.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-recsenha',
  templateUrl: './recsenha.component.html',
  styleUrls: ['./recsenha.component.css']
})
export class RecsenhaComponent implements OnInit {

  private _token: string = ''; 
  newpass: string = '';

  constructor(private activatedRoute: ActivatedRoute, private backendService: BackendService, private toastr: ToastrService, private router: Router) {
   
  }


  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const token = params['token']; // Acessar o parâmetro 'token'
      if (token) { // Verificar se o token está definido
        // Faça algo com o token
        this._token = token
        console.log('Token:', token);
      } else {
        console.error('Query parameter "token" not found');
      }
    });
  }



  recpassword(){
    const data = this.prepareuserdata();

    
    this.backendService.ChangePassword(data) 
    .subscribe(
      response => {
        this.toastr.success( 'Senha alterad com sucesso, você sera redirecionado para a tela de login em 3 segundos', 'Sucesso');
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error => {
        // Manipular erros de registro aqui (por exemplo, exibir mensagem de erro)
        this.toastr.error( 'Token inválido ou já utilizado', 'Erro');
        console.error('Erro:', error);
      }
    );
  }

  
  prepareuserdata() {
    const data = {
      token: this._token,
      newPassword: this.newpass,
    };
  
    return data;
  }
}
