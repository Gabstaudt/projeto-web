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
  private apiUrl = 'http://10.20.96.221:8043/dados'; // URL da requisição

  constructor(private http: HttpClient) {}

  // Função para fazer a segunda requisição, recebendo a Sessão ID como parâmetro
  fazerSegundaRequisicao(sessaoId: string): Observable<Setor[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }); // Define os cabeçalhos da requisição

    // Comandos
<<<<<<< HEAD
    const comandoSupervisao = 254;
=======
    const comandoSupervisao = 254; 
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
    const comandoEstrutura = 237; // Comando para ler a estrutura

    // Construir os bytes da requisição
    const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoEstrutura);
<<<<<<< HEAD
   
    console.log('Corpo da requisição (bytes):', body);
=======
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2

    // Realiza a requisição POST
    return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' }).pipe(
      // Manipulação da resposta
      map(response => {
        const byteArray = new Uint8Array(response); // Converte a resposta em um array de bytes
<<<<<<< HEAD
        console.log('Resposta recebida (bytes):', byteArray); // Log da resposta em bytes

        const setores = this.parseSecondResponse(byteArray); // Chama a função que interpreta os bytes da resposta
        console.log('Setores processados:', setores); // Log dos setores processados

        return setores; // Retorna os setores
=======
        return this.parseSecondResponse(byteArray); // Chama a função que interpreta os bytes da resposta
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
      }),

      // Tratamento de erros
      catchError(error => {
        console.error('Erro ao fazer a segunda requisição', error); // Loga o erro no console
<<<<<<< HEAD
        return throwError(() => error);
=======
        return throwError(() => error); 
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
      })
    );
  }

  // Método para gerar os bytes da requisição
  private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoEstrutura: number): ArrayBuffer {
<<<<<<< HEAD
    const sessaoIdBytes = this.encodeWithLength(sessaoId); // Converte o ID da sessão em bytes

    const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]); // c.supervisao-bytes
    const comandoEstruturaBytes = new Uint8Array([comandoEstrutura]); // c.estrutura-bytes

    // Ordem correta: comandoSupervisao -> sessaoId -> comandoEstrutura
    const combinedBytes = new Uint8Array(comandoSupervisaoBytes.length + sessaoIdBytes.length + comandoEstruturaBytes.length);
    combinedBytes.set(comandoSupervisaoBytes, 0); 
    combinedBytes.set(sessaoIdBytes, comandoSupervisaoBytes.length);
    combinedBytes.set(comandoEstruturaBytes, comandoSupervisaoBytes.length + sessaoIdBytes.length); // Por último comandoEstrutura

    return combinedBytes.buffer;
