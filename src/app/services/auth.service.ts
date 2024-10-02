import { Injectable } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import CryptoJS from 'crypto-js'; // Biblioteca para criptografia
import biri from 'biri'; // Função para gerar ID aleatório 

// Interface que define o formato esperado para a resposta do login
interface LoginResponse {
  respostaOK: number;
  IdUsuario: number;
  NomeUsuario: string; 
  PrivilegioUsuario: number;
  UnidadeUsuario: number;
  AcessoProducao: number;
  AcessoEmpresa1: number;
  AcessoEmpresa2: number;
  SessaoID: string;
}

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
  private apiUrl = 'http://10.20.96.221:8043/dados'; 

  constructor(private http: HttpClient) { } // Injeta o HttpClient para fazer requisições HTTP

  // Função de login que retorna um Observable com a resposta
  login(username: string, password: string): Observable<any> {
    const AppCommand = 240;
    const Plataform = 3;
    const Version = 1;
    const GadjetID = biri();// "id" do dispositivo

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded' 
    });
//envio da requisição
    const salt = 'super teste do carai'; 
    const passwordHash = this.encryptPassword(password, salt); 

    const appCommandBytes = this.numberToBytes({ num: AppCommand }).subarray(3);
    const plataformBytes = this.numberToBytes({ num: Plataform }).subarray(3); 
    const versionBytes = this.versionToBytes(Version); 
    const gadjetIDBytes = this.encodeWithLength(GadjetID);
    const usernameBytes = this.encodeWithLength(username); 
    const passwordBytes = this.encodeWithLength(passwordHash); // hash da senha

    const combinedBytes = new Uint8Array(
      appCommandBytes.length +
      plataformBytes.length +
      versionBytes.length +
      gadjetIDBytes.length +
      usernameBytes.length +
      passwordBytes.length 
    );

    let offset = 0;
    combinedBytes.set(appCommandBytes, offset);
    offset += appCommandBytes.length;
    combinedBytes.set(plataformBytes, offset);
    offset += plataformBytes.length;
    combinedBytes.set(versionBytes, offset);
    offset += versionBytes.length;
    combinedBytes.set(gadjetIDBytes, offset);
    offset += gadjetIDBytes.length;
    combinedBytes.set(usernameBytes, offset);
    offset += usernameBytes.length;
    combinedBytes.set(passwordBytes, offset);
//resposta
    return this.http.post(this.apiUrl, combinedBytes.buffer, { headers, responseType: 'arraybuffer' }).pipe(
      map(response => {

        const decoder = new TextDecoder('utf-8', { fatal: false });
        let decodedResponse = decoder.decode(response);
        decodedResponse = this.sanitizeResponse(decodedResponse);
        console.log('***a resposta recebida é:****', response);

        // Verifica se a resposta decodificada é um número
        const responseNumber = Number(decodedResponse.trim());

        // Verifica se o retorno é 0 ou 2 para tratamento de erros
        //criar mensagem e estilo no componente login
        if (responseNumber === 0) {
          
          throw new Error('Usuário ou senha incorretos.');
        } else if (responseNumber === 2) {
          throw new Error('Usuário já está logado.');
        }
        
        // Continua se não for 0 ou 2 (erros)
        try {
          const parsedResponse: LoginResponse = JSON.parse(decodedResponse);

          if (parsedResponse) {
            
            localStorage.setItem('SessaoID', parsedResponse.SessaoID);
            localStorage.setItem('IdUsuario', parsedResponse.IdUsuario.toString());
            localStorage.setItem('NomeUsuario', parsedResponse.NomeUsuario); // Armazenamento do nome do usuário
            localStorage.setItem('PrivilegioUsuario', parsedResponse.PrivilegioUsuario.toString());
            localStorage.setItem('UnidadeUsuario', parsedResponse.UnidadeUsuario.toString());
            localStorage.setItem('AcessoProducao', parsedResponse.AcessoProducao.toString());
            localStorage.setItem('AcessoEmpresa1', parsedResponse.AcessoEmpresa1.toString());
            localStorage.setItem('AcessoEmpresa2', parsedResponse.AcessoEmpresa2.toString());
            console.log("erro", decodedResponse);
          }

          return parsedResponse;
        } catch (error) {
          console.error('Erro ao parsear resposta como JSON:', error);
          throw new Error(`Erro ao parsear JSON. Resposta decodificada: ${decodedResponse}`);
        }
      }),
      catchError(error => {
        console.error('Erro ao fazer login', error);
        return throwError(() => error);
      })
    );
  }

  // remove caracteres inválidos da string decodificada
  private sanitizeResponse(response: string): string {
    // Remove caracteres de controle e não imprimíveis
    return response.replace(/[^\x20-\x7E]/g, '');
  }

  // Função para verificar se a string se parece com um JSON
  private isLikelyJson(response: string): boolean {
    const trimmed = response.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  // logout para remover as informações do localstorage
  //alterar posteriormente para ficar logado apenas por tempo determinado
  logout(): void {
    localStorage.removeItem('SessaoID');
  }

  // Verifica se o usuário está autenticado ao verificar a presença de SessaoID no localStorage
  isAuthenticated(): boolean {
    return !!localStorage.getItem('SessaoID');
  }

  // Função privada que criptografa a senha usando SHA256 com um salt
  private encryptPassword(password: string, salt: string): string {
    const saltedPassword = password + salt;
    const hash = CryptoJS.SHA256(saltedPassword); // Aplica a função hash SHA256
    return CryptoJS.enc.Base64.stringify(hash); // Retorna a senha criptografada em Base64
  }

  // Função privada que codifica uma string em bytes, + tamanho da string
   private encodeWithLength(str: string): Uint8Array {
    const stringBytes = new TextEncoder().encode(str); // Codifica a string em UTF-8
    const length = stringBytes.length; // Obtém o comprimento da string em bytes

    // Cria um array de 2 bytes para armazenar o comprimento da string
    const lengthBytes = new Uint8Array(2);
    lengthBytes[0] = (length >> 8) & 0xff; // Primeiro byte do comprimento
    lengthBytes[1] = length & 0xff; // Segundo byte do comprimento

    // Combina os bytes de comprimento com os bytes da string
    const combined = new Uint8Array(lengthBytes.length + stringBytes.length);
    combined.set(lengthBytes, 0);
    combined.set(stringBytes, lengthBytes.length);
    return combined;
  }

  // Função privada que converte um número em um array de 4 bytes
  private numberToBytes({ num }: { num: number; }): Uint8Array {
    const byteArray = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      byteArray[3 - i] = (num >> (i * 8)) & 0xff; // Quebra o número em bytes
    }
    return byteArray;
  }

  // converte uma versão numérica em 2 bytes
  private versionToBytes(version: number): Uint8Array {
    const byteArray = new Uint8Array(2);
    byteArray[0] = (version >> 8) & 0xff; // Primeiro byte da versão
    byteArray[1] = version & 0xff; // Segundo byte da versão
    return byteArray;
  }
  
}
