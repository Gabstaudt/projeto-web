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
  selectedTagsInteiras: number[] = []; // Armazena as tags inteiras selecionadas
  selectedTagsBooleanas: number[] = []; // Armazena as tags booleanas selecionadas
  historico: any[] = []; // Dados recebidos do servidor
  loading: boolean = false;
  selectedTags: number[] = []; // Armazena as tags selecionadas
  dataInicio: string = ''; // Data inicial
  horaInicio: string = ''; // Hora inicial
  dataFim: string = ''; // Data final
  horaFim: string = ''; // Hora final
  
  

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

  // Fecha o modal e emite o evento para o pai
  fecharModal() {
    this.fechar.emit();
  }

  // Carrega as tags do setor selecionado
  loadTags() {
    this.tags = this.entradaService.getTagsBySetorId(this.setorId) || [];
  }

  // Atualiza as tags quando o setor muda
  onSetorChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const setorId = Number(target.value);
    this.setorId = setorId;
    this.selectedTagsInteiras = [];
    this.selectedTagsBooleanas = [];
    this.loadTags();
  }
  
  // Consulta o histórico com os valores dinâmicos
  consultarHistorico() {
    try {
      const idSessao = localStorage.getItem('SessaoID');
      if (!idSessao) {
        throw new Error('Sessão ID ausente no localStorage!');
      }
  
      // Combina data e hora
      const dataInicioCompleta = `${this.dataInicio}T${this.horaInicio}:00`;
      const dataFimCompleta = `${this.dataFim}T${this.horaFim}:00`;
  
      // Converte para milissegundos
      const dataInicioMs = new Date(dataInicioCompleta).getTime();
      const dataFimMs = new Date(dataFimCompleta).getTime();
  
      // Verifica se as datas são válidas
      if (isNaN(dataInicioMs) || isNaN(dataFimMs)) {
        console.error('Datas inválidas. Verifique os valores selecionados.');
        return;
      }
  
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
          this.selectedTagsInteiras,
          this.selectedTagsBooleanas
        )
        .subscribe({
          next: (data: any) => {
            console.log('Resposta do servidor:', data);
            this.historico = data; // Atualiza os dados recebidos
          },
          error: (error: any) => {
            console.error('Erro ao consultar histórico:', error);
          },
        });
    } catch (error) {
      console.error('Erro ao preparar consulta:', error);
    }
  }
  
  
  
  
  

  // Alterna a seleção de uma tag inteira
  toggleTagInteiraSelection(tagId: number) {
    if (this.selectedTagsInteiras.includes(tagId)) {
      this.selectedTagsInteiras = this.selectedTagsInteiras.filter(
        (id) => id !== tagId
      );
    } else {
      this.selectedTagsInteiras.push(tagId);
    }
  }

  // Alterna a seleção de uma tag booleana
  toggleTagBooleanaSelection(tagId: number) {
    if (this.selectedTagsBooleanas.includes(tagId)) {
      this.selectedTagsBooleanas = this.selectedTagsBooleanas.filter(
        (id) => id !== tagId
      );
    } else {
      this.selectedTagsBooleanas.push(tagId);
    }
  }
  toggleTagSelection(tagId: number) {
    if (this.selectedTags.includes(tagId)) {
      this.selectedTags = this.selectedTags.filter((id) => id !== tagId);
    } else {
      this.selectedTags.push(tagId);
    }
  }
}
