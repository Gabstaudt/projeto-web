import { AfterViewInit, Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TipoTag } from '../models/tipo.model';
import biri from 'biri';
import { Router } from '@angular/router';
import { TerceiraRequisicaoService } from '../services/authdados/dados.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements AfterViewInit, OnDestroy {
  private subscription: Subscription | null = null;

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

  constructor(private entradaService: EntradaService,  private router: Router,     private terceiraRequisicaoService: TerceiraRequisicaoService
  ) {
    this.setores$ = this.entradaService.setores$;
  }

 

  ngAfterViewInit(): void {
    // Inicializa o mapa e carrega os setores quando a visualização está pronta
    if (this.conteudoSelecionado === 'principal') {
      this.iniciarMapa();
    }
    this.carregarEstruturaEDados()
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
    const sessaoIdAleatoria = this.gerarSessaoId();
    this.entradaService.fazerSegundaRequisicao(sessaoIdAleatoria).subscribe({
      next: (response) => {
        const setoresInterpretados = this.entradaService.listaGlobal;
        if (setoresInterpretados && setoresInterpretados.length > 0) {
          this.adicionarPontosNoMapa(setoresInterpretados);
          console.log("Setores adicionados ao mapa com sucesso.");
        } else {
          console.warn("Nenhum setor disponível para exibição no mapa.");
        }
      },
      error: (error) => {
        console.error('Erro na requisição de teste:', error);
      }
    });
  }











 private adicionarPontosNoMapa(setores: Setor[]): void {
    setores.forEach(setor => {
        const lat = setor.latitude;
        const lng = setor.longitude;
        const status = setor.status;
        const nomeSetor = setor.nome || `Setor ${setor.id}`;

        let ultimoTempoFormatado: string;
        
        if (setor.ultimoTempo) {
            const data = new Date(setor.ultimoTempo);
            ultimoTempoFormatado = this.formatarData(data);
        } else {
            const dataPadrao = new Date(); 
            ultimoTempoFormatado = this.formatarData(dataPadrao); 
        }

        if (this.isValido(lat) && this.isValido(lng) && lat !== 0 && lng !== 0 && status !== 0) {
            const marker = L.marker([lat, lng]).addTo(this.map);

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
    return isNaN(data.getTime()) ? 'Data inválida' : 
      `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()} ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}:${data.getSeconds().toString().padStart(2, '0')}`;
  }

  private isValido(coordenada: number): boolean {
    return typeof coordenada === 'number' && !isNaN(coordenada);
  }

  public gerarSessaoId(): string {
    return biri(); // Gera um ID aleatório usando a biblioteca biri
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



  mostrarConteudo(secao: string) {
    console.log(`Seção selecionada: ${secao}`);
    this.conteudoSelecionado = secao;

    if (secao === 'principal') {
      setTimeout(() => {
        this.reiniciarMapa(); // Inicializa ou recria o mapa
        this.carregarSetores(); 
        this.carregarEstruturaEDados();
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

  ////////////////////////////////////////////////////////
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  logout() {
    localStorage.clear();  
    this.router.navigate(['/login']); 
  }

  private carregarEstruturaEDados(): void {
    const sessaoId = localStorage.getItem('SessaoID'); 
  
    if (!sessaoId) {
      console.error('Sessão não encontrada. Não é possível fazer as requisições.');
      return;
    }
  
    // Encadeia as requisições
    this.entradaService.fazerSegundaRequisicao(sessaoId).pipe(
      switchMap(() => {
        console.log('Estrutura carregada. Iniciando requisição de dados...');
        return this.terceiraRequisicaoService.enviarComandoSalvar(sessaoId); 
      })
    ).subscribe({
      next: () => {
        console.log('Requisição de dados concluída com sucesso.');
        // Atualiza o mapa com a lista global após a terceira requisição
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
  
  private iniciarRequisicoesPeriodicas(): void {
    const sessaoId = localStorage.getItem('SessaoID'); 

    if (!sessaoId) {
      console.error('Sessão não encontrada. Não é possível fazer as requisições.');
      return;
    }

    // requisição de dados a cada 1 minuto
    this.subscription = interval(60000) 
      .pipe(
        switchMap(() => {
          console.log('Executando requisição de dados...');
          return this.terceiraRequisicaoService.enviarComandoSalvar(sessaoId);
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


}
