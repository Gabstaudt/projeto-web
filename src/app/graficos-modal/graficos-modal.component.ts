import { Component, Output, EventEmitter, ElementRef, Renderer2, OnInit } from '@angular/core';

@Component({
  selector: 'app-graficos-modal',
  templateUrl: './graficos-modal.component.html',
  styleUrls: ['./graficos-modal.component.scss'],
})
export class GraficosModalComponent implements OnInit {
  @Output() fechar = new EventEmitter<void>();
  
  private isDragging = false; // Indica se o modal está sendo arrastado
  private startX = 0; // Posição inicial do mouse no eixo X
  private startY = 0; // Posição inicial do mouse no eixo Y
  private offsetX = 0; // Deslocamento do modal no eixo X
  private offsetY = 0; // Deslocamento do modal no eixo Y

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const header = this.elementRef.nativeElement.querySelector('.header-graficos');
    this.renderer.listen(header, 'mousedown', this.iniciarArraste.bind(this));
    this.renderer.listen(document, 'mousemove', this.moverModal.bind(this));
    this.renderer.listen(document, 'mouseup', this.finalizarArraste.bind(this));
  }

  fecharModal(): void {
    this.fechar.emit();
  }

  iniciarArraste(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;
  }

  moverModal(event: MouseEvent): void {
    if (!this.isDragging) return;

    this.offsetX = event.clientX - this.startX;
    this.offsetY = event.clientY - this.startY;

    const modal = this.elementRef.nativeElement.querySelector('.modal-graficos');
    this.renderer.setStyle(modal, 'transform', `translate(${this.offsetX}px, ${this.offsetY}px)`);
  }

  finalizarArraste(): void {
    this.isDragging = false;
  }
}
