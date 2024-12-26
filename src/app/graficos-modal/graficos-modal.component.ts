import { Component, ElementRef, Renderer2 } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss'],
})
export class GraficosModalComponent {
  modalAberto: boolean = false;
  graficoInteiras: Chart | null = null;

  abrirModal(): void {
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    if (this.graficoInteiras) {
      this.graficoInteiras.destroy(); // Destrói o gráfico ao fechar o modal
    }
  }


  gerarGraficos(dadosInteiras: any[], dadosBooleanas: any[]): void {
    // Renderiza o gráfico para tags inteiras
    this.renderizarGraficoInteiras(dadosInteiras);

    // (Opcional) Renderize um gráfico separado para tags booleanas
  }

  private renderizarGraficoInteiras(dados: any[]): void {
    const ctx = document.getElementById('graficoCanvas') as HTMLCanvasElement;
    if (ctx) {
      const labels = dados.map((dado) => dado.tempo);
      const datasets = dados[0]?.valores.map((tag: any, index: number) => ({
        label: tag.nome,
        data: dados.map((dado) => dado.valores[index]?.valor || 0),
        borderColor: `rgba(${75 + index * 20}, 192, 192, 1)`,
        backgroundColor: `rgba(${75 + index * 20}, 192, 192, 0.2)`,
        borderWidth: 2,
      }));

      this.graficoInteiras = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels, // Eixo X (tempos)
          datasets: datasets, // Eixo Y (valores)
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
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
              beginAtZero: true,
            },
          },
        },
      });
    }
  }
}
