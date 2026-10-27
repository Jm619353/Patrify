
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { BackendService } from 'src/app/service/backend.service';
import { b64toBlob } from 'src/app/utils/utils';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { catchError, tap, throwError } from 'rxjs';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  filtros: any = [];
  patrimonios: any = []; // Array to store all patrimonios
  token: string | null = null;
  @Input() data: any;

  constructor(private http: HttpClient, private backendService: BackendService, private toastr: ToastrService) { }

 
  // Método para lidar com os dados filtrados e o texto de pesquisa
  onDataReady(filters: any, searchText: string) {
  

    
    // Verifica se há texto de pesquisa
    if (searchText == '') {
      this.filtros = filters;
      this.token = localStorage.getItem('token');
      console.log(filters)
      if (this.token) {
        this.backendService.Filter(this.filtros, this.token).subscribe(
          response => {
            this.patrimonios = response.patrimonios.map((patrimonio: any) => {
              const dateString = patrimonio.patr_dt_compr;
              const dateParts = dateString.split('-');
              const year = parseInt(dateParts[0], 10);
              const month = parseInt(dateParts[1], 10) - 1;
              const day = parseInt(dateParts[2], 10);

              const dateObject = new Date(year, month, day);
              const formattedDateISO = dateObject.toISOString().substring(0, 10); // Formato ISO para input date

              const imagem = patrimonio.imagem;

              return {
                ...patrimonio,
                date: formattedDateISO,
                imageSrc: imagem
              };
            });
          },
          error => {
            console.error('Erro ao verificar autenticação do usuário:', error);
          }
        );
      }
      console.log(this.patrimonios )
    } else {
      
     
     this.patrimonios = this.patrimonios.filter((patrimonio: any) =>
     patrimonio.patr_name.toLowerCase().includes(searchText) ||
     patrimonio.patr_codigoserie.toLowerCase().includes(searchText)
     );
    }
  }
  
  ngOnInit(): void {

    const btnAction = document.getElementById('btnActions');
  }

  // GUI EDIT

  editMode: boolean = false;

  toggleEditMode(patrimonio: any): void {
    patrimonio.editMode = !patrimonio.editMode;
  }

  saveChanges(patrimonio: any): void {
    const token = localStorage.getItem('token');
    const patrimonioID = patrimonio.patr_id;

    const dadosPatrimonios = {
      ativoinativo: patrimonio.patr_ativoinativo,
      depreciacao: patrimonio.patr_depreciacao,
      dt_compr: patrimonio.date,
      id: patrimonio.patr_id,
      local: patrimonio.patr_local,
      name: patrimonio.patr_name,
      quantidade: patrimonio.patr_quantidade,
      tipo: patrimonio.patr_tipo,
      valor: patrimonio.patr_valor
    };

    if (token) {
      if (patrimonioID) { 
        this.backendService.salvarEdicaoDoPatrimonio(dadosPatrimonios, patrimonioID, token)
          .pipe(
            tap((response) => {
              // console.log('Imagem enviada com sucesso:', response);
                patrimonio.editMode = false;
                this.toastr.success( 'Patrimonio editado com sucesso', 'Sucesso',);
              
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              
            }),
            catchError(error => {
              console.error('Erro ao atualizar o patrimônio:', error);
              return throwError(error);
            })
          )
          .subscribe();
      } else {
        console.error('ID do patrimônio não encontrado!');
      }
    } else {
      console.error('Token não encontrado!');
    }
  }



  deletarPatrimonio(patrimonio: any): void {
    const token = localStorage.getItem('token');
    const patrimonioID = patrimonio.patr_id;
  
    if (token && patrimonioID) {
      this.backendService.deletarPatrimonio(patrimonioID, token)
      .pipe(
        tap((response) => {
          window.location.reload();
        }),
        catchError(error => {
          console.error('Erro ao deletar o patrimônio:', error);
          return throwError(error);
        })
      )
      .subscribe();
  } else {
    console.error('ID do patrimônio não encontrado!');
  }
}

}
