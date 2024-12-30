import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss'],
})
export class GraficosModalComponent implements OnInit {
  @Input() dadosGrafico: {
    setorNome: string;
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
    } else {
      console.warn('Nenhum dado disponível para gerar gráficos.');
    }
  }

  gerarGraficos(): void {
    if (!this.dadosGrafico) {
      console.warn('dadosGrafico é nulo ou indefinido.');
      return;
    }

    // Gráfico de Inteiras
    const canvasInteiras = document.getElementById('canvasInteiras') as HTMLCanvasElement | null;
    if (canvasInteiras) {
      const ctx = canvasInteiras.getContext('2d');
      if (ctx) {
        const labels = this.dadosGrafico?.dadosInteiras?.map((d) => d.tempo ?? 'N/A') ?? [];
        const datasets = this.dadosGrafico?.dadosInteiras?.[0]?.valores?.map((valor, i) => ({
          label: valor?.nome ?? `Valor ${i + 1}`,
          data: this.dadosGrafico?.dadosInteiras?.map((d) => d?.valores?.[i]?.valor ?? 0) ?? [],
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false,
        })) ?? [];

        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets,
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
      if (ctx) {
        const labels = this.dadosGrafico?.dadosBooleanas?.map((d) => d.tempo ?? 'N/A') ?? [];
        const datasets = this.dadosGrafico?.dadosBooleanas?.[0]?.valores?.map((valor, i) => ({
          label: valor?.nome ?? `Valor ${i + 1}`,
          data: this.dadosGrafico?.dadosBooleanas?.map((d) => (d?.valores?.[i]?.estado === 'Ligado' ? 1 : 0)) ?? [],
          borderColor: `hsl(${i * 50}, 70%, 50%)`,
          fill: false,
        })) ?? [];

        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets,
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
              },
            },
          },
        });
      }
    }
  }

  fecharModal(): void {
    this.fechar.emit();
  }
}
