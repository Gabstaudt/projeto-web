import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tag } from 'src/app/models/tag.model';
import { EntradaService } from '../auth/entrada.service';

@Injectable({
  providedIn: 'root',
})
export class HistoricoService {
  // private apiUrl = 'http://172.74.0.167:8043/dados'; // URL do servidor
  private apiUrl = 'http://200.178.173.133:8043/dados';
  constructor(private http: HttpClient, private entradaService: EntradaService) {}

  ////////////// comando para fazer a requisição do histórico///////////////////
  public fazerRequisicaoHistorico(
    idSessao: string,
    setorId: number,
    dataInicio: number,
    dataFim: number,
    tagsInteiras: number[],
    tagsBooleanas: number[]
  ): Observable<any> {
    const comando = this.gerarBytesComandoHistorico(idSessao, setorId, dataInicio, dataFim, tagsInteiras, tagsBooleanas);
  
    return this.http.post(this.apiUrl, comando, {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      responseType: 'arraybuffer',
    }).pipe(
      map((response) => {
        const byteArray = new Uint8Array(response);
        return this.interpretarRespostaHistorico(byteArray);
      })
    );
  }
  
////////////////////////// função que gera o array de bytes para a consulta///////////////////////////////
  private gerarBytesComandoHistorico(
    sessaoId: string,
    setorId: number,
    dataInicio: number,
    dataFim: number,
    tagsInteiras: number[],
    tagsBooleanas: number[]
  ): ArrayBuffer {
    const comandoSupervisaoBytes = new Uint8Array([254]); 
    const comandoHistoricoBytes = new Uint8Array([234]); 

   // sess id ta com tamanhho fixo de 32 bytes
    const sessaoBytes = this.codificarSessaoComTamanho(sessaoId);
    const tamanhoSessaoBytes = new Uint8Array([(sessaoBytes.length >> 8) & 0xff, sessaoBytes.length & 0xff]); // 2 bytes para o tamanho
  
    
    const setorBytes = new Uint8Array([(setorId >> 8) & 0xff, setorId & 0xff]);
  
    
    const inicioBytes = this.converterPara8Bytes(dataInicio);
    const fimBytes = this.converterPara8Bytes(dataFim);
  
    
    const quantidadeTagsInteiras = new Uint8Array([tagsInteiras.length]);
  
    // IDs das Tags Inteiras (usando um laço for)
    const tagsInteirasBytes = new Uint8Array(tagsInteiras.length * 2); 
    for (let i = 0; i < tagsInteiras.length; i++) {
      tagsInteirasBytes[i * 2] = (tagsInteiras[i] >> 8) & 0xff; 
      tagsInteirasBytes[i * 2 + 1] = tagsInteiras[i] & 0xff; 
    }
  
    // Quantidade de Tags Booleanas (1 byte)
    const quantidadeTagsBooleanas = new Uint8Array([tagsBooleanas.length]);
  
    // IDs das Tags Booleanas (usando um laço for)
    const tagsBooleanasBytes = new Uint8Array(tagsBooleanas.length * 2); 
    for (let i = 0; i < tagsBooleanas.length; i++) {
      tagsBooleanasBytes[i * 2] = (tagsBooleanas[i] >> 8) & 0xff; 
      tagsBooleanasBytes[i * 2 + 1] = tagsBooleanas[i] & 0xff; 
    }
  
    // Montar o comando completo
    const totalLength =
      comandoSupervisaoBytes.length +
      tamanhoSessaoBytes.length + 
      sessaoBytes.length +
      comandoHistoricoBytes.length +
      setorBytes.length +
      inicioBytes.length +
      fimBytes.length +
      quantidadeTagsInteiras.length +
      tagsInteirasBytes.length +
      quantidadeTagsBooleanas.length +
      tagsBooleanasBytes.length;
  
    const comandoFinal = new Uint8Array(totalLength);
  
    let offset = 0;
    comandoFinal.set(comandoSupervisaoBytes, offset);
    offset += comandoSupervisaoBytes.length;
  
    comandoFinal.set(tamanhoSessaoBytes, offset); 
    offset += tamanhoSessaoBytes.length;
  
    comandoFinal.set(sessaoBytes, offset); 
    offset += sessaoBytes.length;
  
    comandoFinal.set(comandoHistoricoBytes, offset);
    offset += comandoHistoricoBytes.length;
  
    comandoFinal.set(setorBytes, offset);
    offset += setorBytes.length;
  
    comandoFinal.set(inicioBytes, offset);
    offset += inicioBytes.length;
  
    comandoFinal.set(fimBytes, offset);
    offset += fimBytes.length;
  
    comandoFinal.set(quantidadeTagsInteiras, offset);
    offset += quantidadeTagsInteiras.length;
  
    comandoFinal.set(tagsInteirasBytes, offset);
    offset += tagsInteirasBytes.length;
  
    comandoFinal.set(quantidadeTagsBooleanas, offset);
    offset += quantidadeTagsBooleanas.length;
  
    comandoFinal.set(tagsBooleanasBytes, offset);
  
    console.log('Comando gerado (Hex):', Array.from(comandoFinal).map(byte => byte.toString(16).padStart(2, '0')).join(' '));
    return comandoFinal.buffer;
  }

