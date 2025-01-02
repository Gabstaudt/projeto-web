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
  
    // Gráfico de Inteiras
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement | null;
    if (canvasInteiras) {
      const ctx = canvasInteiras.getContext('2d');
      if (ctx && dadosInteiras.length > 0) {
        const labels = dadosInteiras.map((d) => d.tempo);
        const datasetsInteiras = dadosInteiras[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosInteiras.map((d) => parseFloat(d.valores[i]?.valor) || 0),
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false,
          yAxisID: `y${i}`, // Eixos separados
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
            suggestedMin: Math.min(...ds.data),
            suggestedMax: Math.max(...ds.data),
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
                  text: 'Tempo',
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
        const labels = dadosBooleanas.map((d) => d.tempo);
        const datasetsBooleanas = dadosBooleanas[0].valores.map((valor, i) => ({
          label: valor.nome,
          data: dadosBooleanas.map((d) => (d.valores[i]?.estado === 'Ligado' ? 1 : 0)),
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