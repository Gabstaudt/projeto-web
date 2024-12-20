import { Component, ElementRef, Renderer2, HostListener } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss']
})
export class GraficosModalComponent {
  modalAberto: boolean = false;
  modalElemento: HTMLElement | null = null;
  movendo: boolean = false;
  posicaoInicialX: number = 0;
  posicaoInicialY: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

abrirModal(): void {
    console.log('Abrindo modal de gráficos');
    this.modalAberto = true;
  
    // Adicionar o modal ao body
    const modalNativeElement = this.el.nativeElement.querySelector('.modal-graficos');
    if (modalNativeElement) {
      this.renderer.appendChild(document.body, modalNativeElement);
      console.log('Modal de gráficos adicionado ao body');
    } else {
      console.error('Elemento modal-graficos não encontrado');
    }
  
    setTimeout(() => this.renderizarGrafico(), 0); // Renderizar o gráfico
  }
  

  fecharModal(): void {
    console.log('Fechando modal de gráficos');
    this.modalAberto = false;
  
    const modalNativeElement = this.el.nativeElement.querySelector('.modal-graficos');
    if (modalNativeElement && document.body.contains(modalNativeElement)) {
      this.renderer.removeChild(document.body, modalNativeElement);
      console.log('Modal de gráficos removido do body');
    }
  }

  renderizarGrafico(): void {
    const ctx = document.getElementById('graficoCanvas') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
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
          maintainAspectRatio: false
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

  @HostListener('document:mousemove', ['$event'])
  moverModal(event: MouseEvent): void {
    if (this.movendo && this.modalElemento) {
      const novaPosicaoX = event.clientX - this.posicaoInicialX;
      const novaPosicaoY = event.clientY - this.posicaoInicialY;
      this.modalElemento.style.left = `${novaPosicaoX}px`;
      this.modalElemento.style.top = `${novaPosicaoY}px`;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  finalizarArraste(): void {
    this.movendo = false;
  }
}
