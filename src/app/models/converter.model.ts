import { TipoTag } from './tipo.model'; 

export function converterLeitura(tagTipo: TipoTag, valor: number): string {
  console.log('Valores recebidos - tagTipo:', tagTipo, ', valor:', valor);

  const formatarValor = (valor: number, casasDecimais: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    });
  };

  switch (tagTipo) {
    case TipoTag.Booleano:
      return valor === 0 ? 'Desligada' : 'Ligada';
    case TipoTag.Vazao0:
      return `${formatarValor(valor, 0)} m³/h`; 
    case TipoTag.Vazao1:
      return `${formatarValor(valor / 10, 1)} m³/h`; 
    case TipoTag.Nivel:
      return `${formatarValor(valor / 100, 2)} m`; 
    case TipoTag.Pressao:
      return `${formatarValor(valor/ 100, 2)} mca`; 
    case TipoTag.Volume:
      return `${formatarValor(valor, 0)} m³`; 
    case TipoTag.Tensao:
      return `${formatarValor(valor, 0)} V`;
    case TipoTag.Corrente:
      return `${formatarValor(valor, 0)} A`; 
    case TipoTag.Frequencia:
      return `${formatarValor(valor, 0)} Hz`; 
    case TipoTag.Abertura:
      return `${formatarValor(valor, 0)} %`; 
    default:
      return 'Valor desconhecido';
  }
}
