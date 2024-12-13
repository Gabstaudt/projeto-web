import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor } from '../models/setor.model';
import { HistoricoService } from '../services/hist/historico.service';

@Component({
  selector: 'app-historico-modal',
  templateUrl: './historico-modal.component.html',
  styleUrls: ['./historico-modal.component.scss'],
})
export class HistoricoModalComponent implements OnInit {
  @Input() setorId: number = 0; // ID do setor selecionado
  @Output() fechar = new EventEmitter<void>(); // Evento para fechar o modal
  tags: Tag[] = []; // Tags do setor selecionado
  setores: Setor[] = [];
  selectedTags: number[] = []; // IDs das tags selecionadas
  dataInicio: string = '';
  horaInicio: string = '';
  dataFim: string = '';
  horaFim: string = '';
  historico: any[] = []; // Dados recebidos do servidor
  tagsSelecionadas: Tag[] = []; // Lista de todas as tags selecionadas
  tagsInteirasSelecionadas: number[] = []; // IDs das tags inteiras
  tagsBooleanasSelecionadas: number[] = []; 
  constructor(
    private entradaService: EntradaService,
    private historicoService: HistoricoService
  ) {}

  ngOnInit() {
    this.setores = this.entradaService.listaGlobal || [];
    if (this.setorId) {
      this.loadTags();
    }
  }

  // Fecha o modal
  fecharModal() {
    this.fechar.emit();
  }

  // Carrega as tags do setor selecionado
  loadTags() {
    this.tags = this.historicoService.getTagsBySetorId(this.setorId) || [];
    console.log('Tags carregadas:', this.tags);
  }
  
  
  
  
  
  // Atualiza as tags quando o setor muda
  onSetorChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.setorId = Number(target.value);
    this.selectedTags = []; // Limpa a seleção ao trocar de setor
    this.loadTags();
  }
  // Consulta o histórico
  consultarHistorico() {
    if (!this.dataInicio || !this.dataFim) {
      console.error('Datas de início e fim são obrigatórias.');
      return;
    }
  
    const dataInicioMs = new Date(`${this.dataInicio}T${this.horaInicio}:00`).getTime();
    const dataFimMs = new Date(`${this.dataFim}T${this.horaFim}:00`).getTime();
  
    if (dataInicioMs >= dataFimMs) {
      console.error('A data de início deve ser anterior à data de fim.');
      return;
    }
  
    this.historicoService.fazerRequisicaoHistorico(
      localStorage.getItem('SessaoID') || '',
      this.setorId,
      dataInicioMs,
      dataFimMs,
      this.tagsInteirasSelecionadas,
      this.tagsBooleanasSelecionadas
    ).subscribe({
      next: (data) => {
        console.log('Histórico recebido:', data);
        this.historico = data;
      },
      error: (err) => {
        console.error('Erro ao consultar histórico:', err);
      }
    });
  }
  
  
  isTagSelected(tagId: number): boolean {
    return this.tagsSelecionadas.some(t => t.id === tagId);
  }
  

  // Alterna a seleção de tags
  toggleTagSelection(tag: Tag) {
    const index = this.tagsSelecionadas.indexOf(tag);
    if (index === -1) {
      this.tagsSelecionadas.push(tag);
    } else {
      this.tagsSelecionadas.splice(index, 1);
    }
    console.log('Tags selecionadas:', this.selectedTags);
    // Após modificar a seleção, separe as tags automaticamente
    this.separarTagsSelecionadas();
  }
  
  

  private separarTagsSelecionadas() {
    this.tagsInteirasSelecionadas = [];
    this.tagsBooleanasSelecionadas = [];
  
    // Verifica cada tag e separa conforme leituraInt ou leituraBool
    for (const tag of this.tagsSelecionadas) {
      if (tag.leituraInt !== undefined) {
        this.tagsInteirasSelecionadas.push(tag.id);
      } else if (tag.leituraBool !== undefined) {
        this.tagsBooleanasSelecionadas.push(tag.id);
      }
    }
  
    console.log('Tags Inteiras:', this.tagsInteirasSelecionadas);
    console.log('Tags Booleanas:', this.tagsBooleanasSelecionadas);
  }
  
  
  
  
}
