import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet'; // Importação do Leaflet para o mapa
import { EntradaService } from '../services/auth/entrada.service';
import { Alarme } from '../models/alarme.model';
import { Setor } from '../models/setor.model';
import { Tag } from '../models/tag.model';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  
  
  constructor(private entradaService: EntradaService) {}
  map!: L.Map; 

  // Array 
  coordinates: { name: string; lat: number; lng: number }[] = [
    { name: 'ATNT', lat: -15.7801, lng: -47.9292 },
    { name: 'ADAS', lat: -15.7801, lng: -47.9292},
    { name: 'ADAS', lat: -15.7801, lng: -47.9292 },
    { name: 'SADAS', lat: -15.7801, lng: -47.9292 }
  ];

  ngOnInit(): void {
    this.initMap();
  }

  initMap(): void {
    this.map = L.map('map').setView([-15.7801, -47.9292], 4); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // marcadores para cada coordenada
    this.coordinates.forEach(coord => {
      this.addMarker(coord.lat, coord.lng, coord.name);
    });
  }

  // adicionar um marcador ao mapa
  addMarker(lat: number, lng: number, name: string): void {
    const marker = L.marker([lat, lng]).addTo(this.map);
    marker.bindPopup(name); // Exibe o nome no popup
  }


  /////////////////////////////////////////////////////////////////////////
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
