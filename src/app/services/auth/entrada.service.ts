import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Alarme } from '../../models/alarme.model';
import { Setor } from '../../models/setor.model';
import { Tag } from '../../models/tag.model';
import {TerceiraRequisicaoService} from '../authdados/dados.service'
import { encodeWithLength } from 'src/app/utils/encoder.utils';

@Injectable({
  providedIn: 'root'
})
export class EntradaService {
  private apiUrl = 'http://172.74.0.167:8043/dados'; 
  // private apiUrl = 'http://localhost:3000/resposta1';

  
  public listaGlobal: Setor[] = []; 
  

  private setoresSubject = new BehaviorSubject<Setor[]>([]);
  public setores$: Observable<Setor[]> = this.setoresSubject.asObservable();


  constructor(private http: HttpClient,
    public TerceiraRequisicaoService: TerceiraRequisicaoService 
  ) {}
//////////////////////////////////////////////////////////////////////////////////////////////
  
public carregarSetores(): void {
  this.fazerSegundaRequisicao().pipe(
    map((setores: Setor[]) => {
      const permissoes = this.carregarPermissoesDoLocalStorage(); // Carrega permissões do localStorage
      console.log('Permissões obtidas:', permissoes);

      // Filtra os setores com base nas permissões
      const setoresFiltrados = setores.filter((setor: Setor) => 
        this.validarPermissaoSetor(setor, permissoes)
      );
      console.log('Setores filtrados:', setoresFiltrados);
      return setoresFiltrados;
    })
  ).subscribe(
    setoresPermitidos => {
      if (setoresPermitidos.length > 0) {
        this.setoresSubject.next(setoresPermitidos);
        this.listaGlobal = setoresPermitidos;
        console.log("Setores permitidos carregados com sucesso.");
      } else {
        console.warn("Nenhum setor permitido encontrado.");
      }
    },
    error => console.error('Erro ao carregar setores:', error)
  );
}



// Método para carregar permissões do local storage
private carregarPermissoesDoLocalStorage(): { UnidadeUsuario: number, AcessoProducao: boolean, AcessoEmpresa1: boolean, AcessoEmpresa2: boolean, PrivilegioUsuario: number } {
  const usuario = localStorage.getItem('usuario'); 
  if (usuario) {
      return JSON.parse(usuario);
  }
  return {
      UnidadeUsuario: 0,
      AcessoProducao: false,
      AcessoEmpresa1: false,
      AcessoEmpresa2: false,
      PrivilegioUsuario: 0
  }; 
}

private validarPermissaoSetor(setor: Setor, permissoes: { UnidadeUsuario: number, AcessoProducao: boolean, AcessoEmpresa1: boolean, AcessoEmpresa2: boolean, PrivilegioUsuario: number }): boolean {
  const { UnidadeUsuario, AcessoProducao, AcessoEmpresa1, AcessoEmpresa2, PrivilegioUsuario } = permissoes;

  if ((PrivilegioUsuario === 3 || PrivilegioUsuario === 5) && (setor.unidade !== UnidadeUsuario) && (setor.unidade !== 0)) {
      return false;
  }

  if (!AcessoProducao && (setor.unidade === 0)) {
      return false; 
  }

  if (!AcessoEmpresa1 && (setor.unidade === 11)) {
      return false; 
  }

  if (!AcessoEmpresa2 && (setor.unidade === 12)) {
      return false;
  }

  return true; 
}





//////////////////////////////////////////////////////////////////////////// função para fazer a segunda requisição/////////////////////////////////////////////////////////////////////


public fazerSegundaRequisicao(): Observable<any> {
  const sessaoId = this.obterSessaoIdDoLocalStorage();
  if (!sessaoId) {
    return throwError(() => new Error('Sessão ID ausente no localStorage!'));
  }

  const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
  const comandoSupervisao = 254;
  const comandoEstrutura = 237;

  const body = this.gerarBytesRequisicao(sessaoId, comandoSupervisao, comandoEstrutura);

  return this.http.post(this.apiUrl, body, { headers, responseType: 'arraybuffer' }).pipe(
    map(response => {
      const byteArray = new Uint8Array(response);
      console.log('Resposta recebida (bytes):', byteArray);

      const setores = this.parseSecondResponse(byteArray);
      console.log('Setores processados:', setores);
      console.log('Lista completa de setores:', JSON.stringify(setores, null, 2));

      return setores;
    })
  );
}


