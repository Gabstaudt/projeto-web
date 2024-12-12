import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor} from '../models/setor.model';


@Component({
  selector: 'app-historico-modal',
  templateUrl: './historico-modal.component.html',
  styleUrls: ['./historico-modal.component.scss']
})
export class HistoricoModalComponent implements OnInit {
  @Input() setorId: number = 0; // ID do setor selecionado
  @Output() fechar = new EventEmitter<void>(); // Evento para fechar o modal
  tags: Tag[] = []; // Tags do setor selecionado
  setores: Setor[] = []; 
  constructor(private entradaService: EntradaService) {}

  ngOnInit() {
    this.setores = this.entradaService.listaGlobal || [];
    if (this.setorId) {
      this.loadTags();
    }
  }

  // Fecha o modal e emite o evento para o pai
  fecharModal() {
    this.fechar.emit();
  }

  // Carrega as tags do setor selecionado
  loadTags() {
    this.tags = this.entradaService.getTagsBySetorId(this.setorId) || [];
  }

  onSetorChange(event: Event) {
    const target = event.target as HTMLSelectElement; // Faz o cast para HTMLSelectElement
    const setorId = Number(target.value); // Obtém o valor do setor selecionado
    this.setorId = setorId; // Atualiza o ID do setor
    this.loadTags(); // Atualiza as tags associadas ao setor
  }
  
}
