import { Injectable } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import CryptoJS from 'crypto-js';
import biri from 'biri';

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

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const AppCommand = 240;
    const Plataform = 3;
    const Version = 1;
    const GadjetID = biri();

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const salt = 'super teste do carai';
    const passwordHash = this.encryptPassword(password, salt);

    const appCommandBytes = this.numberToBytes({ num: AppCommand }).subarray(3);
    const plataformBytes = this.numberToBytes({ num: Plataform }).subarray(3);
    const versionBytes = this.versionToBytes(Version);
    const gadjetIDBytes = this.encodeWithLength(GadjetID);
    const usernameBytes = this.encodeWithLength(username);
    const passwordBytes = this.encodeWithLength(passwordHash);

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

    return this.http.post(this.apiUrl, combinedBytes.buffer, { headers, responseType: 'arraybuffer' }).pipe(
      map(response => {
        const byteArray = new Uint8Array(response);

        // Chama a função para interpretar os bytes
        const parsedResponse = this.parseLoginResponse(byteArray);
        
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

        return parsedResponse;
      }),
      catchError(error => {
        console.error('Erro ao fazer login', error);
        return throwError(() => error);
      })
    );
  }

  // Função para interpretar os bytes da resposta
  private parseLoginResponse(bytes: Uint8Array): LoginResponse {
    let offset = 0;

    // 1 byte: respostaOK
    const respostaOK = bytes[offset];
    offset += 1;

    // 4 bytes: IdUsuario (Big-endian)
    const IdUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 16 bytes: NomeUsuario (UTF-8 string)
    const NomeUsuario = this.bytesToString(bytes.slice(offset, offset + 18));
    offset += 18;

    // 4 bytes: PrivilegioUsuario 
    const PrivilegioUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 4 bytes: UnidadeUsuario 
    const UnidadeUsuario = this.bytesToInt32(bytes.slice(offset, offset + 4));
    offset += 4;

    // 1 byte: AcessoProducao
    const AcessoProducao = bytes[offset];
    offset += 1;

    // 1 byte: AcessoEmpresa1
    const AcessoEmpresa1 = bytes[offset];
    offset += 1;

    // 1 byte: AcessoEmpresa2
    const AcessoEmpresa2 = bytes[offset];
    offset += 1;

    // 32 bytes: SessaoID (UTF-8 string)
    const SessaoID = this.bytesToString(bytes.slice(offset, offset + 34));

    // Retorna o objeto mapeado
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

  // Função para converter 4 bytes para um inteiro (Big-endian)
  private bytesToInt32(bytes: Uint8Array): number {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  }

  // Função para converter bytes para uma string (UTF-8)
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder('utf-8').decode(bytes);
  }

  private encryptPassword(password: string, salt: string): string {
    const saltedPassword = password + salt;
    const hash = CryptoJS.SHA256(saltedPassword);
    return CryptoJS.enc.Base64.stringify(hash);
  }

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

  private numberToBytes({ num }: { num: number; }): Uint8Array {
    const byteArray = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      byteArray[3 - i] = (num >> (i * 8)) & 0xff;
    }
    return byteArray;
  }

  private versionToBytes(version: number): Uint8Array {
    const byteArray = new Uint8Array(2);
    byteArray[0] = (version >> 8) & 0xff;
    byteArray[1] = version & 0xff;
    return byteArray;
  }
}