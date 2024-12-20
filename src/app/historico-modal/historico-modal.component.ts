import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { EntradaService } from '../services/auth/entrada.service';
import { Tag } from '../models/tag.model';
import { Setor } from '../models/setor.model';
import { HistoricoService } from '../services/hist/historico.service';
import { ChangeDetectorRef } from '@angular/core';
import {formatarValorParaHistorico} from '../models/converterhistorico.model'
import { TipoTag } from 'src/app/models/tipo.model';
import { GraficosModalComponent } from '../graficos-modal/graficos-modal.component';

@Component({
  selector: 'app-historico-modal',
  templateUrl: './historico-modal.component.html',
  styleUrls: ['./historico-modal.component.scss'],
})
export class HistoricoModalComponent implements OnInit {
  @Input() setorId: number = 0; // ID do setor selecionado
  @Output() fechar = new EventEmitter<void>(); // Evento para fechar o modal
  @ViewChild('graficosModal') graficosModal!: GraficosModalComponent;


  tags: Tag[] = []; // Tags do setor selecionado
  setores: Setor[] = [];
  selectedTags: number[] = []; // IDs das tags selecionadas

  periodoSelecionado: string = 'dia';
  horaInicio: string = '00:00';
  horaFim: string = '23:59';
  dataInicio: string = '';
  dataFim: string = '';

  historico: any[] = []; 
  tagsSelecionadas: Tag[] = []; 
  tagsInteirasSelecionadas: number[] = []; 
  tagsBooleanasSelecionadas: number[] = []; 
  dadosHistorico: any[] = [];


  filtroSetor: string = ''; // Texto para filtragem
  meses = [
    { nome: 'Janeiro', numero: 1 },
    { nome: 'Fevereiro', numero: 2 },
    { nome: 'Março', numero: 3 },
    { nome: 'Abril', numero: 4 },
    { nome: 'Maio', numero: 5 },
    { nome: 'Junho', numero: 6 },
    { nome: 'Julho', numero: 7 },
    { nome: 'Agosto', numero: 8 },
    { nome: 'Setembro', numero: 9 },
    { nome: 'Outubro', numero: 10 },
    { nome: 'Novembro', numero: 11 },
    { nome: 'Dezembro', numero: 12 },
  ];
  mostrarModalMes = false;

  constructor(
    private entradaService: EntradaService,
    private historicoService: HistoricoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.setores = this.entradaService.listaGlobal || [];
    if (this.setorId) {
      this.loadTags();
    }
    this.inicializarDataAtual();

  }
  
  abrirModalMes(): void {
    this.mostrarModalMes = true;
  }
  
  // Fechar modal de meses
  fecharModalMes(): void {
    this.mostrarModalMes = false;
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
  onSetorChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSetorId = parseInt(selectElement.value, 10);

    // Atualiza o setor selecionado (lógica anterior)
    this.setorId = selectedSetorId;

    const setorSelecionado = this.setores.find(setor => setor.id === this.setorId);
    this.tags = setorSelecionado ? setorSelecionado.tags : [];
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
            ? formatarValorParaHistorico(tagInfo.tipo, tag.valor) 
            : tag.valor;
      
          const nomeTag = tagInfo ? tagInfo.nome : `Tag Inteira ${tag.id}`;
          novoRegistro[nomeTag] = valorFormatado;
        });
      }
      
  
      // 
      if (registro.valoresBooleanos) {
        registro.valoresBooleanos.forEach((tag: any) => {
          const tagInfo = this.tagsSelecionadas.find((t) => t.id === tag.id);
          const valorFormatado = tag.valor ? 'Ligado' : 'Desligado';
  
          const nomeTag = tagInfo ? tagInfo.nome : `Tag Booleana ${tag.id}`;
          novoRegistro[nomeTag] = valorFormatado; 
        });
      }
  
      return novoRegistro;
    });
  }
  
  
  // Formata a data 
  formatarTempo(tempo: number): string {
    if (!tempo) return '-'; // retornar para caso o tempo seja nulo 
    const data = new Date(tempo * 1000); // conversão de Unix
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); 
    const ano = data.getFullYear().toString().slice(-2);
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
  
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  }
  inicializarDataAtual(): void {
    const hoje = new Date();
    this.dataInicio = this.formatarData(hoje);
    this.dataFim = this.formatarData(hoje);
    this.horaInicio = '00:00';
    this.horaFim = '23:59';
  }
  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  
  onPeriodoChange(): void {
    const hoje = new Date();

    if (this.periodoSelecionado === 'dia') {
      // Define a data inicial e final como o dia atual
      this.dataInicio = this.formatarData(hoje);
      this.dataFim = this.formatarData(hoje);
      this.horaInicio = '00:00';
      this.horaFim = '23:59';
    } else if (this.periodoSelecionado === 'mes') {
      // Define a data inicial como o primeiro dia do mês e a final como o último dia
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      this.dataInicio = this.formatarData(primeiroDia);
      this.dataFim = this.formatarData(ultimoDia);
      this.horaInicio = '00:00';
      this.horaFim = '23:59';
    }
  }

  // Atualiza os horários apenas se "Dia" estiver selecionado
  atualizarHorario(): void {
    if (this.periodoSelecionado === 'dia') {
      this.horaInicio = '00:00';
      this.horaFim = '23:59';
    }
  }
  
  selecionarMes(mes: { nome: string; numero: number }): void {
    const anoAtual = new Date().getFullYear();
    this.dataInicio = `${anoAtual}-${String(mes.numero).padStart(2, '0')}-01`;
    this.horaInicio = '00:00';
    const ultimoDia = new Date(anoAtual, mes.numero, 0).getDate(); // Último dia do mês
    this.dataFim = `${anoAtual}-${String(mes.numero).padStart(2, '0')}-${ultimoDia}`;
    this.horaFim = '23:59';
    this.mostrarModalMes = false; // Fecha o modal
    console.log(`Mês selecionado: ${mes.nome}`);
  }

  onSetorInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const setorSelecionado = this.setores.find(
      (setor) => setor.nome.toLowerCase() === inputElement.value.toLowerCase()
    );
  
    if (setorSelecionado) {
      this.setorId = setorSelecionado.id;
      this.tags = setorSelecionado.tags;
    } else {
      this.setorId = 0; // Define como null se nenhum setor for encontrado
      this.tags = [];
    }
  
    // Limpa as tags selecionadas ao alterar o setor
    this.tagsSelecionadas = [];
  }


 
  abrirModalGraficos(): void {
    this.graficosModal.abrirModal();
  }

  
}
