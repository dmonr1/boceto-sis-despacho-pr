import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListaClientes } from '../../pages/lista-clientes/lista-clientes';
import { ClienteHardware } from '../../pages/cliente-hardware/cliente-hardware';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-router',
  template: `
    <ng-container *ngIf="tipo === 'resumen'">
      <app-lista-clientes />
    </ng-container>
    <ng-container *ngIf="tipo === 'hardware'">
      <app-cliente-hardware />
    </ng-container>
    <ng-container *ngIf="tipo === 'software'">
      <!-- Reemplaza esto si tienes otro componente -->
      <p>Componente para software no implementado aún</p>
    </ng-container>
  `,
  standalone: true,
  imports: [
    ListaClientes,
    ClienteHardware, CommonModule
  ]
})
export class DashboardRouter {
  tipo: string = '';

  constructor(private route: ActivatedRoute) {
    this.tipo = this.route.snapshot.paramMap.get('tipo') || '';
  }
}
