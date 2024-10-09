import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Alarme } from '../../models/alarme.model';
import { Setor } from '../../models/setor.model';
import { Tag } from '../../models/tag.model';

@Injectable({
  providedIn: 'root'
})
export class EntradaService {
  private apiUrl = 'http://10.20.96.221:8043/dados'; 

  constructor(private http: HttpClient) {}

  // Função para fazer a segunda requisição, recebendo a Sessão ID como parâmetro
  fazerSegundaRequisicao(sessaoId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }); 

    
    const comandoSupervisao = 254;
    const comandoEstrutura = 237; 

    // Construir os bytes da requisição
    const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoEstrutura);
   
    console.log('Corpo da requisição (bytes):', body);

    //requisição POST
    return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' }).pipe(
      
      // Manipulação da resposta
      map(response => {
        const byteArray = new Uint8Array(response); 
        console.log('Resposta recebida (bytes):', byteArray); 

        const setores = this.parseSecondResponse(byteArray); 
        console.log('Setores processados:', setores); 

        return setores; 
      }),

      
      catchError(error => {
        console.error('Erro ao fazer a segunda requisição', error); 
        return throwError(() => error);
      })
    );
  }

  // gerar os bytes da requisição
  private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoEstrutura: number): ArrayBuffer {
    const sessaoIdBytes = this.encodeWithLength(sessaoId); 

    const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]); 
    const comandoEstruturaBytes = new Uint8Array([comandoEstrutura]); 

    const combinedBytes = new Uint8Array(comandoSupervisaoBytes.length + sessaoIdBytes.length + comandoEstruturaBytes.length);
    combinedBytes.set(comandoSupervisaoBytes, 0); 
    combinedBytes.set(sessaoIdBytes, comandoSupervisaoBytes.length);
    combinedBytes.set(comandoEstruturaBytes, comandoSupervisaoBytes.length + sessaoIdBytes.length); 

    return combinedBytes.buffer;
  }

  // interpretar os bytes da resposta 
  private parseSecondResponse(bytes: Uint8Array): Setor[] {
    let offset = 0; 

    const respostaOK = bytes[offset];
    console.log('Resposta de status:', respostaOK); 
    offset += 1;

    const ultimaVersao = (bytes[offset] << 8) | bytes[offset + 1];
    console.log('Última versão:', ultimaVersao); 
    offset += 2;

    const quantidadeSetores = (bytes[offset] << 8) | bytes[offset + 1];
    console.log('Quantidade de setores:', quantidadeSetores); 
    offset += 2;

    const setores: Setor[] = []; 

    // Laço 1: setor
    for (let i = 0; i < quantidadeSetores; i++) {
      const setor = new Setor(); 

      setor.id = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;

      const nomeSetorLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      setor.nome = this.bytesToString(bytes.slice(offset, offset + nomeSetorLength)); 
      offset += nomeSetorLength;

      //  campos do Setor
      const enderecoLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      setor.endereco = this.bytesToString(bytes.slice(offset, offset + enderecoLength)); 
      offset += enderecoLength;

      setor.latitude = this.bytesToFloat(bytes.slice(offset, offset + 4)); 
      offset += 4;

      setor.longitude = this.bytesToFloat(bytes.slice(offset, offset + 4)); 
      offset += 4;

      setor.unidade = bytes[offset]; 
      offset += 1;

      setor.subunidade = bytes[offset]; 
      offset += 1;
      
      setor.status = bytes[offset]; 
      offset += 1;

      setor.tipo = bytes[offset];
      offset += 1;


       // tamanho do array gráfico 
     const tamanhoGrafico = bytes[offset];
      offset += 1;

      //tamanho real do array gráfico 
      const tamanhoRealArrayGrafico = tamanhoGrafico * 2;

     const arrayGrafico = new Uint16Array(tamanhoRealArrayGrafico);
      for (let j = 0; j < tamanhoRealArrayGrafico; j++) {
      arrayGrafico[j] = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
     }

      // quantidade de tags no setor
      const quantidadeTags = bytes[offset];
      console.log(`Setor ${setor.nome} - Quantidade de tags:`, quantidadeTags); 
      offset += 1;

      const tags: Tag[] = []; // Armazena as tags

      // Laço 2: tag 
      for (let j = 0; j < quantidadeTags; j++) {
        const tag = new Tag();
        tag.id = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;

        const nomeTagLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        tag.nome = this.bytesToString(bytes.slice(offset, offset + nomeTagLength)); 
        offset += nomeTagLength;

        // Lê outros campos da Tag 
        tag.descricao = this.bytesToString(bytes.slice(offset, offset + 100)).trim(); // Exemplo de descrição com 100 bytes
        offset += 100;

        tags.push(tag); // Adiciona a tag ao array de tags do setor
      }

      setor.tags = tags; 

      // quantidade de alarmes no setor
      const quantidadeAlarmes = bytes[offset];
      console.log(`Setor ${setor.nome} - Quantidade de alarmes:`, quantidadeAlarmes); 
      offset += 1;

      const alarmes: Alarme[] = []; //array para armazenar os alarmes do setor

      // Laço 3:  alarme 
      for (let k = 0; k < quantidadeAlarmes; k++) {
        const alarme = new Alarme();
        alarme.id = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;

        const nomeAlarmeLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        alarme.nome = this.bytesToString(bytes.slice(offset, offset + nomeAlarmeLength));
        offset += nomeAlarmeLength;

        alarmes.push(alarme); // array de alarmes do setor
      }

      setor.alarmes = alarmes;
      setores.push(setor);
    }

    return setores; 
  }

  // Função para converter bytes em string
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder('utf-8').decode(bytes); 
  }

  // Converte a string da sessão em bytes com o comprimento
  private encodeWithLength(str: string): Uint8Array {
    const stringBytes = new TextEncoder().encode(str);
    const length = stringBytes.length;

    const lengthBytes = new Uint8Array(2);
    lengthBytes[0] = (length >> 8) & 0xff;
    lengthBytes[1] = length & 0xff;        

    const combined = new Uint8Array(lengthBytes.length + stringBytes.length);
    combined.set(lengthBytes, 0);
    combined.set(stringBytes, lengthBytes.length);

    return combined;
  }

 
  private bytesToFloat(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
        view.setUint8(i, bytes[i]);
    }
    return view.getFloat32(0, true); 
}
}