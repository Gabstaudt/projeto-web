import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet'; // Importação do Leaflet para o mapa
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  private map: any;
  private setores: Setor[] = []; 

  constructor(private entradaService: EntradaService) {}

  ngOnInit(): void {
    this.iniciarMapa();
    this.carregarSetores();
  }

  private iniciarMapa(): void {
    this.map = L.map('map').setView([-1.4558300, -48.5044400], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private carregarSetores(): void {
    const sessaoId = this.gerarSessaoId();
  
    this.entradaService.fazerSegundaRequisicao(sessaoId).subscribe(
      (resposta: ArrayBuffer) => {
        console.log('Resposta recebida da requisição:', resposta);
        const arrayBufferView = new Uint8Array(resposta);
        console.log("array buffer convertid", arrayBufferView)
  
        // Atualiza a lista de setores no serviço
        this.entradaService.parseSecondResponse(arrayBufferView);
      },
      error => {
        console.error('Erro ao carregar setores:', error);
      }
    );

    // Se inscreve nas atualizações da lista de setores
    this.entradaService.setores$.subscribe(setores => {
      this.adicionarPontosNoMapa(setores);
    });
  }

  private adicionarPontosNoMapa(setores: Setor[]): void {
    setores.forEach(setor => {
      const lat = setor.latitude;
      const lng = setor.longitude;

      console.log(`Adicionando ponto para o Setor ID ${setor.id}: lat=${lat}, lng=${lng}`);

      if (this.isValido(lat) && this.isValido(lng)) {
        const marker = L.marker([lat, lng]).addTo(this.map);
        marker.bindPopup(`<b>Setor ID:</b> ${setor.id}<br><b>Status:</b> ${setor.status}`).openPopup();
      } else {
        console.warn(`Coordenadas inválidas para o Setor ID ${setor.id}`);
      }
    });
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