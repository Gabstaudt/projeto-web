import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, throwError } from 'rxjs'; 
import { catchError, map } from 'rxjs/operators'; 
import { Alarme } from '../models/alarme.model'; 
import { Setor } from '../models/setor.model'; 
import { Tag } from '../models/tag.model';

@Injectable({
  providedIn: 'root' 
})
export class EntradaService {
  private apiUrl = 'http://10.20.96.221:8043/dados'; 

  constructor(private http: HttpClient) {} 

  // Função para fazer a segunda requisição, recebendo a Sessão ID como parâmetro
  fazerSegundaRequisicao(sessaoId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }); // Define os cabeçalhos da requisição

    // Realiza a requisição POST
    return this.http.post(this.apiUrl, { sessaoId }, { headers, responseType: 'arraybuffer' }).pipe(
      // Manipulação da resposta
      map(response => {
        const byteArray = new Uint8Array(response); // Converte a resposta em um array de bytes
        const parsedResponse = this.parseSecondResponse(byteArray); // Chama a função que interpreta os bytes da resposta
        return parsedResponse; 
      }),

      // tratamento de erros
      catchError(error => {
        console.error('Erro ao fazer a segunda requisição', error); // Loga o erro no console
        return throwError(() => error); // Lança o erro para ser tratado em outro lugar
      })
    );
  }

  // Função para interpretar os bytes da resposta da segunda requisição
  private parseSecondResponse(bytes: Uint8Array) {
    let offset = 0; // Variável para rastrear a posição atual no array de bytes

    //
    const respostaOK = bytes[offset]; // Lê a resposta de status
    offset += 1; // Atualiza o offset para o próximo valor

    // Última versão
    const ultimaVersao = (bytes[offset] << 8) | bytes[offset + 1]; 
    offset += 2; 

    //Quantidade de setores
    const quantidadeSetores = (bytes[offset] << 8) | bytes[offset + 1]; // Lê a quantidade de setores
    offset += 2; // Move o offset

    const setores: Setor[] = []; // array para armazenamento de setores

    // Laço 1: para cada setor
    for (let i = 0; i < quantidadeSetores; i++) {
      const setor = new Setor(); // Cria uma nova instância do modelo Setor

      setor.id = (bytes[offset] << 8) | bytes[offset + 1]; // Lê o ID do setor
      offset += 2;

      const nomeSetorLength = (bytes[offset] << 8) | bytes[offset + 1]; // Lê o tamanho do nome do setor
      offset += 2; 
      setor.nome = this.bytesToString(bytes.slice(offset, offset + nomeSetorLength)); // Lê o nome do setor e converte de bytes para string
      offset += nomeSetorLength; 

      

      const quantidadeTags = bytes[offset]; // Lê a quantidade de tags no setor
      offset += 1; 
      const tags: Map<number, Tag> = new Map(); // armazena as tags do setor

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

      const quantidadeAlarmes = bytes[offset]; // Lê a quantidade de alarmes no setor
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
}
