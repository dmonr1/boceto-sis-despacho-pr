import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelData } from '../../services/excel-data';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzProgressModule } from 'ng-zorro-antd/progress';

@Component({
  selector: 'app-cliente-hardware',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzAvatarModule, NzProgressModule],
  templateUrl: './cliente-hardware.html',
  styleUrl: './cliente-hardware.scss'
})
export class ClienteHardware implements OnInit {

  datosHardware: any[] = [];

  memoriaDisponibleGB: number = 0;
  memoriaTotalGB: number = 0;
  porcentajeMemoriaDisponible: number = 0;

clienteSeleccionadoHardware: {
  cliente: string;
  cpu: string;
  fabricante: string;
  nombreSistema: string;
  versionSistema: string;
  familiaSistema: string;
  idCpu: string;
} | null = null;


  animarContenidoHardware: boolean = false;

  constructor(private excelData: ExcelData) { }

  ngOnInit(): void {
    const columnasDeseadas = [
      'Cliente',
      'CPU',
      'ID de la CPU', 
      'Fabricante del sistema',
      'Nombre del sistema',
      'Versión del sistema',
      'Familia del sistema',
      'Fabricante del BIOS',
      'Versión del BIOS',
      'Memoria del sistema disponible',
      'Memoria total disponible'
    ];

    

    const datos = this.excelData.getDatosPorTipo('hardware');
    console.log('Datos hardware:', datos);

    this.datosHardware = datos.map(dato => {
      const fila: any = {};
      columnasDeseadas.forEach(col => {
        fila[col] = dato[col] ?? '';
      });
      return fila;
    });

    if (this.datosHardware.length > 0) {
      this.seleccionarClienteHardware(this.datosHardware[0]);
    }
  }

  

  get letraAvatarHardware(): string {
    return this.clienteSeleccionadoHardware?.cliente?.charAt(0)?.toUpperCase() || '-';
  }

  seleccionarClienteHardware(fila: any): void {
    this.clienteSeleccionadoHardware = {
      cliente: fila['Cliente'],
      cpu: fila['CPU'],
      fabricante: fila['Fabricante del sistema'],
      nombreSistema: fila['Nombre del sistema'],
      versionSistema: fila['Versión del sistema'],
      familiaSistema: fila['Familia del sistema'],
      idCpu: fila['ID de la CPU']

    };

    // Parseo de memoria
    this.memoriaDisponibleGB = this.convertirAMemoriaGB(fila['Memoria del sistema disponible']);
    this.memoriaTotalGB = this.convertirAMemoriaGB(fila['Memoria total disponible']);
    if (this.memoriaTotalGB > 0) {
      this.porcentajeMemoriaDisponible = Math.round((this.memoriaDisponibleGB / this.memoriaTotalGB) * 100);
    } else {
      this.porcentajeMemoriaDisponible = 0;
    }

    this.animarContenidoHardware = false;
    setTimeout(() => (this.animarContenidoHardware = true), 10);
  }

  convertirAMemoriaGB(valor: string): number {
    if (!valor) return 0;
    valor = valor.replace(',', '.').trim().toUpperCase();
    if (valor.endsWith('TB')) return parseFloat(valor) * 1024;
    if (valor.endsWith('GB')) return parseFloat(valor);
    if (valor.endsWith('MB')) return parseFloat(valor) / 1024;
    return 0;
  }

  formatPorcentaje = (): string => {
    return `${this.porcentajeMemoriaDisponible}%`;
  };

  obtenerColorMemoria(): string {
    if (this.porcentajeMemoriaDisponible > 70) return '#52c41a'; // verde
    if (this.porcentajeMemoriaDisponible > 30) return '#faad14'; // naranja
    return '#f5222d'; // rojo
  }

  obtenerLogoFabricante(fabricante: string | undefined): string {
    const clave = (fabricante || '').toLowerCase().trim();

    if (clave.includes('lenovo')) return 'assets/images/logos-hardware/lenovo.png';
    if (clave.includes('dell')) return 'assets/images/logos-hardware/Dell_Logo.png';
    if (clave.includes('hp') || clave.includes('hewlett')) return 'assets/images/logos-hardware/hp-logo.png';
    if (clave.includes('intel')) return 'assets/images/logos-hardware/intel.png';
    if (clave.includes('toshiba')) return 'assets/images/logos-hardware/toshiba.png';
    if (clave.includes('vmware')) return 'assets/images/logos-hardware/Vmware.png';
    if (clave === '' || clave === '---') return 'assets/images/logos-hardware/determinar.png';

    return 'assets/images/logos-hardware/determinar.png'; // por defecto
  }

  obtenerLogoCPU(cpu: string | undefined): string {
    const clave = (cpu || '').toLowerCase();

    if (clave.includes('i3')) return 'assets/images/logos-cpu/core-i3.png';
    if (clave.includes('i5')) return 'assets/images/logos-cpu/core-i5.png';
    if (clave.includes('i7')) return 'assets/images/logos-cpu/core-i7.png';
    if (clave.includes('i9')) return 'assets/images/logos-cpu/core-i9.png';
    if (clave.includes('xeon')) return 'assets/images/logos-cpu/intel-xeon.png';

    return 'assets/images/logos-cpu/images.png'; // imagen por defecto
  }

}
