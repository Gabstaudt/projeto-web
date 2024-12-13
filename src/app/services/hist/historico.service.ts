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
  private apiUrl = 'http://172.74.0.167:8043/dados'; // URL do servidor

  constructor(private http: HttpClient, private entradaService: EntradaService) {}
 
  
  public getTagsBySetorId(setorId: number): Tag[] {
    const setor = this.entradaService.listaGlobal.find((s) => s.id === setorId);
    console.log('Setor encontrado:', setor);
    return setor ? setor.tags : [];
  }
  
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
  
  
  

  private obterSessaoIdDoLocalStorage(): string {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const dadosUsuario = JSON.parse(usuario);
      return dadosUsuario.SessaoID || '';
    }
    console.warn('Sessão ID não encontrada no localStorage.');
    return '';
  }

  private gerarBytesComandoHistorico(
    sessaoId: string,
    setorId: number,
    dataInicio: number,
    dataFim: number,
    tagsInteiras: number[],
    tagsBooleanas: number[]
  ): ArrayBuffer {
    const comandoSupervisaoBytes = new Uint8Array([254]); // 1 byte (FE)
    const comandoHistoricoBytes = new Uint8Array([234]); // 1 byte (EA)
  
    // ID da Sessão (32 bytes com tamanho fixo)
    const sessaoBytes = this.codificarSessaoComTamanho(sessaoId);
  
    // ID do Setor (2 bytes)
    const setorBytes = new Uint8Array([(setorId >> 8) & 0xff, setorId & 0xff]);
  
    // Intervalos de data (8 bytes cada, big-endian)
    const inicioBytes = this.converterPara8Bytes(dataInicio);
    const fimBytes = this.converterPara8Bytes(dataFim);
  
    // Quantidade de Tags Inteiras (1 byte)
    const quantidadeTagsInteiras = new Uint8Array([tagsInteiras.length]);
  
    // IDs das Tags Inteiras (usando um laço for)
    const tagsInteirasBytes = new Uint8Array(tagsInteiras.length * 2); // Cada ID ocupa 2 bytes
    for (let i = 0; i < tagsInteiras.length; i++) {
      tagsInteirasBytes[i * 2] = (tagsInteiras[i] >> 8) & 0xff; // Byte mais significativo
      tagsInteirasBytes[i * 2 + 1] = tagsInteiras[i] & 0xff; // Byte menos significativo
    }
  
    // Quantidade de Tags Booleanas (1 byte)
    const quantidadeTagsBooleanas = new Uint8Array([tagsBooleanas.length]);
  
    // IDs das Tags Booleanas (usando um laço for)
    const tagsBooleanasBytes = new Uint8Array(tagsBooleanas.length * 2); // Cada ID ocupa 2 bytes
    for (let i = 0; i < tagsBooleanas.length; i++) {
      tagsBooleanasBytes[i * 2] = (tagsBooleanas[i] >> 8) & 0xff; // Byte mais significativo
      tagsBooleanasBytes[i * 2 + 1] = tagsBooleanas[i] & 0xff; // Byte menos significativo
    }
  
    // Montar o comando completo
    const totalLength =
      comandoSupervisaoBytes.length +
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
  
  
  
  
  private codificarSessaoComTamanho(input: string): Uint8Array {
    if (input.length !== 32) {
      throw new Error('Sessão ID deve conter exatamente 32 caracteres.');
    }
  
    // Codifica cada caractere em hexadecimal (mantendo direto o valor textual)
    const encoder = new TextEncoder();
    return encoder.encode(input); // Retorna o array diretamente em UTF-8
  }
  
  
  
  private converterPara8Bytes(value: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(value), false);
    return new Uint8Array(buffer);
  }

  private interpretarRespostaHistorico(bytes: Uint8Array): any {
    console.log('Bytes recebidos do servidor:', bytes);

    let offset = 0;

    const sessaoOK = bytes[offset];
    offset += 1;

    if (sessaoOK === 0) {
      throw new Error('Sessão inválida ou expirada.');
    }

    const consultaOK = bytes[offset];
    offset += 1;

    if (consultaOK === 0) {
      throw new Error('Erro ao consultar histórico.');
    }

    const quantidadeRegistros = this.converterBytesParaInt(bytes.slice(offset, offset + 4));
    offset += 4;

    const registros = [];

    for (let i = 0; i < quantidadeRegistros; i++) {
      const registro: any = {};

      registro.tempoInformacao = this.converterBytesParaInt(bytes.slice(offset, offset + 4));
      offset += 4;

      registros.push(registro);
    }

    console.log('Registros interpretados:', registros);
    return registros;
  }

  private converterBytesParaInt(bytes: Uint8Array): number {
    return bytes.reduce((acc, byte) => (acc << 8) | byte, 0);
  }

  public isTagInteira(tagId: number): boolean {
    const tag = this.getTagFromGlobalList(tagId); // Obtém a tag da lista global
    return tag?.leituraInt !== undefined; // Verifica se a tag possui leituraInt
  }
  
  private getTagFromGlobalList(tagId: number): Tag | undefined {
    const setores = this.entradaService.listaGlobal || [];
    for (const setor of setores) {
      const tag = setor.tags.find((t: Tag) => t.id === tagId);
      if (tag) {
        return tag;
      }
    }
    console.warn(`Tag com ID ${tagId} não encontrada na lista global.`);
    return undefined;
  }

  
}
