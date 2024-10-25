import { TipoTag } from './tipo.model'; 

export function converterLeitura(tagTipo: TipoTag, valor: number): string {
 
  console.log('Valores recebidos - tagTipo:', tagTipo, ', valor:', valor);
  switch (tagTipo) {
    

    case TipoTag.Booleano:
      return valor === 0 ? 'Desligada' : 'Ligada';
    case TipoTag.Vazao0:
      return `${valor.toFixed(0)} m³/h`; 
    case TipoTag.Vazao1:
      return `${valor.toFixed(2)} m³/h`; 
    case TipoTag.Nivel:
      return `${valor.toFixed(2)} m`; 
    case TipoTag.Pressao:
      return `${valor.toFixed(2)} mca`; 
    case TipoTag.Volume:
      return `${valor.toFixed(0)} m³`; 
    case TipoTag.Tensao:
      return `${valor.toFixed(0)} V`;
    case TipoTag.Corrente:
      return `${valor.toFixed(0)} A`; 
    case TipoTag.Frequencia:
      return `${valor.toFixed(0)} Hz`; 
    case TipoTag.Abertura:
      return `${valor.toFixed(0)} %`; 
    default:
      return 'Valor desconhecido';
  }
}
