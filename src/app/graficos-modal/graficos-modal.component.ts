import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss'],
})
export class GraficosModalComponent implements OnInit {
  @Input() dadosGrafico: any;
  @Output() fechar = new EventEmitter<void>();

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    if (!this.dadosGrafico) {
      console.warn('Dados do gráfico ausentes.');
      return;
    }
  
    this.gerarGraficos();
  }

  gerarGraficos(): void {
    // Implementação para gerar gráficos
  }

  fecharModal(): void {
    this.fechar.emit();
  }
}
