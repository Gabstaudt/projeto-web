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
    dadosInteiras: { tempo: any; valores: { nome: string; valor: any }[] }[];
    dadosBooleanas: { tempo: any; valores: { nome: string; estado: any }[] }[];
  } | null = null;

  @Output() fechar = new EventEmitter<void>();

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    if (this.dadosGrafico) {
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
  
    // Gráfico de Inteiras
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement | null;
    if (canvasInteiras) {
      const ctx = canvasInteiras.getContext('2d');
      if (ctx && dadosInteiras.length > 0) {
        const labels = dadosInteiras.map((d) => d.tempo); // Extrai os tempos como labels
        const datasetsInteiras = dadosInteiras[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosInteiras.map((d) => parseFloat(d.valores[i]?.valor) || 0), // Extrai valores corretamente
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false,
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
                  text: 'Tempo',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Valores',
                },
                min: Math.min(...datasetsInteiras.flatMap((ds) => ds.data)), // Calcula o menor valor
                max: Math.max(...datasetsInteiras.flatMap((ds) => ds.data)), // Calcula o maior valor
              },
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
        const labels = dadosBooleanas.map((d) => d.tempo); // Extrai os tempos como labels
        const datasetsBooleanas = dadosBooleanas[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosBooleanas.map((d) => (d.valores[i]?.estado === 'Ligado' ? 1 : 0)), // Processa booleanos
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false,
        }));
  
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
  
  
  


}
