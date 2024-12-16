import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor } from '../models/setor.model';
import { HistoricoService } from '../services/hist/historico.service';
import { ChangeDetectorRef } from '@angular/core';


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
    private historicoService: HistoricoService,
    private cdr: ChangeDetectorRef
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
    const { inteiras, booleanas } = this.entradaService.getTagsBySetorId(this.setorId);
    this.tags = [...inteiras, ...booleanas]; // Todas as tags disponíveis
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
    this.separarTagsSelecionadas(); // Separar tags antes de enviar
  
    const idSessao = localStorage.getItem('SessaoID');
    if (!idSessao) {
      console.error('Sessão ID ausente no localStorage.');
      return;
    }
  
    const dataInicioCompleta = `${this.dataInicio}T${this.horaInicio}:00`;
    const dataFimCompleta = `${this.dataFim}T${this.horaFim}:00`;
  
    const dataInicioMs = new Date(dataInicioCompleta).getTime();
    const dataFimMs = new Date(dataFimCompleta).getTime();
  
    if (dataInicioMs >= dataFimMs) {
      console.error('A data de início deve ser anterior à data de fim.');
      return;
    }
  
    this.historicoService
      .fazerRequisicaoHistorico(
        idSessao,
        this.setorId,
        dataInicioMs,
        dataFimMs,
        this.tagsInteirasSelecionadas,
        this.tagsBooleanasSelecionadas
      )
      .subscribe({
        next: (data) => {
          console.log('Histórico recebido:', data);
        },
        error: (err) => {
          console.error('Erro ao consultar histórico:', err);
        },
      });
  }
  
  
  
  isTagSelecionada(tagId: number): boolean {
    return this.tagsSelecionadas.some(tag => tag.id === tagId);
  }
  
  

  // Alterna a seleção de tags

  toggleTagSelection(tag: Tag) {
    const index = this.tagsSelecionadas.findIndex(t => t.id === tag.id);
    if (index === -1) {
      this.tagsSelecionadas.push(tag);
    } else {
      this.tagsSelecionadas.splice(index, 1);
    }
    console.log('Tags Selecionadas:', this.tagsSelecionadas);
    this.cdr.detectChanges();
  }
  
  
  
  

  separarTagsSelecionadas() {
    this.tagsInteirasSelecionadas = this.tagsSelecionadas
      .filter(tag => typeof tag.leituraInt === 'number' && tag.leituraInt !== 0)
      .map(tag => tag.id);
  
    this.tagsBooleanasSelecionadas = this.tagsSelecionadas
      .filter(tag => typeof tag.leituraBool === 'boolean' && tag.leituraBool === true)
      .map(tag => tag.id);
  
    console.log('Tags Inteiras Selecionadas:', this.tagsInteirasSelecionadas);
    console.log('Tags Booleanas Selecionadas:', this.tagsBooleanasSelecionadas);
  }
  
  
  
  
  
  
}
