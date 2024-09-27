import { Injectable } from '@angular/core'; 
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, throwError } from 'rxjs'; 
import { catchError, map } from 'rxjs/operators';
import CryptoJS from 'crypto-js'; 
import biri from 'biri'; 

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
  providedIn: 'root' 
})
export class AuthService { 
  private apiUrl = 'http://localhost:3000/login'; 

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> { 
    const AppCommand = 240; 
    const Plataform = 3;
    const Version = 1;
    const GadjetID = biri(); 
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/octet-stream' 
    });

    const salt = 'super teste do carai';
    const passwordHash = this.encryptPassword(password, salt); 

    const appCommandBytes = this.numberToBytes({ num: AppCommand });
    const plataformBytes = this.numberToBytes({ num: Plataform });
    const versionBytes = this.versionToBytes(Version);
    const gadjetIDBytes = this.encodeWithLength(GadjetID);
    const usernameBytes = this.encodeWithLength(username);
    const passwordBytes = this.encodeWithLength(passwordHash); // Use o hash em Base64

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

    return this.http.post<LoginResponse>(this.apiUrl, combinedBytes.buffer, { headers }).pipe(
      map(response => {
        if (response) {
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
      catchError(error => {
        console.error('Erro ao fazer login', error);
        return throwError(error); 
      })
    );
  }

  logout(): void {
    localStorage.removeItem('SessaoID'); 
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('SessaoID'); 
  }

  private encryptPassword(password: string, salt: string): string {
    const saltedPassword = password + salt;
    const hash = CryptoJS.SHA256(saltedPassword); // Retorna um WordArray
    return CryptoJS.enc.Base64.stringify(hash); // Convertendo para Base64
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
    byteArray[0] = (version >> 8) & 0xff; // byte alto
    byteArray[1] = version & 0xff;        // byte baixo
    return byteArray;
  }
}
