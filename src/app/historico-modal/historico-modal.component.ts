import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-historico-modal',
  templateUrl: './historico-modal.component.html',
  styleUrls: ['./historico-modal.component.scss']
})
export class HistoricoModalComponent {
  @Input() setores: { id: number; nome: string }[] = [];
  @Input() tags: string[] = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'];
  @Output() fechar = new EventEmitter<void>();

  fecharModal() {
    this.fechar.emit();
  }
}
