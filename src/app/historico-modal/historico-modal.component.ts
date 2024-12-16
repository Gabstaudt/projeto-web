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
  dadosHistorico: any[] = [];



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
    console.log('Setor ID Selecionado:', this.setorId);
    this.tags = this.entradaService.getTagsBySetorId(this.setorId) || [];
    console.log('Tags Carregadas no Modal:', this.tags);
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
    // Separar tags antes de enviar
    this.separarTagsSelecionadas();
  
    const idSessao = localStorage.getItem('SessaoID');
    if (!idSessao) {
      console.error('Sessão ID ausente no localStorage.');
      return;
    }
  
    // Criar strings completas de data e hora
    const dataInicioCompleta = `${this.dataInicio}T${this.horaInicio}:00`;
    const dataFimCompleta = `${this.dataFim}T${this.horaFim}:00`;
  
    // Converter para milissegundos (Unix timestamp)
    const dataInicioMs = new Date(dataInicioCompleta).getTime();
    const dataFimMs = new Date(dataFimCompleta).getTime();
  
    if (isNaN(dataInicioMs) || isNaN(dataFimMs)) {
      console.error('Formato inválido de data ou hora.');
      return;
    }
  
    // Garantir que a data de início é anterior à de fim
    if (dataInicioMs >= dataFimMs) {
      console.error('A data de início deve ser anterior à data de fim.');
      return;
    }
  
    console.log('Data início (ms):', dataInicioMs);
    console.log('Data fim (ms):', dataFimMs);
    console.log('Tags Inteiras Selecionadas:', this.tagsInteirasSelecionadas);
    console.log('Tags Booleanas Selecionadas:', this.tagsBooleanasSelecionadas);
  
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
        this.dadosHistorico = data;
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
      this.tagsSelecionadas.push(tag); // Adiciona a tag selecionada
    } else {
      this.tagsSelecionadas.splice(index, 1); // Remove a tag selecionada
    }
  
    this.separarTagsSelecionadas(); // Atualiza a separação de inteiras/booleanas
    console.log('Tags Selecionadas:', this.tagsSelecionadas);
  }
  
  
  
  
  
  separarTagsSelecionadas() {
    this.tagsInteirasSelecionadas = this.tagsSelecionadas
      .filter(tag => tag.tipo !== 0) // Inteira se tipo for diferente de 0
      .map(tag => tag.id);
  
    this.tagsBooleanasSelecionadas = this.tagsSelecionadas
      .filter(tag => tag.tipo === 0) // Booleana se tipo for 0
      .map(tag => tag.id);
  
    console.log('Tags Inteiras Selecionadas:', this.tagsInteirasSelecionadas);
    console.log('Tags Booleanas Selecionadas:', this.tagsBooleanasSelecionadas);
  }
  
  
  
  
  
  
  
  
  
  
  
  
}
