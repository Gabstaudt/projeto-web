// tag.service.ts
import { Injectable } from '@angular/core';
import { TipoTag } from '../../models/tipo.model';
import { Tag } from '../../models/tag.model';
import { converterLeitura } from '../../models/converter.model';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  constructor() {}

  // Método para converter e formatar a leitura de uma tag
  public formatarLeitura(tag: Tag, valor: number): void {
    tag.leituraFormatada = converterLeitura(tag.tipo, valor);
  }
}
