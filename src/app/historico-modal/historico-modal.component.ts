import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor } from '../models/setor.model';
import { HistoricoService } from '../services/hist/historico.service';
import { ChangeDetectorRef } from '@angular/core';
import { converterLeitura } from 'src/app/models/converter.model';
import { TipoTag } from 'src/app/models/tipo.model';

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
        this.mapearIdsParaNomes(); // Substitui os IDs pelos nomes
        console.log('Histórico final processado:', this.dadosHistorico);
      },
      error: (err) => {
        console.error('Erro ao consultar histórico:', err);
      },
    });
  
  }
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  
  
  //////////////////// função para mapear o nome da tag pelo id dela/////////////////////////////////
  private mapearIdsParaNomes() {
    const tagIdParaNome: { [id: number]: string } = {};
  
    // Carrega o mapeamento entre IDs e nomes
    this.setores.forEach((setor) => {
      setor.tags.forEach((tag) => {
        tagIdParaNome[tag.id] = tag.nome;
      });
    });
  
    // Substitui os IDs pelos nomes e ajusta o tempo e os valores
    this.dadosHistorico = this.dadosHistorico.map((registro) => {
      const novoRegistro: any = {
        tempoInformacao: registro.tempoInformacao 
          ? this.formatarTempo(registro.tempoInformacao)
          : '-', // Exibe '-' se tempoInformacao for null
      };
    
      // Mapeia os valores das tags inteiras
      if (registro.tagsInteiras) {
        registro.tagsInteiras.forEach((tag: any) => {
          const tagInfo = this.tagsSelecionadas.find((t) => t.id === tag.id);
          const valorFormatado = tagInfo
            ? converterLeitura(tagInfo.tipo, tag.valor)
            : tag.valor;
    
          const nomeTag = tagInfo ? tagInfo.nome : `Tag Inteira ${tag.id}`;
          novoRegistro[nomeTag] = valorFormatado;
        });
      }
    
      // Mapeia os valores das tags booleanas
      if (registro.valoresBooleanos) {
        registro.valoresBooleanos.forEach((tag: any) => {
          const tagInfo = this.tagsSelecionadas.find((t) => t.id === tag.id);
          const valorFormatado = tag.valor ? 'Ativado' : 'Desativado';
    
          const nomeTag = tagInfo ? tagInfo.nome : `Tag Booleana ${tag.id}`;
          novoRegistro[nomeTag] = valorFormatado;
        });
      }
    
      return novoRegistro;
    });
    
    
  
    console.log('Histórico mapeado e formatado:', this.dadosHistorico);
  }
  
  // Formata a data para dd/MM/yy HH:mm:ss
  formatarTempo(tempo: number): string {
    if (!tempo) return '-'; // Retorna "-" se não houver tempo
    const data = new Date(tempo * 1000); // Converte Unix timestamp (segundos) para milissegundos
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
    const ano = data.getFullYear().toString().slice(-2);
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
  
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  }
  
  
  
  
  
  
}
