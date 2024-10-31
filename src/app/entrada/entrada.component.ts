import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { EntradaService } from '../services/auth/entrada.service';
import { Setor } from '../models/setor.model';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TipoTag } from '../models/tipo.model';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  private map: any;

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

    this.entradaService.fazerSegundaRequisicao(sessaoId).pipe(
      switchMap((resposta: ArrayBuffer) => {
        console.log('Resposta recebida da requisição:', resposta);
        const arrayBufferView = new Uint8Array(resposta);
        console.log('ArrayBuffer convertido:', arrayBufferView);

        this.entradaService.parseSecondResponse(arrayBufferView);

        return this.setores$;
      })
    ).subscribe(setores => {
      console.log('Setores recebidos no mapa:', setores);
      this.adicionarPontosNoMapa(setores);
    }, error => {
      console.error('Erro ao carregar setores:', error);
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
                    <b>Inteiros:</b>
                    <ul>${inteirosString || '<li>Nenhuma tag inteira disponível</li>'}</ul>
                    <b>Booleanos:</b>
                    <ul>${booleanosString || '<li>Nenhuma tag booleana disponível</li>'}</ul>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
        }
    });
}




private formatarData(data: Date): string {
    if (isNaN(data.getTime())) {
        return 'Data inválida';
    }

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

  gerarSessaoId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let sessaoId = '';
    for (let i = 0; i < 32; i++) {
      sessaoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sessaoId;
  }
  fazerRequisicaoTeste(): void {
    const sessaoIdAleatoria = this.gerarSessaoId();

    this.entradaService.fazerSegundaRequisicao(sessaoIdAleatoria).subscribe({
        next: (response) => {
            console.log('Resposta recebida e interpretada:', response);

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
}
