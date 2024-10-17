export class Alarme {
  id: number;
  idSetor: number;
  idTag: number;
  nome: string;
  descricao: string;
  tipo: number;
  valorEntrada: number;
  valorSaida: number;
  ativo: number;
  adicionado: boolean;
  reconhecido: boolean;
  registrado: boolean;
  tempo: Date;

  constructor() {
    this.id = 0;
    this.idSetor = 0;
    this.idTag = 0;
    this.nome = '';
    this.descricao = ''; 
    this.tipo = 0;
    this.valorEntrada = 0;
    this.valorSaida = 0;
    this.ativo = 0;
    this.adicionado = false;
    this.reconhecido = false;
    this.registrado = false;
    this.tempo = new Date();

  }
}
