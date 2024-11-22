import { AfterViewInit, Component,ElementRef, ViewChild, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';
import { Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TipoTag } from '../models/tipo.model';
import biri from 'biri';
import { Router } from '@angular/router';
import { TerceiraRequisicaoService } from '../services/authdados/dados.service';
import { interval, Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { encodeWithLength } from '../utils/encoder.utils';


@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements AfterViewInit, OnDestroy {
  private subscription: Subscription | null = null;
  private readonly servidorUrl = 'http://172.74.0.167:8043/dados';
  @ViewChild('percentageText', { static: false }) percentageText!: ElementRef;

  private map: any;
  public setores$: Observable<Setor[]>;
  public searchTerm: string = ''; 
  public setoresFiltrados: Setor[] = []; 
  public activePopup: string | null = null; 
  isSidebarOpen = false;
  exibirResultados: boolean = false;

  conteudoSelecionado: string = 'principal'; // Inicialmente, exibindo o mapa

  nivelAgua: number = 0; 
  // Lista global com setores organizados por unidade
  public listaGlobal: { [key: string]: Setor[] } = {
    producao: [],
    unsul: [],
    unbr: [],
    unnorte: [],
    unam: [],
    unne: [],
    uste: []
  };

  constructor(private entradaService: EntradaService, private http: HttpClient, private router: Router,     private terceiraRequisicaoService: TerceiraRequisicaoService
  ) {
    this.setores$ = this.entradaService.setores$;
  }

  ngAfterViewInit(): void {
    // Inicializa o mapa e carrega os setores quando a visualização está pronta
    if (this.conteudoSelecionado === 'principal') {
      this.iniciarMapa();
    }
    this.carregarSetores();

    this.iniciarRequisicoesPeriodicas();

    this.atualizarNivelAgua();
  }

  private iniciarMapa(): void {
    this.map = L.map('map').setView([-1.3849999904632568, -48.44940185546875], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    console.log('Mapa inicializado com sucesso'); 
  }

  filtrarSetores(): void {
    if (this.searchTerm.trim() === '') {
      // Se o termo de pesquisa estiver vazio, oculta a lista de resultados
      this.exibirResultados = false;
      this.setoresFiltrados = [];
      return;
    }
    // Filtra setores com base no termo de pesquisa
    this.setores$.subscribe(setores => {
      this.setoresFiltrados = setores.filter(setor =>
        setor.nome.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      // Exibe a lista de resultados se houver correspondências
      this.exibirResultados = this.setoresFiltrados.length > 0;
    });
  }
//////////////////popup de pesquisa//////////////////////
public exibirPopupSetor(setor: Setor): void {
  const nomeSetor = setor.nome || `Setor ${setor.id}`;
  const ultimoTempoFormatado = setor.ultimoTempo ? this.formatarData(new Date(setor.ultimoTempo)) : 'Data não disponível';

  const inteirosString = setor.tags
      .filter(tag => tag.tipo !== TipoTag.Booleano && !tag.vazia)
      .map(tag => `<li>${tag.nome}: ${tag.converterLeitura(tag.leituraInt)}</li>`)
      .join('');

  const booleanosString = setor.tags
      .filter(tag => tag.tipo === TipoTag.Booleano && !tag.vazia)
      .map(tag => `<li>${tag.nome}: ${tag.converterLeitura(tag.leituraBool ? 1 : 0)}</li>`)
      .join('');

  const popupContent = `
      <div class="leaflet-popup-content">
          <b>Setor:</b> ${nomeSetor}<br>
          <b>Último Tempo:</b> ${ultimoTempoFormatado}<br>
          <ul>${inteirosString || ''}</ul>
          <ul>${booleanosString || ''}</ul>
      </div>
  `;

  L.popup()
    .setLatLng([setor.latitude, setor.longitude])
    .setContent(popupContent)
    .openOn(this.map);

  this.exibirResultados = false; // Fecha a lista após exibir o popup
}
///////////////////////////////////////////////////////////////
private carregarSetores(): void {
  const sessaoId = this.obterSessaoIdDoLocalStorage();
  if (!sessaoId) {
    console.error('Sessão não encontrada. Não é possível fazer as requisições.');
    return;
  }

  this.entradaService.fazerSegundaRequisicao().pipe(
    switchMap(() => {
      console.log('Estrutura carregada. Iniciando requisição de dados...');
      return this.terceiraRequisicaoService.enviarComandoSalvar();
    })
  ).subscribe({
    next: () => {
      console.log('Requisição de dados concluída com sucesso.');
      const setoresInterpretados = this.entradaService.listaGlobal;
      if (setoresInterpretados && setoresInterpretados.length > 0) {
        this.adicionarPontosNoMapa(setoresInterpretados);
        console.log("Setores adicionados ao mapa com sucesso após a requisição de dados.");
      } else {
        console.warn("Nenhum setor disponível para exibição no mapa após a requisição de dados.");
      }
    },
    error: (error) => {
      console.error('Erro ao carregar estrutura ou dados:', error);
    }
  });
}

  private adicionarPontosNoMapa(setores: Setor[]): void {
    setores.forEach(setor => {
        console.log(`Setor ID ${setor.id}, Nome: ${setor.nome}, Último Tempo recebido aqui: ${setor.ultimoTempo}`);

        const lat = setor.latitude;
        const lng = setor.longitude;
        const status = setor.status;
        const nomeSetor = setor.nome || `Setor ${setor.id}`;

        const tempoSetor = setor.ultimoTempo ? new Date(setor.ultimoTempo).getTime() : 0;
        let ultimoTempoFormatado: string;

        if (tempoSetor > 0) {
            ultimoTempoFormatado = this.formatarData(new Date(tempoSetor));
        } else {
            console.warn(`Setor ${nomeSetor} não possui um Último Tempo válido.`);
            ultimoTempoFormatado = 'Tempo não disponível';
        }

        if (this.isValido(lat) && this.isValido(lng) && lat !== 0 && lng !== 0 && status !== 0) {
            const iconeUrl = this.definirIcone(setor);

            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: iconeUrl,
                    iconSize: [35, 35],
                    iconAnchor: [16, 32]
                })
            }).addTo(this.map);

            const inteirosString = setor.tags
                .filter(tag => tag.tipo !== TipoTag.Booleano && !tag.vazia)
                .map(tag => {
                    console.log("Exibindo Tag Inteira no Mapa:", tag.nome, "Vazia:", tag.vazia, "Valor:", tag.leituraInt);
                    return `<li>${tag.nome}: ${tag.converterLeitura(tag.leituraInt)}</li>`;
                })
                .join('');

            const booleanosString = setor.tags
                .filter(tag => tag.tipo === TipoTag.Booleano && !tag.vazia)
                .map(tag => {
                    console.log("Exibindo Tag Booleana no Mapa:", tag.nome, "Vazia:", tag.vazia, "Valor:", tag.leituraBool);
                    return `<li>${tag.nome}: ${tag.converterLeitura(tag.leituraBool ? 1 : 0)}</li>`;
                })
                .join('');

            const popupContent = `
                <div class="leaflet-popup-content">
                    <b>Setor:</b> ${nomeSetor}<br>
                    <b>Último Tempo:</b> ${ultimoTempoFormatado}<br>
                    <ul>${inteirosString || ''}</ul>
                    <ul>${booleanosString || ''}</ul>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
        }
    });
}
private formatarData(data: Date): string {
    return isNaN(data.getTime())
        ? 'Data inválida'
        : `${data.getDate().toString().padStart(2, '0')}/` +
          `${(data.getMonth() + 1).toString().padStart(2, '0')}/` +
          `${data.getFullYear()} ` +
          `${data.getHours().toString().padStart(2, '0')}:` +
          `${data.getMinutes().toString().padStart(2, '0')}:` +
          `${data.getSeconds().toString().padStart(2, '0')}`;
}

  private isValido(coordenada: number): boolean {
    return typeof coordenada === 'number' && !isNaN(coordenada);
  }

  public gerarSessaoId(): string {
    return biri(); // Gera um ID aleatório 
}

  togglePopup(popup: string): void {
    this.activePopup = this.activePopup === popup ? null : popup;
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;

    const navbar = document.querySelector('.navbar') as HTMLElement;
    const sidebar = document.querySelector('.sidebar-right') as HTMLElement;

    if (this.isSidebarOpen) {
        navbar.classList.add('hidden'); // Oculta a navbar
        sidebar.classList.add('sidebar-open'); 
    } else {
        navbar.classList.remove('hidden'); 
        sidebar.classList.remove('sidebar-open'); 
    }
}
  toggleSearchResults(): void {
    this.exibirResultados = !this.exibirResultados;
  }

/////////////////////////////////////////////////////////exibição de acordo com a navegação da navbar////////////////////////////////////////////////////////////////////////////

  mostrarConteudo(secao: string) {
    console.log(`Seção selecionada: ${secao}`);
    this.conteudoSelecionado = secao;

    if (secao === 'principal') {
      setTimeout(() => {
        this.reiniciarMapa(); // Inicializa ou recria o mapa
        this.carregarSetores(); 
        // this.carregarEstruturaEDados();
      });
    } else {
      this.destruirMapa(); // "Destrói" o mapa quando sai da seção principal
    }
  }
   private reiniciarMapa(): void {
    // Remove o mapa se ele já existir e cria um novo
    if (this.map) {
      this.map.remove(); 
      this.map = null; 
    }
    this.iniciarMapa();  
  }

  private destruirMapa(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  /////////////////////////////////////////////////////////////////Função que atualiza o SVG//////////////////////////////////////////////////////////////////////////////////////////////////
  atualizarNivelAgua(): void {
    const waterLevelElement = document.getElementById('water-level');
    if (waterLevelElement) {
      console.log('Elemento water-level encontrado:', waterLevelElement); 

     
      const alturaMaxima = 198; // Altura máxima 
      const posicaoYSuperior = 51; 

      // Calcula a nova altura com base na porcentagem do nível da água
      const novaAltura = (this.nivelAgua / 100) * alturaMaxima;

      // Ajusta a posição Y para que a água cresça de baixo para cima
      const novaPosicaoY = posicaoYSuperior + (alturaMaxima - novaAltura);

      // Atualiza height e y do nível da água
      waterLevelElement.setAttribute('height', novaAltura.toString());
      waterLevelElement.setAttribute('y', novaPosicaoY.toString());

      console.log(`Altura da água: ${novaAltura}, Posição Y: ${novaPosicaoY}`); 
    } else {
      console.error('Elemento water-level não encontrado no DOM.');
    }

    // Atualiza o valor de porcentagem no texto
    if (this.percentageText) {
      this.percentageText.nativeElement.textContent = `${this.nivelAgua}%`;
    }
  }

  aumentarNivelAgua(): void {
    if (this.nivelAgua < 100) {
      this.nivelAgua += 5; // 
      this.atualizarNivelAgua();
    }
  }

  diminuirNivelAgua(): void {
    if (this.nivelAgua > 0) {
      this.nivelAgua -= 5; 
      this.atualizarNivelAgua();
    }
  }
///////////////////////////////////////////////////////////////////////////////Função para o logout////////////////////////////////////////////////////////////////////////////////////////////////
logout(): void {
  const sessaoId = this.obterSessaoIdDoLocalStorage();
  if (!sessaoId) {
    console.error('Sessão ID ausente no localStorage. Não é possível realizar o logout.');
    this.finalizarLogout();
    return;
  }

  const headers = new HttpHeaders({ 'Content-Type': 'application/octet-stream' });
  const comandoSupervisao = 254;
  const comandoLogout = 239;

  const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoLogout);

  this.http.post(this.servidorUrl, body, { headers, responseType: 'arraybuffer' }).subscribe({
    next: () => {
      this.finalizarLogout(); // Realiza o logout local
    },
    error: (error) => {
      console.error('Erro ao enviar comando de logout:', error);
      this.finalizarLogout(); // Realiza o logout local independente do erro
    }
  });
}

// Função para finalizar o logout
private finalizarLogout(): void {
  localStorage.clear(); 
  this.router.navigate(['/login']); 
}


///// funções auxiliares para o logout
private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoLogout: number): ArrayBuffer {
  const sessaoIdBytes = encodeWithLength(sessaoId); 

  const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]); 
  const comandoLogoutBytes = new Uint8Array([comandoLogout]);

  // Combina todos os bytes 
  const combinedBytes = new Uint8Array(
    comandoSupervisaoBytes.length + sessaoIdBytes.length + comandoLogoutBytes.length
  );

  combinedBytes.set(comandoSupervisaoBytes, 0); 
  combinedBytes.set(sessaoIdBytes, comandoSupervisaoBytes.length); 
  combinedBytes.set(comandoLogoutBytes, comandoSupervisaoBytes.length + sessaoIdBytes.length);

  return combinedBytes.buffer; 
}


  /////////////////////////////////////////////////////Função para realizar as requisições de forma periódica (60seg)///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  private iniciarRequisicoesPeriodicas(): void {
    const sessaoId = this.obterSessaoIdDoLocalStorage();
    if (!sessaoId) {
      console.error('Sessão não encontrada. Não é possível fazer as requisições.');
      return;
    }
  
    this.subscription = interval(60000) 
      .pipe(
        switchMap(() => {
          console.log('Executando requisição de dados...');
          return this.terceiraRequisicaoService.enviarComandoSalvar();
        })
      )
      .subscribe({
        next: () => {
          console.log('Requisição de dados concluída com sucesso.');
          const setoresInterpretados = this.entradaService.listaGlobal;
          if (setoresInterpretados && setoresInterpretados.length > 0) {
            this.adicionarPontosNoMapa(setoresInterpretados);
          } else {
            console.warn('Nenhum setor disponível para exibição no mapa após a requisição de dados.');
          }
        },
        error: (error) => {
          console.error('Erro na requisição de dados:', error);
        }
      });
  }
  
  ngOnDestroy(): void {
    // Cancela a inscrição no intervalo ao destruir o componente
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
//////////////////////////////////////////////////////////////////função para trocar a cor do ícone////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  definirIcone(setor: Setor): string {
    const agora = new Date(); 
    const cincoMinutos = 5 * 60 * 1000; 

    // Verifica o status do setor
    if (setor.status === 2) {
      return '../../assets/image/icon/iconelaranja.svg'; 
    }

    // Verifica se o último tempo recebido é superior a 5 minutos comparado ao tempo atual
    const tempoSetor = setor.ultimoTempo ? new Date(setor.ultimoTempo).getTime() : 0;
    if (agora.getTime() - tempoSetor > cincoMinutos) {
      return '../../assets/image/icon/iconevermelho.svg'; 
    }
    
    return '../../assets/image/icon/iconeverde.svg'; 
  }

  private obterSessaoIdDoLocalStorage(): string | null {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const dadosUsuario = JSON.parse(usuario);
      return dadosUsuario.SessaoID || null; // Retorna o SessaoID ou null se não existir
    }
    return null;
  }
  

}
