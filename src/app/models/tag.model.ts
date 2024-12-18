import { TipoTag } from './tipo.model';
import { converterLeitura } from './converter.model';

export class Tag {
  // Propriedades da tag
  id: number;
  nome: string;
  descricao: string;
  tipo: TipoTag;
  max: number;
  min: number;
  status: number;
  vazia: boolean = true; // Inicializa como true
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
    this.leituraInt = 0;
    this.leituraBool = false;
    this.leituraFormatada = '';
  }

  // Atualiza o valor e marca 'vazia' como false ao receber dados
  public atualizarValor(valor: number | boolean): void {
    this.vazia = false; // Marca como não vazia ao receber dados
    console.log(`Atualizando Tag ${this.nome} - vazia: ${this.vazia}, valor recebido:`, valor);

    if (this.tipo === TipoTag.Booleano) {
      this.leituraBool = valor === 1;
    } else {
      this.leituraInt = valor as number;
    }

    this.leituraFormatada = this.converterLeitura(this.lerValor());
  }

  public lerValor(): number {
    if (this.tipo === TipoTag.Booleano) {
      return this.leituraBool ? 1 : 0;
    } else if (this.tipo >= TipoTag.Vazao0 && this.tipo <= TipoTag.Abertura) {
      return this.leituraInt;
    }
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

  get unidadeMedida(): string {
    switch (this.tipo) {
      case TipoTag.Booleano:
        return ''; // Sem unidade
      case TipoTag.Vazao0:
      case TipoTag.Vazao1:
        return 'L/s';
      case TipoTag.Nivel:
        return 'm';
      case TipoTag.Pressao:
        return 'mca';
      case TipoTag.Volume:
        return 'm³';
      case TipoTag.Tensao:
        return 'V';
      case TipoTag.Corrente:
        return 'A';
      case TipoTag.Frequencia:
        return 'Hz';
      case TipoTag.Abertura:
        return '%';
      default:
        return '';
    }
  }
}
