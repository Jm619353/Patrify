import { Component, OnInit } from '@angular/core';
import { BackendService } from 'src/app/service/backend.service';

@Component({
  selector: 'app-descarte',
  templateUrl: './descarte.component.html',
  styleUrls: ['./descarte.component.css']
})
export class DescarteComponent implements OnInit {
  tipoPatrimonio: string = '';
  localizacao: string = '';
  localizacoes: any = [];
  errorMessage: string | undefined;
  locallatlong: string= '';
  local: string | null = null;
  searchQuery = '';
  tipo!: string;

  constructor(private backendService: BackendService) {}

  ngOnInit(): void {
    this.obterLocalizacao()
  }


  obterLocalizacao() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.mostrarPosicao, this.erroPosicao);

      
    } else {
      console.log("Geolocalização não é suportada neste navegador.");
    }
  }

  mostrarPosicao(posicao: any) {
    const latitude = posicao.coords.latitude;
    const longitude = posicao.coords.longitude;
    const locallatlong = (latitude +', ' + longitude)
    
    localStorage.setItem('localizacao', locallatlong);
  }

  erroPosicao(erro: { message: string; }) {
    console.log("Erro ao obter a localização: " + erro.message);
  }

  buscarLocais(tipo: string) {
    this.local = localStorage.getItem('localizacao');
    
    const requestBody = {
      tipoPatrimonio: tipo,
      localizacao: this.local
    };
    
    this.backendService.localDescarte(requestBody)
.subscribe((response: any)=> {
  this.localizacoes = response.localizacoes.map((localizacao: any) => {
    const nomeReduzido = localizacao.name.substring(0, 50);
    return {
      nome: nomeReduzido, 
      localizacao: localizacao.vicinity,
      contato: localizacao.phone,
      website: localizacao.website,
      url: localizacao.url,
    };
  });
  
}, error => {
  console.error('Error fetching recycling centers:', error);
  this.errorMessage = 'An error occurred while searching for locations.'; // Informative error message
});

  
  

  }
}
