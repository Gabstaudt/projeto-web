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
  PrivilegioUsuario: number;
  UnidadeUsuario: number;
  AcessoProducao: number;
  AcessoEmpresa1: number;
  AcessoEmpresa2: number;
  SessaoID: string;
}

@Injectable({
  providedIn: 'root' // Torna este serviço disponível globalmente no app
})
export class AuthService {
  private apiUrl = 'http://10.20.96.221:8043/dados'; 

  constructor(private http: HttpClient) { } // Injeta o HttpClient para fazer requisições HTTP

  // Função de login que aceita username e password, e retorna um Observable com a resposta
  login(username: string, password: string): Observable<LoginResponse> {
    const AppCommand = 240; // Valor fixo (comando da aplicação)
    const Plataform = 3; // Valor fixo para a plataforma
    const Version = 1; // Versão 
    const GadjetID = biri(); //ID aleatório para o dispositivo usando a função biri

    const headers = new HttpHeaders({
      'Content-Type': 'application/json' //tipo de conteúdo da requisição como JSON
    });

    // criptografia da senha com salt
    const salt = 'super teste do carai'; 
    const passwordHash = this.encryptPassword(password, salt); // Chama a função para criptografar a senha

    // Conversão dos números em arrays de bytes
    const appCommandBytes = this.numberToBytes({ num: AppCommand }).subarray(3); //subtraindo os primeiros 3 bytes porque formaram 4
    const plataformBytes = this.numberToBytes({ num: Plataform }).subarray(3); 
    const versionBytes = this.versionToBytes(Version); 
    const gadjetIDBytes = this.encodeWithLength(GadjetID); // ID do dispositivo em bytes
    const usernameBytes = this.encodeWithLength(username); // nome de usuário em bytes
    const passwordBytes = this.encodeWithLength(passwordHash); // senha criptografada em bytes

    //arrays de bytes em um único array
    const combinedBytes = new Uint8Array(
      appCommandBytes.length +
      plataformBytes.length +
      versionBytes.length +
      gadjetIDBytes.length +
      usernameBytes.length +
      passwordBytes.length
    );

    // Preenche o array combinado com os arrays individuais
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

    //requisição HTTP para o servidor passando o array de bytes como corpo da requisição
    return this.http.post<LoginResponse>(this.apiUrl, combinedBytes.buffer, { headers }).pipe(
      map(response => { // Manipula a resposta do servidor
        if (response) {
          
          // Armazena os dados do usuário no localStorage se a resposta for válida
          localStorage.setItem('SessaoID', response.SessaoID);
          localStorage.setItem('IdUsuario', response.IdUsuario.toString());
          localStorage.setItem('PrivilegioUsuario', response.PrivilegioUsuario.toString());
          localStorage.setItem('UnidadeUsuario', response.UnidadeUsuario.toString());
          localStorage.setItem('AcessoProducao', response.AcessoProducao.toString());
          localStorage.setItem('AcessoEmpresa1', response.AcessoEmpresa1.toString());
          localStorage.setItem('AcessoEmpresa2', response.AcessoEmpresa2.toString());
        }
        return response;
      }),
      catchError(error => { // Manipula os erros de requisição
        if (error.status) {
          console.error(`Erro Status: ${error.status}`);
        }
        if (error.error && error.error.message) {
          console.error(`Mensagem de erro: ${error.error.message}`);
        } else {
          console.error(`Erro genérico: ${error.message}`);
        }
        console.error('Detalhes do erro:', error);

        // Retorna o erro utilizando o operador 
        return throwError(() => error);
      })
    );
  }

  // Função de logout que remove os dados da sessão do localStorage
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

