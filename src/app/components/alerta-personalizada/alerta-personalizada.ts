import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerta-personalizada',
  standalone: true,
  imports: [NzIconModule, CommonModule],
  templateUrl: './alerta-personalizada.html',
  styleUrl: './alerta-personalizada.scss'
})
export class AlertaPersonalizada implements OnInit {
  @Input() tipo: 'success' | 'error' | 'warning' | 'question' = 'success';
  @Input() mensaje: string = '';
  @Input() visible: boolean = false;

  @Output() aceptar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  icono = '';
  color = '';
  esPregunta = false;

  ngOnInit(): void {
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
    this.aceptar.emit();
    this.visible = false; // se cierra la alerta al aceptar
  }
  
  onCancelar() {
    this.cancelar.emit();
    this.visible = false; // se cierra también al cancelar
  }
  
  cerrar() {
    this.visible = false;
    this.cancelar.emit();
  }
  
}
