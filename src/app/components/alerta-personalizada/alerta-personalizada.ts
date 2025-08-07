import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerta-personalizada',
  standalone: true,
  imports: [NzIconModule, CommonModule],
  templateUrl: './alerta-personalizada.html',
  styleUrl: './alerta-personalizada.scss'
})

export class AlertaPersonalizada implements OnInit, OnChanges {
  @Input() tipo: 'success' | 'error' | 'warning' | 'question' = 'success';
  @Input() mensaje: string = '';
  @Input() visible: boolean = false;
  @Output() aceptar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  icono = '';
  color = '';
  esPregunta = false;
  cerrarAnimando = false;

  ngOnInit(): void {
    this.aplicarTipo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipo']) this.aplicarTipo();
  }

  aplicarTipo() {
    this.esPregunta = false;
    switch (this.tipo) {
      case 'success':
        this.icono = 'check-circle';
        this.color = '#52c41a';
        break;
      case 'error':
        this.icono = 'close-circle';
        this.color = '#ff4d4f';
        break;
      case 'warning':
        this.icono = 'exclamation-circle';
        this.color = '#faad14';
        break;
      case 'question':
        this.icono = 'question-circle';
        this.color = '#1677ff';
        this.esPregunta = true;
        break;
    }
  }

  onAceptar() {
    this.emitirCerrar(() => this.aceptar.emit());
  }

  onCancelar() {
    this.emitirCerrar(() => this.cancelar.emit());
  }

  cerrar() {
    this.emitirCerrar(() => this.cancelar.emit());
  }

  private emitirCerrar(callback: () => void) {
    this.cerrarAnimando = true;
    setTimeout(() => {
      this.visible = false;
      this.cerrarAnimando = false;
      callback();
    }, 300);
  }
}
