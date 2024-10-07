export class Alarme {
  id: number;
  idSetor: number;
  idTag: number;
  nome: string;
  tipo: number;
  valorEntrada: number;
  valorSaida: number;
  ativo: boolean;
  adicionado: boolean;
  reconhecido: boolean;
  registrado: boolean;

  constructor() {
    this.id = 0;
    this.idSetor = 0;
    this.idTag = 0;
    this.nome = '';
    this.tipo = 0;
    this.valorEntrada = 0;
    this.valorSaida = 0;
    this.ativo = false;
    this.adicionado = false;
    this.reconhecido = false;
    this.registrado = false;
  }
}
