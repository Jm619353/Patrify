import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { BackendService } from 'src/app/service/backend.service';
import { catchError, tap, throwError } from 'rxjs';
import { b64toBlob } from 'src/app/utils/utils';
import { NotifierService } from 'angular-notifier';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'filtro',
  templateUrl: './filtro.component.html',
  styleUrls: ['./filtro.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ])
  ]
})
export class FiltroComponent implements OnInit{
  mostrarAddPatrimonio: boolean = false;
  token: string | null = null;

  name: string = '';
  valor: number = 0;
  quantidade: number = 0;
  fornecedor: string = '';
  dt_compra: string = ''; 
  local: string = '';
  ativoInativo: string = '';
  descricao: string = '';
  depreciacao: number = 0;
  tipo: string = '';
  file: File | null = null;
  id: number = 0;
  patrimonios: any[] = []; 
  imageUrl: string | ArrayBuffer | null | undefined= null;

  errorMessage: string | null = null;
  searchText: string = '';

  constructor(private backendService: BackendService,private toastr: ToastrService) {  }

  selectedFilters: any = {};
  tipofilter: string = 'Todos'
  nameFilter: string = 'Recente';
  statusFilter: string = 'Todos' ;
  precoFilter: string = 'todos' ;
  dataFilter: string = 'qualquer data';
  conservacaoFilter: string = 'qualquer';
  
  nameFilterOptions: string[] = ['Recente', 'A-Z', 'Z-A','Mais antigo'];

  @Output() dataReady = new EventEmitter<any>();

  
  search(): void {
    // Emitir o evento com os dados do filtro e o texto de pesquisa
    this.dataReady.emit({ filters: this.selectedFilters, searchText: this.searchText.trim().toLowerCase() });
  }
  
  onFilterChange() {
    // Verifica se o filtro de nome é "Recente"
    const name = this.nameFilter === 'Recente' ? '' : this.nameFilter;
  
    // Verifica se o filtro de status é "Todos"
    const status = this.statusFilter === 'Todos' ? '' : this.statusFilter;
  
    // Verifica se o filtro de conservação é "qualquer"
    const conservacao = this.conservacaoFilter === 'qualquer' ? '' : this.conservacaoFilter;

    const preco = this.precoFilter === 'todos' ? '' : this.precoFilter;
    
    const data = this.dataFilter === 'qualquer data' ? '' : this.dataFilter;
  
    // Atualiza os filtros selecionados com os valores adequados
    this.selectedFilters = {
      tipo: this.tipofilter,
      name: name,
      status: status,
      preco: preco,
      data_aquisicao: data,
      condicao: conservacao
    };
  
    console.log(this.selectedFilters);
    this.dataReady.emit({ filters: this.selectedFilters, searchText: this.searchText.trim().toLowerCase() });
    
  }
  
  ngOnInit(): void {
    this.onFilterChange()
      }


  alternarAddPatrimonio() {
    this.mostrarAddPatrimonio = !this.mostrarAddPatrimonio;
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.file = inputElement.files[0];
      this.errorMessage = null; // Reset error message

      // Verifica a extensão do arquivo
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const fileExtension = this.file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        this.errorMessage = 'Apenas arquivos JPG, JPEG e PNG são permitidos.';
        this.toastr.warning( 'Apenas arquivos JPG, JPEG e PNG são permitidos.', 'Aviso');
        
        this.file = null;
        this.imageUrl = null;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = e.target?.result;
      };
      reader.readAsDataURL(this.file);
    }
  }



  registerPatr() {
    // Retrieve token from localStorage
    this.token = localStorage.getItem('token');
    // console.log('Token recuperado do localStorage:', this.token);
  
    const requiresFile = true; // Flag indicating if file is mandatory
  
    // Validate token presence and file selection (if mandatory)
    if (this.token && (this.file || !requiresFile)) {
      const patrimonioData = this.preparePatrimonioData();
  
      // console.log(patrimonioData);
  
      // Create a FormData object for file upload
      const formData = new FormData();
  
      // Append the file to FormData (replace 'file' with actual backend key)
      if (this.file && requiresFile) {
        formData.append('file', this.file);
        // console.log('Image appended to FormData:', this.file);
      }
      
      console.log(patrimonioData);
      
      // Send POST request using HttpClient with FormData
      this.backendService.cadastrarPatrimonio(patrimonioData, this.token)
        .pipe(
          tap((response) => {
            
            // Send image upload request only if successful
            if (response && response.newPatrimonyId) {
              this.backendService.patrimage(this.file , response.newPatrimonyId, this.token || '').pipe(
                tap((response) => {
                  // console.log('Imagem enviada com sucesso:', response);
                  
                    this.toastr.success( 'Patrimonio Cadastrado', 'Sucesso',);
                  
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                  
                }),
                catchError(error => {
                  console.error('Erro ao enviar imagem:', error);
                  
                  this.toastr.error( 'Erro no cadastro do patrimônio', 'Erro');
                  // Handle image upload errors (e.g., display error message)
                  return throwError(error);
                })
              )
              .subscribe();
            }
          }),
          catchError(error => {
            console.error('Erro ao cadastrar patrimônio:', error);
            
            this.toastr.error('Erro', 'Erro no cadastro do projeto');
            // Handle general errors (e.g., display error message)
            return throwError(error);
          })
        )
        .subscribe();
    } else {
      if (!this.token) {
        console.error('Token não encontrado no localStorage.');
      } else if (requiresFile) {
        console.error('Selecione uma imagem para enviar.');
      }
    }
  }
  
  
  
  // Helper function to prepare patrimonioData (optional):
  preparePatrimonioData() {
    const data = {
      name: this.name,
      valor: this.valor,
      dt_compra: this.dt_compra,
      local: this.local,
      ativoinativo: this.ativoInativo,
      depreciacao: this.depreciacao,
      tipo: this.tipo
    };
  
   
  
    return data;
  }
  
  // Error handling function (optional, customize based on your needs):
  handleError(error: any) {
    console.error('Erro ao cadastrar patrimônio:', error);
    // Handle specific errors (e.g., display user-friendly messages)
    // ...
  }
  
}