  ///////////////////////////// função da sessão id com 32 caracteres/////////////////////////////////
  private codificarSessaoComTamanho(input: string): Uint8Array {
    if (input.length !== 32) {
      throw new Error('Sessão ID deve conter exatamente 32 caracteres.');
    }
  
    // Codifica cada caractere em UTF-8
    const encoder = new TextEncoder();
    return encoder.encode(input); // Retorna o array diretamente em UTF-8
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  
  //////////////////////////////////////// conversão de bytes/////////////////////////////
  private converterPara8Bytes(value: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), false);
    return new Uint8Array(buffer);
  }
///////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////// função para interpretação da resposta do server /////////////////////////////
private interpretarRespostaHistorico(bytes: Uint8Array): any {
  console.log('Bytes recebidos do servidor:', bytes);

  let offset = 0;

  // Sessão OK
  const sessaoOK = bytes[offset];
  offset += 1;

  if (sessaoOK !== 1) {
    throw new Error('Sessão inválida ou expirada.');
  }

  // Consulta OK
  const consultaOK = bytes[offset];
  offset += 1;

  if (consultaOK !== 1) {
    throw new Error('Erro ao consultar histórico.');
  }

  // Quantidade de registros
  const quantidadeRegistros = this.converterBytesParaInt(bytes.slice(offset, offset + 4));
  offset += 4;

  console.log('Quantidade de registros recebidos:', quantidadeRegistros);

  const registros = [];

  // Laço 1: Repete para cada registro
  for (let i = 0; i < quantidadeRegistros; i++) {
    const registro: any = {};

    console.log(`\n>>> Registro ${i + 1} <<<`);

    // Tempo da informação (4 bytes)
    registro.tempoInformacao = this.converterBytesParaInt(bytes.slice(offset, offset + 4));
    if (!registro.tempoInformacao) {
      registro.tempoInformacao = null; // Define como null explicitamente se não houver valor
    }
    offset += 4;
    
    // Quantidade de tags inteiras (1 byte)
    const quantidadeTagsInteiras = bytes[offset];
    console.log(`Quantidade de Tags Inteiras: ${quantidadeTagsInteiras} (Offset: ${offset})`);
    offset += 1;

    // Quantidade de tags booleanas (1 byte)
    const quantidadeTagsBooleanas = bytes[offset];
    console.log(`Quantidade de Tags Booleanas: ${quantidadeTagsBooleanas} (Offset: ${offset})`);
    offset += 1;

    registro.tagsInteiras = [];
    registro.tagsBooleanas = [];
    registro.valoresBooleanos = [];

    // Laço 2: Repete para cada tag inteira
    for (let j = 0; j < quantidadeTagsInteiras; j++) {
      const tagInteira: any = {};
      tagInteira.id = this.converterBytesParaInt(bytes.slice(offset, offset + 2)); // ID da tag inteira (2 bytes)
      console.log(`Tag Inteira ${j + 1} - ID: ${tagInteira.id} (Offset: ${offset})`);
      offset += 2;

      tagInteira.valor = this.converterBytesParaInt(bytes.slice(offset, offset + 4)); // Valor da tag inteira (4 bytes)
      console.log(`Tag Inteira ${j + 1} - Valor: ${tagInteira.valor} (Offset: ${offset})`);
      offset += 4;

      registro.tagsInteiras.push(tagInteira);
    }

    // Laço 3: IDs das tags booleanas
    const idsBooleanas = [];
    for (let k = 0; k < quantidadeTagsBooleanas; k++) {
      const idBooleana = this.converterBytesParaInt(bytes.slice(offset, offset + 2)); // ID da tag booleana (2 bytes)
      console.log(`Tag Booleana ${k + 1} - ID: ${idBooleana} (Offset: ${offset})`);
      offset += 2;

      idsBooleanas.push(idBooleana);
    }
    registro.tagsBooleanas = idsBooleanas;
    const tamanhoValoresBooleanos = Math.ceil(quantidadeTagsBooleanas / 8); // Quantidade de bytes necessários
    console.log(`Tamanho dos valores booleanos: ${tamanhoValoresBooleanos} bytes (Offset: ${offset})`);
    
    const valoresBooleanosBytes = bytes.slice(offset, offset + tamanhoValoresBooleanos);
    console.log(
      `Bytes dos valores booleanos (Hex e Binário): ${Array.from(valoresBooleanosBytes)
        .map((b) => `${b.toString(16).padStart(2, '0')} (${b.toString(2).padStart(8, '0')})`)
        .join(' ')}`
    );
    offset += tamanhoValoresBooleanos;
    
    // Decodificar os bits até a quantidade de tags booleanas
    const valoresBooleanos: { id: number, valor: boolean }[] = [];
    let bitCounter = 0;
    
    for (let j = 0; j < tamanhoValoresBooleanos; j++) {
      const byteAtual = valoresBooleanosBytes[j];
    
      for (let bit = 0; bit < 8 && bitCounter < quantidadeTagsBooleanas; bit++) {
        const bitValue = (byteAtual >> bit) & 1; 
        const booleanValue = bitValue === 1; // Converte para true ou false
    
        valoresBooleanos.push({
          id: idsBooleanas[bitCounter], // Associa o valor booleano ao ID da tag
          valor: booleanValue,
        });
    
        console.log(
          `Tag Booleana ${bitCounter + 1}: ID=${idsBooleanas[bitCounter]}, Valor=${booleanValue} (BitValue=${bitValue}, Byte: ${byteAtual.toString(2)}, Bit: ${bit})`
        );
    
        bitCounter++;
      }
    }
    
    registro.valoresBooleanos = valoresBooleanos;

    registros.push(registro);
  }

  console.log('\nRegistros interpretados:', registros);
  return registros;
}


  
///////////////////////////////////////////// funções auxiliares/////////////////////////////////////
  //////////////// função para achar a tag pelo id do setor ////////////////////////////////////////
  public getTagsBySetorId(setorId: number): Tag[] {
    const setor = this.entradaService.listaGlobal.find((s) => s.id === setorId);
    console.log('Setor encontrado:', setor);
    return setor ? setor.tags : [];
  }


  private converterBytesParaInt(bytes: Uint8Array): number {
    return bytes.reduce((acc, byte) => (acc << 8) | byte, 0);
  }

/////////////////////////////////////////////////////////////////////////////////////////////////////
private formatarTempo(tempo: number): string {
  if (!tempo) return '-';
  const data = new Date(tempo * 1000);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear().toString().slice(-2);
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  const segundos = String(data.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}



buscarDados(setorId: number, tags: any[], intervalo: { inicio: string; fim: string }): Observable<any> {
  const params = {
    setorId: setorId.toString(),
    tags: tags.map(tag => tag.id).join(','), // Envia IDs das tags
    inicio: intervalo.inicio,
    fim: intervalo.fim,
  };
  return this.http.get<any>(`${this.apiUrl}`, { params });
}


}

