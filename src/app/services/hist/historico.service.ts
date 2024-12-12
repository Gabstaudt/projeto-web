import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HistoricoService {
  // private apiUrl = 'http://10.20.100.133:8043/dados';
   private apiUrl = 'http://172.74.0.167:8043/dados'

  constructor(private http: HttpClient) {}

  // Método para fazer a requisição de histórico
  public fazerRequisicaoHistorico(
    idSessao: string,
    setorId: number,
    dataInicio: number,
    dataFim: number,
    tagsInteiras: number[],
    tagsBooleanas: number[]
  ): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    
    const comando = this.gerarComandoHistorico(idSessao, setorId, dataInicio, dataFim, tagsInteiras, tagsBooleanas);
  
    // Adicionando log para inspecionar o comando gerado
    console.log('Comando gerado (bytes):', comando);
    console.log('Comando gerado (hex):', Array.from(new Uint8Array(comando)).map(byte => byte.toString(16).padStart(2, '0')).join(' '));
  
    return this.http.post(this.apiUrl, comando, { headers, responseType: 'arraybuffer' }).pipe(
      map((response) => {
        const byteArray = new Uint8Array(response);
        return this.parseHistoricoResponse(byteArray);
      })
    );
  }
  

  // Método para gerar os bytes da requisição
  private gerarComandoHistorico(
    idSessao: string,
    setorId: number,
    dataInicio: number,
    dataFim: number,
    tagsInteiras: number[],
    tagsBooleanas: number[]
  ): ArrayBuffer {
    const sessaoIdBytes = this.encodeWithLength(idSessao);

    const comandoSupervisaoBytes = new Uint8Array([254]); // Comando de supervisão
    const comandoHistoricoBytes = new Uint8Array([234]); // Comando de consultar histórico

    const setorIdBytes = new Uint8Array([(setorId >> 8) & 0xff, setorId & 0xff]); // ID do setor em 2 bytes

    const inicioBytes = this.numberTo8Bytes(dataInicio); // Início da faixa (8 bytes)
    const fimBytes = this.numberTo8Bytes(dataFim); // Fim da faixa (8 bytes)

    const quantidadeTagsInteiras = new Uint8Array([tagsInteiras.length]); // Quantidade de tags inteiras (1 byte)
    const tagsInteirasBytes = this.arrayToBytes(tagsInteiras, 2); // IDs das tags inteiras (2 bytes cada)

    const quantidadeTagsBooleanas = new Uint8Array([tagsBooleanas.length]); // Quantidade de tags booleanas (1 byte)
    const tagsBooleanasBytes = this.arrayToBytes(tagsBooleanas, 2); // IDs das tags booleanas (2 bytes cada)

    // Combinar todos os bytes
    const totalLength =
      comandoSupervisaoBytes.length +
      sessaoIdBytes.length +
      comandoHistoricoBytes.length +
      setorIdBytes.length +
      inicioBytes.length +
      fimBytes.length +
      quantidadeTagsInteiras.length +
      tagsInteirasBytes.length +
      quantidadeTagsBooleanas.length +
      tagsBooleanasBytes.length;

    const combinedBytes = new Uint8Array(totalLength);


    console.log ("AQUIIIIIIIIIIIIII", combinedBytes);

    
    let offset = 0;
    combinedBytes.set(comandoSupervisaoBytes, offset);
    offset += comandoSupervisaoBytes.length;

    combinedBytes.set(sessaoIdBytes, offset);
    offset += sessaoIdBytes.length;

    combinedBytes.set(comandoHistoricoBytes, offset);
    offset += comandoHistoricoBytes.length;

    combinedBytes.set(setorIdBytes, offset);
    offset += setorIdBytes.length;

    combinedBytes.set(inicioBytes, offset);
    offset += inicioBytes.length;

    combinedBytes.set(fimBytes, offset);
    offset += fimBytes.length;

    combinedBytes.set(quantidadeTagsInteiras, offset);
    offset += quantidadeTagsInteiras.length;

    combinedBytes.set(tagsInteirasBytes, offset);
    offset += tagsInteirasBytes.length;

    combinedBytes.set(quantidadeTagsBooleanas, offset);
    offset += quantidadeTagsBooleanas.length;

    combinedBytes.set(tagsBooleanasBytes, offset);

    return combinedBytes.buffer;
  }

  // Interpretar a resposta do histórico
  private parseHistoricoResponse(bytes: Uint8Array): any {
  console.log('Bytes recebidos do servidor:', bytes);

  let offset = 0;

  // 1. Sessão OK (1 byte)
  const sessaoOK = bytes[offset];
  console.log('Sessão OK:', sessaoOK);
  offset += 1;

  if (sessaoOK === 0) {
    throw new Error('Erro de sessão: Sessão inválida.');
  }

  // 2. Consulta OK (1 byte)
  const consultaOK = bytes[offset];
  console.log('Consulta OK:', consultaOK);
  offset += 1;

  if (consultaOK === 0) {
    throw new Error('Erro de consulta: Consulta inválida.');
  }

  // 3. Quantidade de Registros (4 bytes)
  const quantidadeRegistros = this.bytesToInt(bytes.slice(offset, offset + 4));
  console.log('Quantidade de registros:', quantidadeRegistros);
  offset += 4;

  const registros: any[] = [];

  // Laço nível 1: Processar registros
  for (let i = 0; i < quantidadeRegistros; i++) {
    const registro: any = {};

    // Tempo da Informação (4 bytes)
    registro.tempoInformacao = this.bytesToInt(bytes.slice(offset, offset + 4));
    offset += 4;

    // Quantidade de Tags Inteiras (1 byte)
    const quantidadeTagsInteiras = bytes[offset];
    console.log(`Registro ${i + 1} - Quantidade de Tags Inteiras:`, quantidadeTagsInteiras);
    offset += 1;

    // Quantidade de Tags Booleanas (1 byte)
    const quantidadeTagsBooleanas = bytes[offset];
    console.log(`Registro ${i + 1} - Quantidade de Tags Booleanas:`, quantidadeTagsBooleanas);
    offset += 1;

    // Processar Tags Inteiras
    registro.tagsInteiras = [];
    for (let j = 0; j < quantidadeTagsInteiras; j++) {
      const tagInteira: any = {};

      // ID da Tag Inteira (2 bytes)
      tagInteira.id = this.bytesToInt(bytes.slice(offset, offset + 2));
      offset += 2;

      // Valor da Tag Inteira (4 bytes)
      tagInteira.valor = this.bytesToInt(bytes.slice(offset, offset + 4));
      offset += 4;

      registro.tagsInteiras.push(tagInteira);
    }

    // Processar Tags Booleanas
    registro.tagsBooleanas = [];
    for (let k = 0; k < quantidadeTagsBooleanas; k++) {
      const tagBoleana: any = {};

      // ID da Tag Boleana (2 bytes)
      tagBoleana.id = this.bytesToInt(bytes.slice(offset, offset + 2));
      offset += 2;

      registro.tagsBooleanas.push(tagBoleana);
    }

    // Processar Valores das Tags Booleanas (Bytes de valores booleanos)
    const tamanhoBytesBooleanos = Math.ceil(quantidadeTagsBooleanas / 8); // 1 bit por tag
    registro.valoresBooleanos = Array.from(bytes.slice(offset, offset + tamanhoBytesBooleanos));
    offset += tamanhoBytesBooleanos;

    registros.push(registro);
  }

  console.log('Registros processados:', registros);
  return registros;
}



private bytesToInt(bytes: Uint8Array): number {
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
  }
  return value;
}


  // Helper para codificar strings com comprimento
  private encodeWithLength(input: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(input);
    const lengthBytes = new Uint8Array([encoded.length >> 8, encoded.length & 0xff]);
    const paddedEncoded = new Uint8Array(30);
    paddedEncoded.set(encoded.slice(0, 30)); // Padding para 30 bytes
    return new Uint8Array([...lengthBytes, ...paddedEncoded]);
  }

  // Converter número para 8 bytes
  private numberTo8Bytes(value: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), false); // Big-endian
    return new Uint8Array(buffer);
  }

  // Converter array de números para bytes
  private arrayToBytes(array: number[], byteSize: number): Uint8Array {
    const buffer = new Uint8Array(array.length * byteSize);
    array.forEach((value, index) => {
      for (let i = 0; i < byteSize; i++) {
        buffer[index * byteSize + i] = (value >> ((byteSize - i - 1) * 8)) & 0xff;
      }
    });
    return buffer;
  }
}
