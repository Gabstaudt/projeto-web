import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Alarme } from '../../models/alarme.model';
import { Setor } from '../../models/setor.model';
import { Tag } from '../../models/tag.model';
import {TerceiraRequisicaoService} from '../authdados/dados.service'

@Injectable({
  providedIn: 'root'
})
export class EntradaService {
  private apiUrl = 'http://172.74.0.167:8043/dados'; 
  
  public listaGlobal: Setor[] = []; 

  private setoresSubject = new BehaviorSubject<Setor[]>([]);
  public setores$: Observable<Setor[]> = this.setoresSubject.asObservable();

  constructor(private http: HttpClient,
    private TerceiraRequisicaoService: TerceiraRequisicaoService 
  ) {}

  
 
  public carregarSetores(sessaoId:string): void{
    this.fazerSegundaRequisicao(sessaoId).subscribe(
      (setores)=> this.setoresSubject.next(setores),
      (error)=> console.error('Erro ao carregar setores:', error)
    );
  }

  // Função para fazer a segunda requisição, recebendo a Sessão ID como parâmetro ---  redefinir na pasta entrada depois para receber o id
  public fazerSegundaRequisicao(sessaoId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }); 

    
    const comandoSupervisao = 254;
    const comandoEstrutura = 237; 

    // Construir os bytes da requisição
    const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoEstrutura);
   
  

   
    return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' }).pipe(
      
      // Manipulação da resposta
      map(response => {
        const byteArray = new Uint8Array(response); 
        console.log('Resposta recebida (bytes):', byteArray); 

        const setores = this.parseSecondResponse(byteArray); 
        console.log('Setores processados:', setores); 
        console.log('Lista completa de setores:', JSON.stringify(setores, null, 2));


        return setores; 
      }),
      switchMap(setores => {
        console.log('Chamando a terceira requisição após a segunda');
        return this.TerceiraRequisicaoService.enviarComandoSalvar(sessaoId);  // Chama a terceira requisição aqui
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
  public parseSecondResponse(bytes: Uint8Array): Setor[] {

    let offset = 0; 

    // this.saveBytesToFile(bytes, 'resposta.bin');

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
      console.log("id do setor", setor.id);

      const nomeSetorLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      setor.nome = this.bytesToString(bytes.slice(offset, offset + nomeSetorLength)); 
      offset += nomeSetorLength;
      console.log("Tamanho do nome", nomeSetorLength);
      console.log("nome do setor loop 1", setor.nome);

      //  campos do Setor
      const enderecoLength = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      setor.endereco = this.bytesToString(bytes.slice(offset, offset + enderecoLength)); 
      offset += enderecoLength;
      console.log('Tamanho do endereço:', enderecoLength);
      console.log("nome do endereço", setor.endereco);
      
      setor.latitude = this.bytesToFloat(bytes.slice(offset, offset + 4)); 
      offset += 4;
      console.log("Latitude recebida:", setor.latitude);

      setor.longitude = this.bytesToFloat(bytes.slice(offset, offset + 4)); 
      offset += 4;
      console.log("Longitude recebida", setor.longitude);

      setor.unidade = bytes[offset]; 
      offset += 1;
      console.log("unidade recebida", setor.unidade);

      setor.subunidade = bytes[offset]; 
      offset += 1;
      console.log("subunidade recebida", setor.subunidade);
      
      setor.status = bytes[offset]; 
      offset += 1;
      console.log("status recebido", setor.status);

      setor.tipo = bytes[offset];
      offset += 1;
      console.log("tipo recebido:", setor.tipo);


       // Tamanho do array gráfico (1 byte)
      const tamanhoGrafico = bytes[offset]; 
      offset += 1; 
      console.log("Tamanho do gráfico recebido:", tamanhoGrafico);

      // Tamanho real do array gráfico
      const tamanhoRealArrayGrafico = tamanhoGrafico * 2; 
      console.log("Tamanho real do gráfico:", tamanhoRealArrayGrafico);

      // Criar o array gráfico com o tamanho real
      const arrayGrafico = new Uint16Array(tamanhoGrafico); // Aqui usamos tamanhoGrafico ao invés de tamanhoRealArrayGrafico

      // Lê os bytes do array gráfico (tamanhoRealArrayGrafico é a quantidade total de bytes a serem lidos)
      for (let j = 0; j < tamanhoGrafico; j++) {
          arrayGrafico[j] = (bytes[offset] << 8) | bytes[offset + 1]; 
          offset += 2; 
      }

      console.log("Array gráfico:", arrayGrafico);

      console.log("--------------FINAL DE 1 LOOPING DE SETOR--------------")



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
        console.log("id da tag recebida:", tag.id);


        const nomeTagLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        tag.nome = this.bytesToString(bytes.slice(offset, offset + nomeTagLength)); 
        offset += nomeTagLength;
        console.log("tamanho do nome do setor", nomeTagLength);
        console.log("nome do setor", tag.nome);
      
        // Lê outros campos da Tag 

        const descricaoLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        tag.descricao = this.bytesToString(bytes.slice(offset, offset + descricaoLength)); 
        offset += descricaoLength;
        console.log("tamanho da descrição:",descricaoLength);
        console.log("descrição da tag", tag.descricao);

        tag.tipo = bytes[offset]; 
        offset += 1;
        console.log("tipos", tag.tipo);

        tag.max = bytes[offset]; 
        offset += 4;
        console.log ("máximo", tag.max);

        tag.min = bytes[offset]; 
        offset += 4;
        console.log("minimo", tag.min);

        tag.status = bytes[offset];
        offset += 1;
        console.log("status", tag.status);

        console.log("--------------FINAL DE 1 LOOPING DE TAG--------------")

        tags.push(tag); 
      }

      console.log("---------------FINAL DO LOOPING DE TAGS------------")

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
        console.log("id do alarme", alarme.id);

        alarme.idTag = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        console.log("id tag de alarme", alarme.idTag);

        const nomeAlarmeLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        alarme.nome = this.bytesToString(bytes.slice(offset, offset + nomeAlarmeLength));
        offset += nomeAlarmeLength;
        console.log("tamanho do nome do alarme", nomeAlarmeLength);
        console.log("nome do alarme", alarme.nome);


        const descricaoLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        alarme.descricao = this.bytesToString(bytes.slice(offset, offset + descricaoLength)); 
        offset += descricaoLength;
        console.log("tamanho da descrição do alarme", descricaoLength);
        console.log("descrição alarme", alarme.descricao);

        alarme.tipo = bytes[offset]; 
        offset += 1;
        console.log("tipo do alarme", alarme.tipo);

        alarme.valorEntrada = bytes[offset]; 
        offset += 4;
        console.log("entrada alarme", alarme.valorEntrada);

        alarme.valorSaida = bytes[offset]; 
        offset += 4;
        console.log("valor da saida do alarme", alarme.valorSaida);


        alarme.ativo = bytes[offset]; 
        offset += 1;
        console.log ("atividade alarme", alarme.ativo);

        console.log("--------------FINAL DE 1 LOOPING DE ALARME--------------")


        alarmes.push(alarme); // array de alarmes do setor
      }

      setor.alarmes = alarmes;
      setores.push(setor);
    }
    this.listaGlobal = setores;
    this.atualizarListaGlobal(setores);


    console.log("Lista global :", this.listaGlobal);
    console.log("Lista de setor", setores)
    
    this.setoresSubject.next(setores); 
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
    if (bytes.length !== 4) {
        throw new Error('O array de bytes para conversão em float deve ter 4 bytes.');
    }

   
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    
    
    return view.getFloat32(0, false); 
}
private atualizarListaGlobal(setoresRecebidos: Setor[]): void {
  setoresRecebidos.forEach(novoSetor => {
    // Procura o setor na lista global
    const indiceExistente = this.listaGlobal.findIndex(setor => setor.id === novoSetor.id);

    if (indiceExistente !== -1) {
      // Atualiza o setor existente
      const setorExistente = this.listaGlobal[indiceExistente];
      setorExistente.status = novoSetor.status; // Atualiza o status
      setorExistente.ultimoTempo = novoSetor.ultimoTempo; // Atualiza o último tempo
      
      // Atualiza tags
      novoSetor.tags.forEach(novaTag => {
        const indiceTagExistente = setorExistente.tags.findIndex(tag => tag.id === novaTag.id);
        if (indiceTagExistente !== -1) {
          // Atualiza a tag existente
          const tagExistente = setorExistente.tags[indiceTagExistente];
          tagExistente.leituraInt = novaTag.leituraInt; // Atualiza a leitura inteira
          tagExistente.leituraBool = novaTag.leituraBool; // Atualiza a leitura booleana
        }
      });

      // Atualiza alarmes
      novoSetor.alarmes.forEach(novoAlarme => {
        const indiceAlarmeExistente = setorExistente.alarmes.findIndex(alarme => alarme.id === novoAlarme.id);
        if (indiceAlarmeExistente !== -1) {
          // Atualiza o alarme existente
          const alarmeExistente = setorExistente.alarmes[indiceAlarmeExistente];
          alarmeExistente.tempo = novoAlarme.tempo; // Atualiza o tempo
        }
      });
    }
  });

  
  
  this.listaGlobal.forEach(setor => {
    console.log("ID do Setor:ATUALIZAÇÃO DO SERVICE", setor.id);
    console.log("Status do SetorATUALIZAÇÃO DO SERVICE:", setor.status);
    console.log("Último Tempo do Setor:ATUALIZAÇÃO DO SERVICE", setor.ultimoTempo);
    
    // Exibir tags
    console.log("Tags ATUALIZAÇÃO DO SERVICE:");
    setor.tags.forEach(tag => {
      console.log(`  IDATUALIZAÇÃO DO SERVICE: ${tag.id}, Leitura Int: ${tag.leituraInt}, Leitura Bool: ${tag.leituraBool}`);
    });

    // Exibir alarmes
    console.log("AlarmesATUALIZAÇÃO DO SERVICE:");
    setor.alarmes.forEach(alarme => {
      console.log(`  ATUALIZAÇÃO DO SERVICEID: ${alarme.id}, Tempo: ${alarme.tempo}`);
    });

    console.log('-----------------------------------'); 
  });

  console.log("Lista global atualizada--- entrada servs:", this.listaGlobal);
}


// // // Função para salvar o Uint8Array em um arquivo
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