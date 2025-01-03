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

  private isDragging = false;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private initialWidth = 0;
  private initialHeight = 0;
  private initialMouseX = 0;
  private initialMouseY = 0;

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
          borderWidth: 0.5, // espessura linha
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
          borderWidth: 1, // Define a espessura da linha como 1px (ajuste conforme necessário)
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

  arrastarcomeco(event: MouseEvent): void {
    if (this.isResizing) return; // Bloqueia arraste se estiver redimensionando
    this.isDragging = true;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;

    document.addEventListener('mousemove', this.arraste);
    document.addEventListener('mouseup', this.parararraste);
  }

  arraste = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    this.offsetX = event.clientX - this.startX;
    this.offsetY = event.clientY - this.startY;

    const modal = document.getElementById('modal-container')!;
    modal.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
  };

  parararraste = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.arraste);
    document.removeEventListener('mouseup', this.parararraste);
  };

  comecarRedimensionar(event: MouseEvent): void {
    if (this.isDragging) return; // Bloqueia redimensionamento se estiver arrastando
    this.isResizing = true;
    const modal = document.getElementById('modal-container')!;
    this.initialWidth = modal.offsetWidth;
    this.initialHeight = modal.offsetHeight;
    this.initialMouseX = event.clientX;
    this.initialMouseY = event.clientY;

    document.addEventListener('mousemove', this.redimensionar);
    document.addEventListener('mouseup', this.pararRedimensionar);
  }

  redimensionar = (event: MouseEvent): void => {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.initialMouseX;
    const deltaY = event.clientY - this.initialMouseY;

    const modal = document.getElementById('modal-container')!;
    modal.style.width = `${this.initialWidth + deltaX}px`;
    modal.style.height = `${this.initialHeight + deltaY}px`;

    this.atualizarTamanhoGraficos();
  };

  pararRedimensionar = (): void => {
    this.isResizing = false;
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
  
  