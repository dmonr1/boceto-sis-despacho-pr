import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelData } from '../../services/excel-data';

@Component({
  selector: 'app-cliente-hardware',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-hardware.html',
  styleUrl: './cliente-hardware.scss'
})
export class ClienteHardware implements OnInit {
  datosHardware: any[] = [];

  constructor(private excelData: ExcelData) {}

  ngOnInit(): void {
    const columnasDeseadas = [
      'Cliente',
      'CPU',
      'Fabricante del sistema',
      'Nombre del sistema',
      'Fabricante del BIOS',
      'Versión del BIOS'
    ];

    // ✅ Obtener solo los datos del tipo "hardware"
    const datos = this.excelData.getDatosPorTipo('hardware');

    console.log('Datos hardware:', datos);

    this.datosHardware = datos.map(dato => {
      const fila: any = {};
      columnasDeseadas.forEach(col => {
        fila[col] = dato[col] ?? '';
      });
      return fila;
    });
  }
}
