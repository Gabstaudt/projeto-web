import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TipoTag } from '../models/tipo.model';
import biri from 'biri';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  private map: any;
  public setores$: Observable<Setor[]>;
  public searchTerm: string = ''; 
  public setoresFiltrados: Setor[] = []; 
  public activePopup: string | null = null; 
  isSidebarOpen = false;
  exibirResultados: boolean = false;

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

  constructor(private entradaService: EntradaService) {
    this.setores$ = this.entradaService.setores$;
  }

  ngOnInit(): void {
    this.iniciarMapa();
    this.carregarSetores();
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


  private getUnidadeDoSetor(setor: Setor): string | null {
    if (setor.nome.includes('EAB') || setor.nome.includes('Lago')) return 'producao';
    if (setor.nome.includes('São Brás') || (parseInt(setor.nome) >= 1 && parseInt(setor.nome) <= 8)) return 'unsul';
    if (setor.nome.includes('Cidade Nova') || setor.nome.includes('Ananindeua') || setor.nome.includes('Marituba')) return 'unbr';
    if (setor.nome.includes('Reservatório C3') || setor.nome.includes('Marambaia') || setor.nome.includes('CDP') || setor.nome.includes('5º Setor')) return 'unnorte';
    if (setor.nome.includes('Bengui') || setor.nome.includes('Catalina') || setor.nome.includes('Tenoné') || setor.nome.includes('Icoaraci') || setor.nome.includes('Águas Negras') || setor.nome.includes('São Roque') || setor.nome.includes('Mosqueiro') || setor.nome.includes('Carananduba') || setor.nome.includes('Outeiro')) return 'unam';
    if (setor.nome.includes('Inhangapi')) return 'unne';
    if (setor.nome.includes('Bengui V') || setor.nome.includes('Bougainville')) return 'uste';
    return null;
  }

  togglePopup(popup: string): void {
    this.activePopup = this.activePopup === popup ? null : popup;
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen; // Alterna o estado da sidebar

    const navbar = document.querySelector('.navbar') as HTMLElement;
    const sidebar = document.querySelector('.sidebar-right') as HTMLElement;

    if (this.isSidebarOpen) {
        navbar.classList.add('hidden'); // Oculta a navbar
        sidebar.classList.add('sidebar-open'); // Adiciona a classe para mostrar a sidebar
    } else {
        navbar.classList.remove('hidden'); // Mostra a navbar novamente
        sidebar.classList.remove('sidebar-open'); // Remove a classe para esconder a sidebar
    }
}




  toggleSearchResults(): void {
    this.exibirResultados = !this.exibirResultados;
  }
 
}
