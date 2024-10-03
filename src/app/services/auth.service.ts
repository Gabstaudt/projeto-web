import { Injectable } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import CryptoJS from 'crypto-js';
import biri from 'biri';

// o que a interface irá receber de login
interface LoginResponse {
  respostaOK: number;          //resposta 200 OK
  IdUsuario: number;           
  NomeUsuario: string;         
  PrivilegioUsuario: number;   // Nível de privilégio do usuário
  UnidadeUsuario: number;      // Unidade do usuário
  AcessoProducao: number;      // Acesso à produção
  AcessoEmpresa1: number;      // Acesso à empresa 1
  AcessoEmpresa2: number;      // Acesso à empresa 2
  SessaoID: string;            // ID da sessão-gerada pelo servidor diferente a cada sessão
}

@Injectable({
  providedIn: 'root' 
})
export class AuthService {
 
  private apiUrl = 'http://10.20.96.221:8043/dados';

  constructor(private http: HttpClient) {} // Injeta o HttpClient 

  // realizar o login, recebendo usuário e senha
  login(username: string, password: string): Observable<LoginResponse> {
    const AppCommand = 240;   // Comando da aplicação - fixo
    const Plataform = 3;      // Plataforma do dispositivo - fixo
    const Version = 1;        // Versão da aplicação - fixo 
    const GadjetID = biri();  // id único gerado pela biblioteca biri

    // cabeçalhos para a requisição HTTP
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded' // para não fazer a "pré requisição" options
    });


    const salt = 'super teste do carai';
    const passwordHash = this.encryptPassword(password, salt); // Criptografa a senha

    // Converte os comandos e parâmetros em arrays de bytes
    const appCommandBytes = this.numberToBytes({ num: AppCommand }).subarray(3);
    const plataformBytes = this.numberToBytes({ num: Plataform }).subarray(3);
    const versionBytes = this.versionToBytes(Version);
    const gadjetIDBytes = this.encodeWithLength(GadjetID);
    const usernameBytes = this.encodeWithLength(username);
    const passwordBytes = this.encodeWithLength(passwordHash);

    // Combina todos os arrays de bytes em um único array
    const combinedBytes = new Uint8Array(
      appCommandBytes.length +
      plataformBytes.length +
      versionBytes.length +
      gadjetIDBytes.length +
      usernameBytes.length +
      passwordBytes.length
    );

    // Preenche o array combinado com os bytes individuais
    let offset = 0; // Inicializa o deslocamento

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

    // envio da requisição POST e processa a resposta
    return this.http.post(this.apiUrl, combinedBytes.buffer, { headers, responseType: 'arraybuffer' }).pipe(
      map(response => {
        const byteArray = new Uint8Array(response); // Converte a resposta em um array de bytes
        
        // Chama a função para interpretar os bytes da resposta
        const parsedResponse = this.parseLoginResponse(byteArray);
        
        // Armazena os dados no localstorage
        if (parsedResponse) {
          localStorage.setItem('SessaoID', parsedResponse.SessaoID);
          localStorage.setItem('IdUsuario', parsedResponse.IdUsuario.toString());
          localStorage.setItem('NomeUsuario', parsedResponse.NomeUsuario); 
          localStorage.setItem('PrivilegioUsuario', parsedResponse.PrivilegioUsuario.toString());
          localStorage.setItem('UnidadeUsuario', parsedResponse.UnidadeUsuario.toString());
          localStorage.setItem('AcessoProducao', parsedResponse.AcessoProducao.toString());
          localStorage.setItem('AcessoEmpresa1', parsedResponse.AcessoEmpresa1.toString());
          localStorage.setItem('AcessoEmpresa2', parsedResponse.AcessoEmpresa2.toString());
        }

        return parsedResponse; // Retorna a resposta analisada
      }),
      catchError(error => {
        console.error('Erro ao fazer login', error); // Loga o erro no console
        return throwError(() => error); 
      })
    );
  }

  //------------ Função para interpretar os bytes da resposta do login-------------
  private parseLoginResponse(bytes: Uint8Array): LoginResponse {
    let offset = 0; // Inicializa o deslocamento

    // 1 byte: respostaOK - status da resposta -- que sempre vai ser 200 OK
    const respostaOK = bytes[offset];
    offset += 1; // Avança o deslocamento

    // 4 bytes: ID do usuário
    const IdUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 2 bytes: comprimento do NomeUsuario
    const nomeUsuarioLength = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;

    // leitura do nome de usuário recebido com o comprimento especificado nos 2 bytes anteriores
    const NomeUsuario = this.bytesToString(bytes.slice(offset, offset + nomeUsuarioLength));
    offset += nomeUsuarioLength; // Avança o deslocamento 

    // 4 bytes: PrivilegioUsuario 
    const PrivilegioUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 4 bytes: UnidadeUsuario
    const UnidadeUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 1 byte: AcessoProducao  // trocar para boleano posteriormente + ajustes
    const AcessoProducao = bytes[offset];
    offset += 1;

    // 1 byte: AcessoEmpresa1  // ajustar para boleoano post.
    const AcessoEmpresa1 = bytes[offset];
    offset += 1;

    // 1 byte: AcessoEmpresa2 // ajustar para boleano post.
    const AcessoEmpresa2 = bytes[offset];
    offset += 1;

    // 2 bytes: comprimento do cod SessaoID
    const SessaoIDLength = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;

    //32 bytes - tamanho fixo - lido após os 2 primeiros bytes declararem o tamanho
    const SessaoID = this.bytesToString(bytes.slice(offset, offset + SessaoIDLength));
   

    
    // Retorna o objeto mapeado com todos os dados
    return {
      respostaOK,
      IdUsuario,
      NomeUsuario,
      PrivilegioUsuario,
      UnidadeUsuario,
      AcessoProducao,
      AcessoEmpresa1,
      AcessoEmpresa2,
      SessaoID
    };
  }

  // Função para converter 4 bytes em um inteiro 
  private bytesToInt32(bytes: Uint8Array): number {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  }

  // Função para converter o array de bytes em uma string UTF-8
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder('utf-8').decode(bytes);
  }

  // Função para criptografar a senha com um salt
  private encryptPassword(password: string, salt: string): string {
    const saltedPassword = password + salt; // Combina a senha com o salt
    const hash = CryptoJS.SHA256(saltedPassword); // Gera o hash usando SHA256
    return CryptoJS.enc.Base64.stringify(hash); // Retorna o hash em formato Base64
  }

  // Função para codificar uma string com o comprimento em bytes
  private encodeWithLength(str: string): Uint8Array {
    const stringBytes = new TextEncoder().encode(str); // Converte a string em bytes
    const length = stringBytes.length; // Obtém o comprimento da string

    // Cria um array para armazenar o comprimento em 2 bytes
    const lengthBytes = new Uint8Array(2);
    lengthBytes[0] = (length >> 8) & 0xff; //byte alto
    lengthBytes[1] = length & 0xff;       

    // Combina os bytes do comprimento e da string
    const combined = new Uint8Array(lengthBytes.length + stringBytes.length);
    combined.set(lengthBytes, 0); // Adiciona os bytes do comprimento
    combined.set(stringBytes, lengthBytes.length); // Adiciona os bytes da string
    return combined; // Retorna o array combinado
  }

  // Função para converter um número em um array de 4 bytes
  private numberToBytes({ num }: { num: number; }): Uint8Array {
    const byteArray = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      byteArray[3 - i] = (num >> (i * 8)) & 0xff; 
    }
    return byteArray; // Retorna o array de bytes
  }

  // Função para converter a versão em um array de 2 bytes
  private versionToBytes(version: number): Uint8Array {
    const byteArray = new Uint8Array(2);
    byteArray[0] = (version >> 8) & 0xff; 
    byteArray[1] = version & 0xff;       
    return byteArray; // Retorna o array de bytes
  }
}