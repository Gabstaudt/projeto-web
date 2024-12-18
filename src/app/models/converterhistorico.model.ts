import { TipoTag } from './tipo.model';

export function formatarValorParaHistorico(tagTipo: TipoTag, valor: number): string {
  console.log('Formatando valor para histórico - tagTipo:', tagTipo, ', valor:', valor);

  const formatarValor = (valor: number, casasDecimais: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    });
  };

  switch (tagTipo) {
    case TipoTag.Booleano:
      return valor === 0 ? 'Desativado' : 'Ativado';
    case TipoTag.Vazao0:
    case TipoTag.Vazao1:
      return formatarValor(valor / 10, 1); // Apenas o número
    case TipoTag.Nivel:
      return formatarValor(valor / 100, 2);
    case TipoTag.Pressao:
      return formatarValor(valor / 100, 2);
    case TipoTag.Volume:
    case TipoTag.Tensao:
    case TipoTag.Corrente:
    case TipoTag.Frequencia:
    case TipoTag.Abertura:
      return formatarValor(valor, 0); // Apenas o número
    default:
      return valor.toString();
  }
}