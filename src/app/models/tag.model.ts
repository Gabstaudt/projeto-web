import {TipoTag} from './tipo.model'
import {converterLeitura} from './converter.model'
  
  export class Tag {
  // Propriedades da tag
  id: number; 
  nome: string; 
  descricao: string; 
  tipo: TipoTag; 
  max: number; 
  min: number;
  status: number; 
  vazia: boolean; 
  leituraInt: number; 
  leituraBool: boolean; 
  leituraFormatada: string;

  // Construtor da classe
  constructor() {
    this.id = 0; 
    this.nome = '';
    this.descricao = ''; 
    this.tipo = TipoTag.Booleano;
    this.max = 0; 
    this.min = 0;
    this.status = 0; 
    this.vazia = false;
    this.leituraInt = 0; 
    this.leituraBool = false; 
    this.leituraFormatada = ''
    

  }
  public lerValor(): number {
    if (this.tipo === TipoTag.Booleano) {
        console.log(`Tag ${this.nome} - Tipo: Booleano, Valor: ${this.leituraBool}`);
        return this.leituraBool ? 1 : 0; 
    } else if (this.tipo >= TipoTag.Vazao0 && this.tipo <= TipoTag.Abertura) {
        console.log(`Tag ${this.nome} - Tipo: Inteiro, Valor: ${this.leituraInt}`);
        return this.leituraInt; 
    }
    console.log(`Tag ${this.nome} - Tipo desconhecido`);
    return 0; 
}



  getDescricaoTipo(): string {
    switch (this.tipo) {
      case TipoTag.Booleano:
        return 'Valor:';
      case TipoTag.Vazao0:
        return 'Vazão:  ';
      case TipoTag.Vazao1:
        return 'Vazão: ';
      case TipoTag.Nivel:
        return 'Nível: ';
      case TipoTag.Pressao:
        return 'Pressão:';
      case TipoTag.Volume:
        return 'Volume: ';
      case TipoTag.Tensao:
        return 'Tensão: ';
      case TipoTag.Corrente:
        return 'Corrente: ';
      case TipoTag.Frequencia:
        return 'Frequência: ';
      case TipoTag.Abertura:
        return 'Abertura: ';
      default:
        return 'Tipo desconhecido';
    }

  }
  converterLeitura(valor: number): string {
    return converterLeitura(this.tipo, valor);
  }
}