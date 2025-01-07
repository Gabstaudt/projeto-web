import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';


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

  chartInteiras: Chart | null = null;
  chartBooleanas: Chart | null = null;
  

  constructor() {
    Chart.register(...registerables, zoomPlugin);
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
  
    // Limpeza de gráficos anteriores
    if (this.chartInteiras) this.chartInteiras.destroy();
    if (this.chartBooleanas) this.chartBooleanas.destroy();
  
    console.log('Dados recebidos para inteiras:', dadosInteiras);
    console.log('Dados recebidos para booleanas:', dadosBooleanas);
  
    // Gráfico de Inteiras
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement | null;
    if (canvasInteiras) {
      const ctx = canvasInteiras.getContext('2d');
      if (ctx && dadosInteiras.length > 0) {
        const labels = dadosInteiras.map((d) => d.tempo.split(' ')[1].substring(0, 5));
  
        const datasetsInteiras = dadosInteiras[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosInteiras.map((d) =>
            d.valores[i]?.valor ? parseFloat(d.valores[i].valor.replace(',', '.')) : null
          ),
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: `y${i}`,
        }));
  
        const yAxes = datasetsInteiras.map((ds, i) => ({
          id: `y${i}`,
          type: 'linear' as const,
          position: i % 2 === 0 ? 'left' : 'right',
          title: {
            display: true,
            text: ds.label,
          },
          ticks: {
            suggestedMin: Math.min(...(ds.data.filter((v) => v !== null) as number[])),
            suggestedMax: Math.max(...(ds.data.filter((v) => v !== null) as number[])),
          },
        }));
  
        this.chartInteiras = new Chart(ctx, {
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
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'xy',
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true,
                  },
                  mode: 'xy',
                  onZoomComplete: ({ chart }) => {
                    if (chart === this.chartInteiras) {
                      this.sincronizarZoom(this.chartInteiras, this.chartBooleanas);
                    }
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hora',
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 10,
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
        const labels = dadosBooleanas.map((d) => d.tempo.split(' ')[1].substring(0, 5));
  
        const datasetsBooleanas = dadosBooleanas[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosBooleanas.map((d) => (d.valores[i]?.estado === 'Ligado' ? i + 1 : 0)),
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }));
  
        this.chartBooleanas = new Chart(ctx, {
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
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'xy',
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true,
                  },
                  mode: 'xy',
                  onZoomComplete: ({ chart }) => {
                    if (chart === this.chartBooleanas) {
                      this.sincronizarZoom(this.chartBooleanas, this.chartInteiras);
                    }
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hora',
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 10,
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Tags Booleanas',
                },
                ticks: {
                  stepSize: 1,
                },
                min: 0,
                max: datasetsBooleanas.length,
              },
            },
          },
        });
      }
    }
  }
  
  
  sincronizarZoom(chartOrigem: Chart | null, chartDestino: Chart | null): void {
    if (!chartOrigem || !chartDestino) return;
  
    const xScaleOrigem = chartOrigem.scales['x'];
    const xStart = xScaleOrigem.min;
    const xEnd = xScaleOrigem.max;
  
    if (xStart !== undefined && xEnd !== undefined) {
      chartDestino.zoomScale('x', { min: xStart, max: xEnd });
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

  resetarZoom(): void {
    if (this.chartInteiras) {
      this.chartInteiras.resetZoom();
    }
    if (this.chartBooleanas) {
      this.chartBooleanas.resetZoom();
    }
  }
  
  

}
  
  