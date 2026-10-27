import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from "node_modules/chart.js";
import { BackendService } from 'src/app/service/backend.service';
Chart.register(...registerables)

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit{
  patrimonios: any[] = [];
  // filtros: any[] = []; 
  token: string | null = '';
  tipospatr: any = [];
  lastValue: any;
  filtros = {
    tipo: 'Todos',
    name: 'Mais antigo',
    status: '',
    preco: '',
    data_aquisicao: '',
    condicao: ''
  }
  patrimoniostotal: any;
  patrimoniosativos: any;
  patrimoniosnaoativos: any;
  lastvaluenotactive: any;
  total:number = 0;
  totalreais: string = '';
  totallostreais: string = '';

  constructor(private backendService: BackendService) {}

  ngOnInit(): void {
    this.filterfunction().then((tiposPatrimonios: any) => {
      this.tipospatr = tiposPatrimonios;
      this.renderChart(this.tipospatr);
    }).catch(error => {
      console.error(error);
    });
  }
  


  filterfunction() {
    return new Promise((resolve, reject) => {
      this.token = localStorage.getItem('token');
      if (this.token) {
        this.backendService.Filter(this.filtros, this.token).subscribe(
          response => {
            if (response.patrimonios) {
              this.patrimonios = response.patrimonios.map((patrimonio: any) => {
                return {
                  ...patrimonio,
                };
              });
  


              const contagemTipo: { contagem: number; tipo: any; }[] = []; // Array para contagem e tipo
              const ativoInativoContagemAtivo: { ativoinativo: any; contagemativ: number }[] = [];
              const dtcomprvalueativ: { comprativ: any; valueativ: number }[] = [];
              const dtcomprvaluenotativ:  { comprnotativ: any; valuenot: number }[] = [];
             

              let valorAcumulado = 0;
              let naoativoacumulado= 0;
              
              const resultadoFinal = [];

              this.patrimonios.forEach(patrimonio => {
                const tipo = patrimonio.patr_tipo;
                const ativoInativo = patrimonio.patr_ativoinativo;
                const compra = patrimonio.patr_dt_compr; 
                const valorRaw = patrimonio.patr_valor;
                const quantity = patrimonio.patr_quantidade;
                let contagemAtivo = 0;
                let valor: number = 0;

                const depreciacao = patrimonio.patr_depreciacao
                
              
                try {
                  valor = parseFloat(valorRaw);
                  if (isNaN(valor)) {
                    throw new Error('Valor inválido');
                  }
                } catch (e) {
                  console.warn(`Valor inválido: ${valorRaw}`);
                }

                const dateString = patrimonio.patr_dt_compr;

                const dateParts = dateString.split('-');
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1;
                const day = parseInt(dateParts[2], 10);

                const dateObject = new Date(year, month, day);

                const formattedDate = dateObject.toLocaleDateString('pt-BR');




                // Verifica se o tipo já existe no array de contagem/tipo
                const tipoExistenteContagem = contagemTipo.find(tipoContagem => tipoContagem.tipo === tipo);
                // Cria um novo objeto contagem/tipo se o tipo não existir
                if (!tipoExistenteContagem) {
                  contagemTipo.push({
                    contagem: 0,
                    tipo: tipo
                  });
                }
                
                // Atualiza as contagens do tipo encontrado (novo ou existente) no array contagem/tipo
                contagemTipo.forEach(tipoContagem => {
                  if (tipoContagem.tipo === tipo) {
                    tipoContagem.contagem++;
                  }
                });
              
                // Verifica se o tipo e ativo/inativo já existem no array ativo/inativo/contagemativ
                const ativoInativoExistente = ativoInativoContagemAtivo.find(
                  ativoInativoContagemAtivoItem =>
                    ativoInativoContagemAtivoItem.ativoinativo === ativoInativo
                );
              
                // Cria um novo objeto ativo/inativo/contagemativ se a combinação não existir
                if (!ativoInativoExistente) {
                  ativoInativoContagemAtivo.push({
                    ativoinativo: ativoInativo,
                    contagemativ: 0
                  });
                }
              
                // Atualiza as contagens do tipo e ativo/inativo encontrado (novo ou existente)
                ativoInativoContagemAtivo.forEach(ativoInativoContagemAtivoItem => {
                  if (
                    ativoInativoContagemAtivoItem.ativoinativo === ativoInativo 
                  ) {
                    ativoInativoContagemAtivoItem.contagemativ++;
                  }
                });


                
                if (patrimonio.patr_depreciacao == 'Descartado') {
                  
                  valorAcumulado -= valor ;

                  const compraExistente = dtcomprvalueativ.find(
                    compraItem => compraItem.comprativ === formattedDate
                  );


                  // Cria um novo objeto compra/valor se a combinação não existir
                  if (!compraExistente) {
                    dtcomprvalueativ.push({
                      comprativ: formattedDate,
                      valueativ: valorAcumulado
                    });

                  } else {
                    // Atualiza os valores da compra encontrada (novo ou existente)
                    compraExistente.valueativ = valorAcumulado;
                    }


                    naoativoacumulado += valor ;
          
                      dtcomprvaluenotativ.push({
                        comprnotativ: formattedDate,
                        valuenot: -naoativoacumulado
                      })

                } else if(patrimonio.patr_ativoinativo == 'Ativo') {
                  
                  valorAcumulado += valor ;
                

                  const compraExistente = dtcomprvalueativ.find(
                    compraItem => compraItem.comprativ === formattedDate
                  );


                  // Cria um novo objeto compra/valor se a combinação não existir
                  if (!compraExistente) {
                    dtcomprvalueativ.push({
                      comprativ: formattedDate,
                      valueativ: valorAcumulado
                    });
                    } else {
                      // Atualiza os valores da compra encontrada (novo ou existente)
                      compraExistente.valueativ = valorAcumulado;
                      }

                      
                }else if(patrimonio.patr_ativoinativo == 'Não ativo'){

                  valorAcumulado -= valor;
                  
                  const compraExistente = dtcomprvalueativ.find(
                    compraItem => compraItem.comprativ === formattedDate
                  );

                  
                  // Cria um novo objeto compra/valor se a combinação não existir
                  if (!compraExistente) {
                    dtcomprvalueativ.push({
                      comprativ: formattedDate,
                      valueativ: valorAcumulado
                      });
                      
                      } else {
                        // Atualiza os valores da compra encontrada (novo ou existente)
                        compraExistente.valueativ = valorAcumulado;
                        }
                        
                        naoativoacumulado += valor;
      
                        dtcomprvaluenotativ.push({
                          comprnotativ: formattedDate,
                          valuenot: -naoativoacumulado
                        })
                      }

              
              });


              resultadoFinal.push(...contagemTipo);
              resultadoFinal.push(...ativoInativoContagemAtivo);
              resultadoFinal.push(...dtcomprvalueativ)              
              resultadoFinal.push(...dtcomprvaluenotativ)
              console.log(resultadoFinal)
              resolve(resultadoFinal); // Resolve the Promise with the result
            } else {
              console.error('Erro ao recuperar patrimônios da API: ', response);
              reject('Erro ao recuperar patrimônios da API');
            }
          },
          (error) => {
            console.error('Erro ao filtrar patrimônios: ', error);
            reject('Erro ao filtrar patrimônios');
          }
        );
      }
    });
  }
  
  


  renderChart(tipospatr: any) {
    // Filtros de dados
    const filteredDataativ = tipospatr.filter((tipo: { ativoinativo: any }) => tipo.ativoinativo);
    const filteredDatatipo = tipospatr.filter((tipo: { tipo: any }) => tipo.tipo);
    const filteredDatavalor = tipospatr.filter((tipo: { comprativ: any }) => tipo.comprativ);
    const filteredDatavalornotactive = tipospatr.filter((tipo: { valuenot: any }) => tipo.valuenot);
  
    // Arrays de dados
    const labels = filteredDatatipo.map((tipo: { tipo: any }) => tipo.tipo);
    const tiposnumber = filteredDatatipo.map((tipo: { contagem: any }) => tipo.contagem);
  
    const ativ = filteredDataativ.map((tipo: { ativoinativo: any }) => tipo.ativoinativo);
    const numberativ = filteredDataativ.map((tipo: { contagemativ: any }) => tipo.contagemativ);
  
    const dataativ = filteredDatavalor.map((tipo: { comprativ: any }) => tipo.comprativ);
    const valorativ = filteredDatavalor.map((tipo: { valueativ: any }) => tipo.valueativ);
  
    const data = filteredDatavalornotactive.map((tipo: { compr: any }) => tipo.compr);
    const valor = filteredDatavalornotactive.map((tipo: { valuenot: any }) => tipo.valuenot);
  
    // Cálculo do patrimônio total
    let patrimoniostotal = 0;
    if (numberativ.length > 0) {
      patrimoniostotal = (numberativ[0] || 0) + (numberativ[1] || 0);
    }
    console.log(patrimoniostotal);
    
  
    // Cálculo dos patrimônios ativos e não ativos
    const patrimoniosativos = numberativ.length > 1 ? numberativ[1] || 0 : 0;
    const patrimoniosnaoativos = numberativ.length > 0 ? numberativ[0] || 0 : 0;
  
    // Cálculo do último valor não ativo
    let lastvaluenotactive = 0;
    if (valor.length > 0) {
      lastvaluenotactive = valor[valor.length - 1] || 0;
    }
  
    // Função para formatar valor em Reais
    function formatarValorEmReais(valor?: number): string {
      if (valor === undefined || valor === null) {
        valor = 0;
      }
      const valorFormatado = valor.toFixed(2); // Arredonda para duas casas decimais e converte para string
      return `R$ ${valorFormatado.replace('.', ',')}`; // Substitui o ponto por vírgula para a formatação de Reais
    }
  
    function formatarValorEmReaistotal(valor?: number): string {
      if (valor === undefined || valor === null) {
          valor = 0;
      }
  
      // Garantir que o valor não seja negativo
      valor = Math.max(valor, 0);
  
      const valorFormatado = valor.toFixed(2); // Arredonda para duas casas decimais e converte para string
      return `R$ ${valorFormatado.replace('.', ',')}`; // Substitui o ponto por vírgula para a formatação de Reais
  }
  

    // Atribuição de valores formatados
    const lastValueFormatted = formatarValorEmReaistotal(valorativ[valorativ.length - 1]);
    const totallostreaisFormatted = formatarValorEmReais(lastvaluenotactive);
  
    // Atualização das propriedades da classe
    this.patrimoniostotal = patrimoniostotal;
    this.patrimoniosativos = patrimoniosativos;
    this.patrimoniosnaoativos = patrimoniosnaoativos;
    this.totalreais = lastValueFormatted;
    this.totallostreais = totallostreaisFormatted;
  
    // Criação dos gráficos usando Chart.js
    const myChart = new Chart("typechart", {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: '',
          data: tiposnumber,
          borderWidth: 1,
          backgroundColor: [
            '#5f2756',
            '#a83a55',
            '#e14b56',
            '#f76f55',
            '#f8a255'
          ],
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                let label = tooltipItem.label || '';
                let value = tooltipItem.raw || 0;
                return `${label}: ${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  
    const Chart2 = new Chart("activechart", {
      type: 'doughnut',
      data: {
        labels: ativ,
        datasets: [{
          label: '',
          data: numberativ,
          borderWidth: 1,
          backgroundColor: [
            '#ff9900',
            '#4f4f70'
          ],
        }]
      },
    });
  
    const Chart3 = new Chart("valuechart", {
      type: 'line',
      data: {
        labels: dataativ,
        datasets: [{
          label: '',
          data: valorativ,
          borderWidth: 1,
          borderColor: '#380664',
          tension: 0.3,
          pointStyle: 'rectRot',
        }],
      },
      options: {
        plugins: {
          legend: {
            display: false // Hide legend (already set in your original code)
          }
        }
      }
    });
  }
}  