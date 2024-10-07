
export class Tag {
  // Propriedades da tag
  id: number; 
  nome: string; 
  desc: string; 
  tipo: number; 
  max: number; 
  min: number;
  status: number; 
  vazia: boolean; 
  leituraInt: number; 
  leituraBool: boolean; 

  // Construtor da classe
  constructor() {
    this.id = 0; 
    this.nome = '';
    this.desc = ''; 
    this.tipo = 0; 
    this.max = 0; 
    this.min = 0;
    this.status = 0; 
    this.vazia = false;
    this.leituraInt = 0; 
    this.leituraBool = false; 
  }
}
