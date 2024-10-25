import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet'; // Importação do Leaflet para o mapa
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';
import { Observable } from 'rxjs';
import { TagService } from '../services/tag/tag.service'; // Importando o TagService


@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  private map: any;
    private initialCoordinates = [-1.3849999904632568, -48.44940185546875]; 

  public setores$: Observable<Setor[]>;

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
  
  private carregarSetores(): void {
    const sessaoId = this.gerarSessaoId();
  
    this.entradaService.fazerSegundaRequisicao(sessaoId).subscribe(
      (resposta: ArrayBuffer) => {
        console.log('Resposta recebida da requisição:', resposta); // Log da resposta
        const arrayBufferView = new Uint8Array(resposta);
        console.log('ArrayBuffer convertido:', arrayBufferView); // Log do arrayBuffer
  
        this.entradaService.parseSecondResponse(arrayBufferView); 
  
        // Adiciona pontos no mapa após os setores serem atualizados
        this.setores$.subscribe(setores => {
          console.log('Setores recebidos no mapa:', setores); // Verifique aqui se a lista está vazia
  
          // Iterando sobre cada setor e suas tags para formatar a leitura
          setores.forEach(setor => {
            setor.tags.forEach(tag => {
              // Converte a leitura da tag e atribui à propriedade leituraFormatada
              tag.leituraFormatada = tag.converterLeitura(tag.leituraInt); 
            });
          });
  
          this.adicionarPontosNoMapa(setores);
        });
      },
      error => {
        console.error('Erro ao carregar setores:', error);
      }
    );
  }
  

  private adicionarPontosNoMapa(setores: Setor[]): void {
    setores.forEach(setor => {
        const lat = setor.latitude;
        const lng = setor.longitude;
        const status = setor.status; 
        const tags = setor.tags; 
        const nomeSetor = setor.nome; 

        let ultimoTempoFormatado: string;
        if (setor.ultimoTempo instanceof Date) {
            ultimoTempoFormatado = this.formatarData(setor.ultimoTempo);
        } else {
            ultimoTempoFormatado = 'Data inválida';
        }

        if (this.isValido(lat) && this.isValido(lng) && !(lat === 0 && lng === 0) && status !== 0) {
            const marker = L.marker([lat, lng]).addTo(this.map);
            
            let tagsString = '';
            if (tags && tags.length > 0) {
                tagsString = tags.filter(tag => !tag.vazia)
                .map(tag => {
                    const valorFinal = tag.lerValor();
                    console.log(`Valor final da tag ${tag.nome}:`, valorFinal); // Log do valor final
                    return `<a>${tag.nome}</a>: ${valorFinal}`;
                })
                .join('<br>');

                // Log das tags antes de serem adicionadas ao popup
                console.log(`Tags para o setor ${nomeSetor}:`, tagsString);
            }

            // Criando popup
            marker.bindPopup(`
                <div class="leaflet-popup-content">
                    <b>Setor:</b> ${nomeSetor}<br>
                    <b>Último Tempo:</b> ${ultimoTempoFormatado}<br>
                    <b>Tags:</b>
                    <ul>${tagsString || '<li>Nenhuma tag disponível</li>'}</ul>
                </div>
            `).openPopup();
        } else {
            console.log(`Setor ${nomeSetor} não é válido para exibição: (lat: ${lat}, lng: ${lng}, status: ${status})`);
        }
    });
}



  
  
  //função pra exibir a data
  
  private formatarData(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0'); 
    const ano = data.getFullYear();
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    const segundos = data.getSeconds().toString().padStart(2, '0');
  
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  }
  
  
  
  

  private isValido(coordenada: number): boolean {
    return typeof coordenada === 'number' && !isNaN(coordenada);
  }


  // sessão id tanto fazz
  gerarSessaoId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let sessaoId = '';
    for (let i = 0; i < 32; i++) {
      sessaoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sessaoId;
  }

  // Função para enviar a requisição de teste
  fazerRequisicaoTeste(): void {
    const sessaoIdAleatoria = this.gerarSessaoId(); //sess id tanto faz

    // fz a segunda 
    this.entradaService.fazerSegundaRequisicao(sessaoIdAleatoria).subscribe({
      next: (response) => {
        console.log('Resposta recebida:', response); 
      },
      error: (error) => {
        console.error('Erro na requisição de teste:', error); 
      }
    });
  }
}