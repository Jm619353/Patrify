import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BackendService } from 'src/app/service/backend.service';

@Component({
  selector: 'senha',
  templateUrl: './senha.component.html',
  styleUrls: ['./senha.component.scss']
})
export class SenhaComponent {

  cnpj: string = '';
  email:string   = '';


   
  constructor(private backendService: BackendService, private toastr: ToastrService) {}
  

  recpassword(){
      const userData = this.prepareuserdata()

      this.backendService.updatePassword(userData) 
      .subscribe(
        response => {
          this.toastr.success( 'Email de recuperação enviado com Sucesso', 'Sucesso');
        },
        error => {
          // Manipular erros de registro aqui (por exemplo, exibir mensagem de erro)
          this.toastr.error( 'Algo deu errado no envio do email de recuperação, verifique se o CNPJ e email estão corretos', 'Erro');
          console.error('Erro ao logar usuário:', error);
        }
      );
  }

  prepareuserdata() {
    const data = {
      email: this.email,
      cnpj: this.cnpj,
    };
  
    return data;
  }

}
