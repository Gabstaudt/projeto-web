import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, interval} from 'rxjs';
import { catchError, map, switchMap} from 'rxjs/operators';
import { EntradaService } from '../auth/entrada.service';
import { encodeWithLength } from '../../../app/utils/encoder.utils'; 


@Injectable({
  providedIn: 'root'
})
export class TerceiraRequisicaoService {
  // private apiUrl = 'http://172.74.0.167:8043/dados'; 

  private apiUrl = 'http://200.178.173.133:8043/dados';

  // private apiUrl = 'http://localhost:3000/resposta2';


  private setoresGlobais: any[] = []; // Lista global de setores
  private intervaloRequisicao = 60000 ;
  private entradaService?: EntradaService;

  constructor(
    private injector: Injector,
    private http: HttpClient) {}

    private getEntradaService(): EntradaService {
      if (!this.entradaService) {
        this.entradaService = this.injector.get(EntradaService);
      }
      return this.entradaService;
    }

  //-------------------------------------------- Função para enviar a requisição ----------------------------------------------------------------
  enviarComandoSalvar(): Observable<any> {
    const sessaoId = this.obterSessaoIdDoLocalStorage();
    if (!sessaoId) {
      return throwError(() => new Error('Sessão ID ausente!'));
    }
  
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const comandoSupervisao = 254;
    const comandoLerDados = 236;
  
    const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoLerDados);
    console.log('Corpo da terceira requisição (bytes):', body);
  
    return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' }).pipe(
      map(response => this.processarResposta(response)),
      catchError(err => {
        console.error('Erro na terceira requisição:', err);
        return throwError(() => new Error('Erro na terceira requisição'));
      })
    );
  }
  

