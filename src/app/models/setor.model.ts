import { Tag } from './tag.model'; 
import { Alarme } from './alarme.model'; 

//obj
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
  tags: Map<number, Tag>; 
  alarmes: Map<number, Alarme>;


  // Construtor da classe
  constructor() {
    this.id = 0; // inicio 0
    this.nome = ''; // inicio vazio
    this.endereco = ''; 
    this.latitude = 0.0;
    this.longitude = 0.0; 
    this.unidade = 0; 
    this.subunidade = 0;
    this.status = 0;
    this.tipo = 0; 
    this.ultimoTempo = new Date();
    this.tags = new Map();
    this.alarmes = new Map();
  }
}
