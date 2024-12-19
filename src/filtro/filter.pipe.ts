import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return []; // Retorna vazio se a lista estiver vazia
    if (!searchText) return items; // Retorna todos os itens se não houver busca

    searchText = searchText.toLowerCase(); // Normaliza o texto

    // Filtra itens cujo nome inclua o texto de busca
    return items.filter(item => item.nome.toLowerCase().includes(searchText));
  }
}
