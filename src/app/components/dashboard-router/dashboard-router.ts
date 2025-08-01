import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListaClientes } from '../../pages/lista-clientes/lista-clientes';
import { ClienteHardware } from '../../pages/cliente-hardware/cliente-hardware';
import { CommonModule } from '@angular/common';
import { ClienteSoftware } from '../../pages/cliente-software/cliente-software';

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
    <app-cliente-software />
    </ng-container>
  `,
  standalone: true,
  imports: [
    ListaClientes,
    ClienteHardware,
    ClienteSoftware,
    CommonModule
  ]
})
export class DashboardRouter {
  tipo: string = '';

  constructor(private route: ActivatedRoute) {
    this.tipo = this.route.snapshot.paramMap.get('tipo') || '';
  }
}