//função para atualizar // realizar a requisição de novo ---> modificar -- não está funcionando
iniciarRequisicoesPeriodicas(): Observable<any> {
  const sessaoId = this.obterSessaoIdDoLocalStorage();
  if (!sessaoId) {
    console.warn('Sessão ID ausente. Não é possível iniciar requisições periódicas.');
    return throwError(() => new Error('Sessão ID ausente!'));
  }

  return interval(this.intervaloRequisicao).pipe(
    switchMap(() => this.enviarComandoSalvar())
  );
}
  //------------------------------------------------ Função para gerar os bytes -----------------------------------------------------------------------
  private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoLerDados: number): ArrayBuffer {
    const sessaoIdBytes = encodeWithLength(sessaoId);
    const comandoSupervisaoBytes = new Uint8Array([comandoSupervisao]);
    const comandoLerDadosBytes = new Uint8Array([comandoLerDados]);

    const combinedBytes = new Uint8Array(comandoSupervisaoBytes.length + sessaoIdBytes.length + comandoLerDadosBytes.length);
    combinedBytes.set(comandoSupervisaoBytes, 0);
    combinedBytes.set(sessaoIdBytes, comandoSupervisaoBytes.length);
    combinedBytes.set(comandoLerDadosBytes, comandoSupervisaoBytes.length + sessaoIdBytes.length);

    return combinedBytes.buffer;
  }

  private processarResposta(buffer: ArrayBuffer): any {
    // this.saveBytesToFile(new Uint8Array(buffer), 'respostadaterceira.bin'); 

    let offset = 0; 
    const dataView = new DataView(buffer);

    const respostaOK = dataView.getUint8(offset);
    console.log('Resposta de status:', respostaOK); 
    offset += 1;

    const atualizacaoDisponivel = dataView.getUint8(offset);
    console.log('Resposta de att:', atualizacaoDisponivel); 
    offset += 1;

    const quantidadeSetores = dataView.getUint16(offset);
    console.log('Quantidade de setores:', quantidadeSetores); 
    offset += 2;

    const setores: any[] = [];

    // Laço 1: Processa cada setor
    for (let i = 0; i < quantidadeSetores; i++) {
      const idSetor = dataView.getUint16(offset); 
      offset += 2;

      const tempoInformacao = Number(dataView.getBigUint64(offset)); // (Unix)
      offset += 8;
      console.log(`Setor ID ${idSetor}: tempoInformacao recebido do servidor (Unix): ${tempoInformacao}`);

      const status = dataView.getUint8(offset); 
      offset += 1;

      const quantidadeInteiros = dataView.getUint8(offset); 
      offset += 1;

      const quantidadeBooleanos = dataView.getUint8(offset); 
      offset += 1;

      const quantidadeAlarmes = dataView.getUint8(offset); 
      offset += 1;

      // Arrays para armazenar os dados processados
      const inteiros: { id: number, valor: number }[] = [];
      const booleanos: { id: number }[] = [];
      const alarmes: { id: number, tempo: Date }[] = [];

        
        
      
     // Laço 2: Processa as tags inteiras
        for (let j = 0; j < quantidadeInteiros; j++) {
          const idTagInteira = dataView.getUint16(offset); 
          offset += 2;
          const valorTagInteira = dataView.getUint32(offset); 
          offset += 4;
          inteiros.push({ id: idTagInteira, valor: valorTagInteira });
        }

      // Laço 3: Processa as tags booleanas (somente o ID)
      for (let j = 0; j < quantidadeBooleanos; j++) {
        const idTagBooleana = dataView.getUint16(offset);
        offset += 2;
        booleanos.push({ id: idTagBooleana });
      }

      // Laço 4: Processa os valores booleanos em bits, agrupados em bytes
      const quantidadeBytesBooleanos = Math.ceil(quantidadeBooleanos / 8);
      const valoresBooleanos: boolean[] = [];
      for (let j = 0; j < quantidadeBytesBooleanos; j++) {
        const byteValores = dataView.getUint8(offset); // Lê um byte de valores booleanos
        offset += 1;
        for (let bit = 0; bit < 8 && (j * 8 + bit) < quantidadeBooleanos; bit++) {
          valoresBooleanos.push((byteValores & (1 << bit)) !== 0); // Extrai o bit e converte para boolean
        }
      }

      // Laço 5: Processa os alarmes (ID e tempo)
      for (let j = 0; j < quantidadeAlarmes; j++) {
        const idAlarme = dataView.getUint16(offset); 
        offset += 2;
        const tempoAlarme = Number(dataView.getBigUint64(offset)); // (Unix)
        offset += 8;
        alarmes.push({ id: idAlarme, tempo: new Date(tempoAlarme * 1000 + (3 * 3600000)) }); // Converte Unix para Data e adiciona 3 horas
      }

      const quantidadeBytesAlarmes = Math.ceil(quantidadeAlarmes / 8);
      const valoresAlarmes: boolean[] = [];
      for (let j = 0; j < quantidadeBytesAlarmes; j++) {
        const byteValores = dataView.getUint8(offset); 
        offset += 1;
        for (let bit = 0; bit < 8 && (j * 8 + bit) < quantidadeAlarmes; bit++) {
          valoresAlarmes.push((byteValores & (1 << bit)) !== 0); // Extrai o bit
        }
      }

      // Adiciona os dados do setor ao array de setores
      setores.push({
        id: idSetor,
        ultimoTempo: new Date(tempoInformacao * 1000 + (3 * 3600000)), // Converte Unix para Data e adiciona 3 horas
        status: status,
        inteiros: inteiros,
        booleanos: booleanos,
        valoresBooleanos: valoresBooleanos,
        alarmes: alarmes
      });
    }
    console.log("setores recebidos", setores);

    // Atualiza a lista global com os setores recebidos
    this.atualizarSetoresGlobais(setores);
    
    return setores; 
  }

  public atualizarSetoresGlobais(setoresRecebidos: any[]): void {
    const listaGlobal = this.getEntradaService().listaGlobal;
  
    setoresRecebidos.forEach(novoSetor => {
        const setorExistente = listaGlobal.find((s: any) => s.id === novoSetor.id);
  
        if (setorExistente) {
            // Atualiza propriedades do setor
            setorExistente.status = novoSetor.status;
            setorExistente.ultimoTempo = novoSetor.ultimoTempo;
  
            // Inicializa todas as tags como vazias
            setorExistente.tags.forEach((tag: any) => tag.vazia = true);
  
            // Atualiza tags inteiras (leituraInt)
            novoSetor.inteiros.forEach((novaTagInt: any) => {
                const tagExistente = setorExistente.tags.find((tag: any) => tag.id === novaTagInt.id);
                if (tagExistente) {
                    tagExistente.leituraInt = novaTagInt.valor;
                    tagExistente.vazia = false; 
                }
            });
  
            // Atualiza tags booleanas (leituraBool)
            novoSetor.booleanos.forEach((novaTagBool: any, index: number) => {
                const tagExistente = setorExistente.tags.find((tag: any) => tag.id === novaTagBool.id);
                if (tagExistente && novoSetor.valoresBooleanos[index] !== undefined) {
                    tagExistente.leituraBool = novoSetor.valoresBooleanos[index];
                    tagExistente.vazia = false; 
                }
            });
        } else {
            console.log(`Setor com ID ${novoSetor.id} não encontrado na lista global.`);
        }
    });
  
    console.log("Lista global atualizada após receber dados.");
  }
  
  private obterSessaoIdDoLocalStorage(): string {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const dadosUsuario = JSON.parse(usuario);
      return dadosUsuario.SessaoID || ''; // Retorna o SessaoID se disponível
    }
    console.warn('Sessão ID não encontrada no localStorage.');
    return ''; // Retorna string vazia se não existir
  }

  // private saveBytesToFile(bytes: Uint8Array, fileName: string): void {
  //   // Converte o Uint8Array para um Blob
  //   const blob = new Blob([bytes], { type: 'application/octet-stream' });
    
  //   // Cria uma URL para o Blob
  //   const url = window.URL.createObjectURL(blob);
  
  //   // Cria um elemento de link para baixar o arquivo
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = fileName;
  //   document.body.appendChild(a);
  //   a.click(); // Dispara o clique para baixar o arquivo
  
  //   // Remove o elemento de link da página
  //   document.body.removeChild(a);
  
  //   // Libera a URL criada para o Blob
  //   window.URL.revokeObjectURL(url);
  // }
  
}