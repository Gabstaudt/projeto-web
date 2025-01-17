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
  @Output() fechar = new EventEmitter<void>();
  @ViewChild('graficosModal') graficosModal!: GraficosModalComponent;

  @Output() abrirGraficos = new EventEmitter<{
    setorNome: string;
    dadosInteiras: { tempo: any; valores: { nome: string; valor: any }[] }[];
    dadosBooleanas: { tempo: any; valores: { nome: string; estado: any }[] }[];
  }>();

  limiteTagsInteirasAtingido: boolean = false; 

  erroMensagem: string | null = null;

  tags: Tag[] = []; 
  setores: Setor[] = [];
  selectedTags: number[] = []; 

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


  filtroSetor: string = ''; 
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

  isCarregando: boolean = false; 

  setorSelecionado: any;
  intervalo: { inicio: string; fim: string } = { inicio: '', fim: '' };

  constructor(
    private entradaService: EntradaService,
    private historicoService: HistoricoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.setores = this.entradaService.listaGlobal || [];
    console.log('Setores carregados:', this.setores);
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
  
    // Atualiza o setor selecionado
    this.setorId = selectedSetorId;
  
    // Encontra o setor selecionado e suas tags
    const setorSelecionado = this.setores.find(setor => setor.id === this.setorId);
    this.tags = setorSelecionado ? setorSelecionado.tags : [];
  
    // Limpa as tags selecionadas
    this.tagsSelecionadas = [];
    this.separarTagsSelecionadas(); // Atualiza as listas de tags inteiras e booleanas
  
    // Limpa os dados da consulta (tabela e gráficos)
    this.dadosHistorico = [];
    this.tagsInteirasSelecionadas = [];
    this.tagsBooleanasSelecionadas = [];
    this.limiteTagsInteirasAtingido = false;
  
    console.log('Setor alterado. Tags e dados históricos limpos.');
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
  
    // Iniciar estado de carregamento
    this.isCarregando = true;
  
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
        complete: () => {
          // Finalizar estado de carregamento
          this.isCarregando = false;
        },
      });
  }
  
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  isTagSelecionada(tagId: number): boolean {
    return this.tagsSelecionadas.some(tag => tag.id === tagId);
  }
  
  

  // Alterna a seleção de tags
  toggleTagSelection(tag: Tag): void {
    const index = this.tagsSelecionadas.findIndex(t => t.id === tag.id);
  
    if (index === -1) {
      if (tag.tipo !== 0 && this.tagsInteirasSelecionadas.length >= 6) {
        this.erroMensagem = 'Você só pode selecionar até 6 tags inteiras.';
        return;
      }
  
      this.tagsSelecionadas.push(tag); 
      this.erroMensagem = null; 
    } else {
      this.tagsSelecionadas.splice(index, 1); 
      this.erroMensagem = null; 
    }
  
    this.separarTagsSelecionadas(); 
    console.log('Tags Selecionadas:', this.tagsSelecionadas);
  }
  
  
  
  
  separarTagsSelecionadas() {
    this.tagsInteirasSelecionadas = this.tagsSelecionadas
      .filter(tag => tag.tipo !== 0)
      .map(tag => tag.id);
  
    this.tagsBooleanasSelecionadas = this.tagsSelecionadas
      .filter(tag => tag.tipo === 0) 
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
    const ultimoDia = new Date(anoAtual, mes.numero, 0).getDate(); 
    this.dataFim = `${anoAtual}-${String(mes.numero).padStart(2, '0')}-${ultimoDia}`;
    this.horaFim = '23:59';
    this.mostrarModalMes = false; // Fecha o modal
    console.log(`Mês selecionado: ${mes.nome}`);
  }

  onSetorInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const filtro = inputElement.value.toLowerCase();
  
    const setorSelecionado = this.setores.find(
      (setor) => setor.nome.toLowerCase().includes(filtro)
    );
  
    if (setorSelecionado) {
      this.setorId = setorSelecionado.id;
      this.tags = setorSelecionado.tags;
      console.log('Setor encontrado:', setorSelecionado);
    } else {
      this.setorId = 0; 
      this.tags = [];
      console.log('Nenhum setor encontrado para o filtro:', filtro);
    }
  
    this.cdr.detectChanges(); // Atualiza o template
  }
  

///////////////////////modal gráfico////////////////

abrirModalGraficos(): void {
  const setorNome = this.setores.find(setor => setor.id === this.setorId)?.nome || 'Setor não identificado';

  const dadosInteiras = this.dadosHistorico.map(registro => ({
    tempo: registro.tempoInformacao || 'N/A',
    valores: this.tagsInteirasSelecionadas.map(tagId => {
      const tag = this.tags.find(tag => tag.id === tagId);
      return {
        nome: tag?.nome || `Tag Inteira ${tagId}`,
        valor: registro[tag?.nome || `Tag Inteira ${tagId}`] || 0,
      };
    }),
  }));

  const dadosBooleanas = this.dadosHistorico.map(registro => ({
    tempo: registro.tempoInformacao || 'N/A',
    valores: this.tagsBooleanasSelecionadas.map(tagId => {
      const tag = this.tags.find(tag => tag.id === tagId);
      return {
        nome: tag?.nome || `Tag Booleana ${tagId}`,
        estado: registro[tag?.nome || `Tag Booleana ${tagId}`] === 'Ligado' ? 'Ligado' : 'Desligado',
      };
    }),
  }));

  const dadosGrafico = { setorNome, dadosInteiras, dadosBooleanas };

  this.entradaService.setDadosGrafico(dadosGrafico);
  console.log('Dados enviados para o modal de gráficos:', dadosGrafico);

  // Abre o modal
  this.entradaService.abrirModalGraficos();
}





selecionarTodasTags(): void {
  this.tagsSelecionadas = [];
  this.erroMensagem = null;

  let contadorInteiras = 0;

  this.tags.forEach(tag => {
    if (tag.tipo !== 0) {
      // Adiciona tags inteiras até o limite de 6
      if (contadorInteiras < 6) {
        this.tagsSelecionadas.push(tag);
        contadorInteiras++;
      }
    } else {
      // Adiciona todas as tags booleanas
      this.tagsSelecionadas.push(tag);
    }
  });

  this.separarTagsSelecionadas();
  this.limiteTagsInteirasAtingido = contadorInteiras >= 6;
}

desmarcarTodasTags(): void {
  this.tagsSelecionadas = [];
  this.separarTagsSelecionadas();
  this.erroMensagem = null;
  this.limiteTagsInteirasAtingido = false;
}






}