import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss'],
})
export class GraficosModalComponent implements OnInit {
  @Input() dadosGrafico: {
    setorNome: string | null;
    dadosInteiras: { tempo: string; valores: { nome: string; valor: any }[] }[];
    dadosBooleanas: { tempo: string; valores: { nome: string; estado: any }[] }[];
  } | null = null;

  @Output() fechar = new EventEmitter<void>();

  private isArrastando = false;
  private isRedimensionando = false;
  private inicioX = 0;
  private inicioY = 0;
  private deslocamentoX = 0;
  private deslocamentoY = 0;
  private larguraInicial = 0;
  private alturaInicial = 0;
  private mouseInicialX = 0;
  private mouseInicialY = 0;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    if (this.dadosGrafico) {
      console.log('Dados recebidos no componente gráfico:', this.dadosGrafico);
      this.gerarGraficos();
    }
  }

  fecharModal(): void {
    this.fechar.emit();
  }


  gerarGraficos(): void {
    if (!this.dadosGrafico) {
      console.warn('Dados do gráfico estão ausentes.');
      return;
    }
  
    const { dadosInteiras, dadosBooleanas } = this.dadosGrafico;
  
    console.log('Dados recebidos para inteiras:', dadosInteiras);
    console.log('Dados recebidos para booleanas:', dadosBooleanas);
  
    // Gráfico de Inteiras
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement | null;
    if (canvasInteiras) {
      const ctx = canvasInteiras.getContext('2d');
      if (ctx && dadosInteiras.length > 0) {
        const labels = dadosInteiras.map((d) => {
          if (/\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/.test(d.tempo)) {
            // Extrai apenas a hora no formato hh:mm
            return d.tempo.split(' ')[1].substring(0, 5);
          } else {
            console.warn('Formato inesperado no campo tempo:', d.tempo);
            return d.tempo; // Fallback para o valor original
          }
        });
        
    
        const datasetsInteiras = dadosInteiras[0].valores.map((valor, i) => {
          const data = dadosInteiras.map((d) =>
            d.valores[i]?.valor ? parseFloat(d.valores[i].valor.replace(',', '.')) : null // Converte para número
          );
          console.log(`Dataset Inteiras (${valor.nome}):`, data);
    
          return {
            label: valor.nome,
            data,
            borderColor: `hsl(${i * 50}, 70%, 50%)`,
            borderWidth: 2, // Define linhas finas
            pointRadius: 0, // Remove pontos
            fill: false,
            yAxisID: `y${i}`, // Eixos separados para cada conjunto de dados
          };
        });
    
        const yAxes = datasetsInteiras.map((ds, i) => ({
          id: `y${i}`,
          type: 'linear' as const,
          position: i % 2 === 0 ? 'left' : 'right', // Alterna entre esquerda e direita
          title: {
            display: true,
            text: ds.label,
          },
          ticks: {
            suggestedMin: Math.min(...(ds.data.filter((v) => v !== null) as number[])), // Valores válidos
            suggestedMax: Math.max(...(ds.data.filter((v) => v !== null) as number[])),
          },
        }));
    
        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: datasetsInteiras,
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hora',
                },
                ticks: {
                  autoSkip: true, // Reduz a densidade dos rótulos
                  maxTicksLimit: Math.min(15, labels.length), // Ajusta o número de rótulos com base na quantidade de dados
                  maxRotation: 45, // Rotaciona os rótulos para evitar sobreposição
                  minRotation: 0,
                },
              },
              ...Object.fromEntries(yAxes.map((axis) => [axis.id, axis])),
            },
          },
        });
      }
    }
    
  
    // Gráfico de Booleanas
    const canvasBooleanas = document.getElementById('canvasBooleanas') as HTMLCanvasElement | null;
    if (canvasBooleanas) {
      const ctx = canvasBooleanas.getContext('2d');
      if (ctx && dadosBooleanas.length > 0) {
        const labels = dadosBooleanas.map((d) => d.tempo); // Rótulos do eixo X (tempo)
  
        const datasetsBooleanas = dadosBooleanas[0].valores.map((valor, i) => {
          const data = dadosBooleanas.map((d) => (d.valores[i]?.estado === 'Ligado' ? 1 : 0));
          console.log(`Dataset Booleanas (${valor.nome}):`, data);
  
          return {
            label: valor.nome,
            data,
            borderColor: `hsl(${i * 50}, 70%, 50%)`,
            borderWidth: 1, // Define linhas finas
            pointRadius: 0, // Remove pontos
            fill: false,
          };
        });
  
        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: datasetsBooleanas,
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Tempo',
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: Math.min(15, labels.length), 
                  maxRotation: 45,
                  minRotation: 0,
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Estado (1=Ligado, 0=Desligado)',
                },
                min: 0,
                max: 1,
           
  
              },
            },
          },
        });
      }
    }
  }
  
  
  
  arrastarcomeco(event: MouseEvent): void {
    if (this.isRedimensionando) return; 
    this.isArrastando = true;
    this.inicioX = event.clientX - this.deslocamentoX;
    this.inicioY = event.clientY - this.deslocamentoY;

    document.addEventListener('mousemove', this.arraste);
    document.addEventListener('mouseup', this.parararraste);
  }

  arraste = (event: MouseEvent): void => {
    if (!this.isArrastando) return;

    this.deslocamentoX = event.clientX - this.inicioX;
    this.deslocamentoY = event.clientY - this.inicioY;

    const modal = document.getElementById('modal-container')!;
    modal.style.transform = `translate(${this.deslocamentoX}px, ${this.deslocamentoY}px)`;;
  };

  parararraste = (): void => {
    this.isArrastando = false;
    document.removeEventListener('mousemove', this.arraste);
    document.removeEventListener('mouseup', this.parararraste);
  };

  comecarRedimensionar(event: MouseEvent): void {
    if (this.isArrastando) return; 
    this.isRedimensionando = true;
    const modal = document.getElementById('modal-container')!;
    this.larguraInicial = modal.offsetWidth;
    this.alturaInicial = modal.offsetHeight;
    this.mouseInicialX = event.clientX;
    this.mouseInicialY = event.clientY;

    document.addEventListener('mousemove', this.redimensionar);
    document.addEventListener('mouseup', this.pararRedimensionar);
  }

  redimensionar = (event: MouseEvent): void => {
    if (!this.isRedimensionando) return;

    const deltaX = event.clientX - this.mouseInicialX;
    const deltaY = event.clientY - this.mouseInicialY;

    const modal = document.getElementById('modal-container')!;
    modal.style.width = `${this.larguraInicial + deltaX}px`;
    modal.style.height = `${this.alturaInicial + deltaY}px`;

    this.atualizarTamanhoGraficos();
  };

  pararRedimensionar = (): void => {
    this.isRedimensionando = false;
        document.removeEventListener('mousemove', this.redimensionar);
    document.removeEventListener('mouseup', this.pararRedimensionar);
  };

  atualizarTamanhoGraficos(): void {
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement;
    const canvasBooleanas = document.getElementById('canvasBooleanas') as HTMLCanvasElement;

    if (canvasInteiras) {
      canvasInteiras.width = canvasInteiras.offsetWidth;
      canvasInteiras.height = canvasInteiras.offsetHeight;
    }

    if (canvasBooleanas) {
      canvasBooleanas.width = canvasBooleanas.offsetWidth;
      canvasBooleanas.height = canvasBooleanas.offsetHeight;
    }
  }

}
  
  