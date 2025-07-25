import { Component } from '@angular/core';
import { ExcelData } from '../../services/excel-data';
import { CommonModule } from '@angular/common';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import html2pdf from 'html2pdf.js';
  
@Component({
  selector: 'app-lista-clientes',
  imports: [CommonModule, NzAvatarModule, FormsModule, NzIconModule],
  standalone: true,
  templateUrl: './lista-clientes.html',
  styleUrl: './lista-clientes.scss'
})
export class ListaClientes {
  datosOriginales: any[] = [];
  datosFiltrados: any[] = [];
  textoBusqueda: string = '';
  animarContenido: boolean = false;

  clienteSeleccionado: {
    cliente: string;
    ipv4: string;
    estado: string;
    motorA: string;
    motorB: string;
    version: string;
    componentes: string;
    reiniciar: string;
    ultimaSync: string;
    actualizarVirus: string;
    actualizarProgramas: string;
    tipo: string;
  } | null = null;

  constructor(private excelData: ExcelData) { }

  ngOnInit(): void {
    const datos = this.excelData.getDatos();
    console.log(datos);

    this.datosOriginales = datos.map(fila => ({
      cliente: fila['Cliente'],
      ipv4: fila['Dirección IPv4'],
      estado: fila['Estado de seguridad'],
      motorA: fila['Motor A'],
      motorB: fila['Motor B'],
      version: fila['Versión de G DATA Security Client'],
      componentes: fila['Componentes de seguridad'],
      reiniciar: fila['Es necesario reiniciar'],
      ultimaSync: fila['Última sincronización'],
      actualizarVirus: fila['Actualizar base de datos de virus / fecha'],
      actualizarProgramas: fila['Actualizar archivos de programa / fecha'],
      tipo: fila['Tipo']
    }));

    this.datosFiltrados = [...this.datosOriginales];

    if (this.datosFiltrados.length > 0) {
      this.seleccionarCliente(this.datosFiltrados[0]);
    }
  }

  seleccionarCliente(fila: any): void {
    this.clienteSeleccionado = { ...fila };
    this.animarContenido = false;
    setTimeout(() => (this.animarContenido = true), 10);
  }

  filtrarClientes(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();
    this.datosFiltrados = this.datosOriginales.filter(cliente =>
      cliente.cliente.toLowerCase().includes(texto)
    );
    if (this.datosFiltrados.length > 0) {
      this.seleccionarCliente(this.datosFiltrados[0]);
    } else {
      this.clienteSeleccionado = null;
    }
  }

  get letraAvatar(): string {
    return this.clienteSeleccionado?.cliente?.charAt(0)?.toUpperCase() || '-';
  }

  get iconoEstado(): string {
    const estado = this.clienteSeleccionado?.estado?.toLowerCase() || '';
    if (estado.includes('sin conexión con el servidor')) return 'disconnect';
    if (estado.includes('protegido')) return 'check-circle';
    if (estado.includes('riesgo')) return 'stop';
    if (estado.includes('no autorizado')) return 'warning';
    if (estado.includes('error') || estado.includes('sin conexión')) return 'wifi';
    return 'info-circle';
  }

  get colorEstado(): string {
    const estado = this.clienteSeleccionado?.estado?.toLowerCase() || '';
    if (estado.includes('sin conexión con el servidor')) return '#ff4d4f';
    if (estado.includes('protegido')) return '#52c41a';
    if (estado.includes('riesgo')) return '#ff4d4f';
    if (estado.includes('no autorizado')) return '#ffde4dff';

    if (estado.includes('error') || estado.includes('sin conexión')) return '#ff4d4f';
    return '#d9d9d9';
  }

  imprimirPDF(): void {
    window.print();
  }
}
