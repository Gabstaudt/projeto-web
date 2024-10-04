import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet'; // importação do mapa
import{EntradaService} from '../services/auth/entrada.service';


interface EntradaData {
  comandoSupervisao: number;          //resposta 200 OK
  sessaoID: string;           
  comandoEstrutura: number;         
}
const loginData: EntradaData = {
  comandoSupervisao: 254,        //resposta 200 OK
  sessaoID: 'qualquer',           
  comandoEstrutura: 237
};

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class EntradaComponent implements OnInit {
  ngOnInit(): void {
    this.initMap();
  }

  initMap(): void {
    const map = L.map('map').setView([-15.7801, -47.9292], 4); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }
}
