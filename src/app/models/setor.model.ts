// setor.model.ts
import { Tag } from './tag.model'; 
import { Alarme } from './alarme.model'; 

export class Setor {
  id: number;
  nome: string;
  endereco: string; 
  latitude: number;
  longitude: number; 
  unidade: number; 
  subunidade: number;
  status: number; 
  tipo: number; 
  ultimoTempo: Date;
  tags: Tag[];  
  alarmes: Alarme[]; 

  constructor() {
    this.id = 0; // Inicializa com 0
    this.nome = ''; // Inicializa vazio
    this.endereco = ''; 
    this.latitude = 0.0;
    this.longitude = 0.0; 
    this.unidade = 0; 
    this.subunidade = 0;
    this.status = 0;
    this.tipo = 0; 
    this.ultimoTempo = new Date();
    this.tags = [];  // Inicializa como um array vazio
    this.alarmes = []; // Inicializa como um array vazio
  }
}
