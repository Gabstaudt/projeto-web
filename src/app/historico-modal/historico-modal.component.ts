import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor} from '../models/setor.model';
import {HistoricoService} from '../services/hist/historico.service'

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
  selectedTags: number[] = []; // armazenar as tags selecionadas
  dataInicio: string = '';
  dataFim: string = '';
  historico: any[] = []; // Dados recebidos do servidor

  constructor(private entradaService: EntradaService,
    private historicoService: HistoricoService

  ) {}

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


  consultarHistorico() {
    this.historicoService
      .fazerRequisicaoHistorico(
        'abc123', // Substitua pelo ID real da sessão
        5, // ID do setor
        Date.now() - 86400000, // Data de início
        Date.now(), // Data de fim
        [100, 200], // Tags inteiras
        [300, 400] // Tags booleanas
      )
      .subscribe({
        next: (data: any) => {
          console.log('Resposta do servidor:', data);
        },
        error: (error: any) => {
          console.error('Erro ao consultar histórico:', error);
        },
      });
  }
  

  toggleTagSelection(tagId: number) {
    if (this.selectedTags.includes(tagId)) {
      this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    } else {
      this.selectedTags.push(tagId);
    }
  }
}