  // gerar os bytes da requisição
  private gerarBytesRequisicao(sessaoId: string, comandoSupervisao: number, comandoEstrutura: number): ArrayBuffer {
    const sessaoIdBytes = encodeWithLength(sessaoId);  

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

  // Variáveis de controle de acesso e privilégios
              

    let offset = 0; 

     this.saveBytesToFile(bytes, 'resposta.bin');

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


        alarmes.push(alarme); // Adiciona o alarme ao array
      }

      setor.alarmes = alarmes; // Atribui os alarmes ao setor

      // Carregar permissões do local storage
      const permissoes = this.carregarPermissoesDoLocalStorage(); // Método que retorna um objeto de permissões
      console.log("Permissões carregadas:", permissoes); // Debug para verificar se as permissões estão corretas

      // Verifica se o setor é permitido
      if (this.validarPermissaoSetor(setor, permissoes)) {
          setores.push(setor); // Adiciona o setor à lista se permitido
      } else {
          console.warn(`Setor ${setor.nome} não permitido para o usuário.`);
      }
  }

  this.listaGlobal = setores; // Atualiza a lista global com os setores processados
  this.atualizarListaGlobal(setores); // Atualiza a lista global conforme necessário

  console.log('Lista global após segunda requisição:', this.listaGlobal);

  console.log("Lista de setores:", setores);
  
  this.setoresSubject.next(setores); // Emite a lista de setores
  return setores; 
}


  public atualizarSetoresSubject(): void {
    this.setoresSubject.next(this.listaGlobal);
    
}




  // Função para converter bytes em string
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder('utf-8').decode(bytes); 
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
                  tagExistente.leituraInt = novaTag.leituraInt; // Atualiza a leitura inteira da tag
                  tagExistente.leituraBool = novaTag.leituraBool; // Atualiza a leitura booleana da tag
              }
          });

          // Atualiza alarmes
          novoSetor.alarmes.forEach(novoAlarme => {
              const indiceAlarmeExistente = setorExistente.alarmes.findIndex(alarme => alarme.id === novoAlarme.id);
              if (indiceAlarmeExistente !== -1) {
                  // Atualiza o alarme existente
                  const alarmeExistente = setorExistente.alarmes[indiceAlarmeExistente];
                  alarmeExistente.tempo = novoAlarme.tempo; // Atualiza o tempo do alarme
              }
          });
      }
  });

  // Log updated listaGlobal for verification
  this.listaGlobal.forEach(setor => {
      console.log("ID do Setor:", setor.id);
      console.log("Status do Setor:", setor.status);
      console.log("Último Tempo do Setor:", setor.ultimoTempo);

      // Exibir tags
      console.log("Tags:");
      setor.tags.forEach(tag => {
          console.log(`  ID: ${tag.id}, Leitura Int: ${tag.leituraInt}, Leitura Bool: ${tag.leituraBool}`);
      });

      // Exibir alarmes
      console.log("Alarmes:");
      setor.alarmes.forEach(alarme => {
          console.log(`  ID: ${alarme.id}, Tempo: ${alarme.tempo}`);
      });

      console.log('-----------------------------------'); 
  });

  console.log("Lista global atualizada:", this.listaGlobal);
}


// // Função para salvar o Uint8Array em um arquivo
private saveBytesToFile(bytes: Uint8Array, fileName: string): void {
  // Converte o Uint8Array para um Blob
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  
  // Cria uma URL para o Blob
  const url = window.URL.createObjectURL(blob);

  // Cria um elemento de link para baixar o arquivo
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click(); // Dispara o clique para baixar o arquivo

  // Remove o elemento de link da página
  document.body.removeChild(a);

  // Libera a URL criada para o Blob
  window.URL.revokeObjectURL(url);
}

private obterSessaoIdDoLocalStorage(): string {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    const dadosUsuario = JSON.parse(usuario);
    return dadosUsuario.SessaoID || ''; // Retorna o SessaoID, ou vazio se não existir
  }
  console.warn('Sessão ID não encontrada no localStorage.');
  return ''; // Retorna string vazia se não existir
}

}