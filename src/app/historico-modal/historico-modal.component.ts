import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-historico-modal',
  templateUrl: './historico-modal.component.html',
  styleUrls: ['./historico-modal.component.scss']
})
export class HistoricoModalComponent {
  @Output() fechar = new EventEmitter<void>(); // Evento para informar ao componente pai quando o modal é fechado

  fecharModal(): void {
    this.fechar.emit(); // Emite o evento de fechamento
  }
}
