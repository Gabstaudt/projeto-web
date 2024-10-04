import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


interface EntradaResponse {
  comandoSupervisao: number;          //resposta 200 OK
  sessaoID: string;           
  comandoEstrutura: number;         
}

@Injectable({
  providedIn: 'root'
})
export class EntradaService {
  private apiUrl = ''; // requisição 2

  constructor(private http: HttpClient) {}

  // Segunda requisição
  fazerSegundaRequisicao(sessaoId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
//comando 
    const comandoSupervisao = 254; 
    const comandoEstrutura = 237;  // Comando para ler a estrutura

    // Construir os bytes da requisição
    const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoEstrutura);

    return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' });
  }

  // método para gerar os bytes da requisição
  private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoEstrutura: number): ArrayBuffer {
    // converte tudo para bytes
    const sessaoIdBytes = this.encodeWithLength(sessaoId);  // sessão-bytes
    const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]);  // c.superv-bytes
    const comandoEstruturaBytes = new Uint8Array([comandoEstrutura]);    // c.estrutura-bytes

    // Junta os arrays de bytes --> cria array buffer
    const combinedBytes = new Uint8Array(sessaoIdBytes.length + comandoSupervisaoBytes.length + comandoEstruturaBytes.length);
    combinedBytes.set(sessaoIdBytes, 0);
    combinedBytes.set(comandoSupervisaoBytes, sessaoIdBytes.length);
    combinedBytes.set(comandoEstruturaBytes, sessaoIdBytes.length + comandoSupervisaoBytes.length);

    return combinedBytes.buffer; 
  }

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

    return combined;
  }
}