=======
    // Converte tudo para bytes
    const sessaoIdBytes = this.encodeWithLength(sessaoId); // sessão-bytes
    const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]); // c.superv-bytes
    const comandoEstruturaBytes = new Uint8Array([comandoEstrutura]); // c.estrutura-bytes

    // Junta os arrays de bytes --> cria array buffer
    const combinedBytes = new Uint8Array(sessaoIdBytes.length + comandoSupervisaoBytes.length + comandoEstruturaBytes.length);
    combinedBytes.set(sessaoIdBytes, 0);
    combinedBytes.set(comandoSupervisaoBytes, sessaoIdBytes.length);
    combinedBytes.set(comandoEstruturaBytes, sessaoIdBytes.length + comandoSupervisaoBytes.length);

    return combinedBytes.buffer; 
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
  }

  // Função para interpretar os bytes da resposta da segunda requisição
  private parseSecondResponse(bytes: Uint8Array): Setor[] {
    let offset = 0; // Variável para rastrear a posição atual no array de bytes

    // Lê a resposta de status
    const respostaOK = bytes[offset];
<<<<<<< HEAD
    console.log('Resposta de status:', respostaOK); // Log do status
=======
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
    offset += 1;

    // Última versão
    const ultimaVersao = (bytes[offset] << 8) | bytes[offset + 1];
<<<<<<< HEAD
    console.log('Última versão:', ultimaVersao); // Log da última versão
=======
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
    offset += 2;

    // Quantidade de setores
    const quantidadeSetores = (bytes[offset] << 8) | bytes[offset + 1];
<<<<<<< HEAD
    console.log('Quantidade de setores:', quantidadeSetores); // Log da quantidade de setores
=======
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
    offset += 2;

    const setores: Setor[] = []; // Array para armazenamento de setores

    // Laço 1: para cada setor
    for (let i = 0; i < quantidadeSetores; i++) {
      const setor = new Setor(); // Cria uma nova instância do modelo Setor

      // Lê o ID do setor
      setor.id = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;

      // Lê o tamanho do nome do setor
      const nomeSetorLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      setor.nome = this.bytesToString(bytes.slice(offset, offset + nomeSetorLength)); // Lê o nome do setor e converte de bytes para string
      offset += nomeSetorLength;
<<<<<<< HEAD
=======

      // Lê a quantidade de tags no setor
      const quantidadeTags = bytes[offset];
      offset += 1;
      const tags: Map<number, Tag> = new Map(); // Armazena as tags do setor
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2

      // Lê a quantidade de tags no setor
      const quantidadeTags = bytes[offset];
      console.log(`Setor ${setor.nome} - Quantidade de tags:`, quantidadeTags); // Log da quantidade de tags
      offset += 1;
      const tags: Map<number, Tag> = new Map(); // Armazena as tags do setor
     
      // Laço 2: Para cada tag no setor
      for (let j = 0; j < quantidadeTags; j++) {
        const tag = new Tag();
        tag.id = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;

        const nomeTagLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        tag.nome = this.bytesToString(bytes.slice(offset, offset + nomeTagLength)); // Lê o nome da tag e converte de bytes para string
        offset += nomeTagLength;

        tags.set(tag.id, tag); // Adiciona a tag ao mapa de tags do setor
      }

      setor.tags = tags; // Atribui o mapa de tags ao setor

      // Lê a quantidade de alarmes no setor
      const quantidadeAlarmes = bytes[offset];
<<<<<<< HEAD
      console.log(`Setor ${setor.nome} - Quantidade de alarmes:`, quantidadeAlarmes); // Log da quantidade de alarmes
=======
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2
      offset += 1;
      const alarmes: Map<number, Alarme> = new Map(); // Cria um mapa para armazenar os alarmes do setor

      // Laço 3: Para cada alarme no setor
      for (let k = 0; k < quantidadeAlarmes; k++) {
        const alarme = new Alarme();
        alarme.id = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;

        const nomeAlarmeLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        alarme.nome = this.bytesToString(bytes.slice(offset, offset + nomeAlarmeLength));
        offset += nomeAlarmeLength;

        alarmes.set(alarme.id, alarme);
      }

      setor.alarmes = alarmes;
      setores.push(setor);
    }

    return setores; // Retorna a lista de setores processada
  }

  // Função para converter bytes em string
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder('utf-8').decode(bytes); // Converte um array de bytes para uma string usando o decodificador UTF-8
  }

<<<<<<< HEAD
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
=======
  // string sessão id pra bytes
  private encodeWithLength(str: string): Uint8Array {
    const stringBytes = new TextEncoder().encode(str); 
    const length = stringBytes.length; 

    const lengthBytes = new Uint8Array(2);
    lengthBytes[0] = (length >> 8) & 0xff; 
    lengthBytes[1] = length & 0xff;        

    const combined = new Uint8Array(lengthBytes.length + stringBytes.length);
    combined.set(lengthBytes, 0); 
    combined.set(stringBytes, lengthBytes.length); 
>>>>>>> 0a2f62ce5ddde061505699f7adc45c4be121b4f2

    return combined;
  }
}
