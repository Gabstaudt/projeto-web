import { Component, HostListener } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss']
})
export class GraficosModalComponent {
  modalAberto: boolean = false;
  posicaoInicialX: number = 0;
  posicaoInicialY: number = 0;
  movendo: boolean = false;
  modalElemento: HTMLElement | null = null;
  grafico: Chart | null = null;

  abrirModal(): void {
    this.modalAberto = true;
    setTimeout(() => this.renderizarGrafico(), 0); // Garante que o canvas esteja no DOM
  }

  fecharModal(): void {
    this.modalAberto = false;
    if (this.grafico) {
      this.grafico.destroy(); // Destroi o gráfico para evitar múltiplas instâncias
    }
  }

  renderizarGrafico(): void {
    const ctx = document.getElementById('graficoCanvas') as HTMLCanvasElement;
    if (ctx) {
      this.grafico = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Janeiro', 'Fevereiro', 'Março'],
          datasets: [
            {
              label: 'Valores',
              data: [100, 200, 150],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              beginAtZero: true
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  iniciarArraste(event: MouseEvent): void {
    this.modalElemento = (event.target as HTMLElement).closest('.draggable-modal');
    if (this.modalElemento) {
      this.movendo = true;
      this.posicaoInicialX = event.clientX - this.modalElemento.offsetLeft;
      this.posicaoInicialY = event.clientY - this.modalElemento.offsetTop;
    }
  }

  finalizarArraste(): void {
    this.movendo = false;
  }

  @HostListener('document:mousemove', ['$event'])
  moverModal(event: MouseEvent): void {
    if (this.movendo && this.modalElemento) {
      const novaPosicaoX = event.clientX - this.posicaoInicialX;
      const novaPosicaoY = event.clientY - this.posicaoInicialY;
      this.modalElemento.style.left = `${novaPosicaoX}px`;
      this.modalElemento.style.top = `${novaPosicaoY}px`;
    }
  }
}
