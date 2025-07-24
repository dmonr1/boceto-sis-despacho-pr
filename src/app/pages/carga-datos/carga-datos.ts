import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import Swal from 'sweetalert2';
import { ExcelData } from '../../services/excel-data';

@Component({
  selector: 'app-carga-datos',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './carga-datos.html',
  styleUrls: ['./carga-datos.scss']
})
export class CargaDatos implements OnInit {
  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  datos: any[] = [];
  columnas: string[] = [];
  nombreArchivo: string = '';

  cargaExitosa = false;
  ocultarMensaje = false;
  mostrarDetalles = false;
  mostrarTabla = false;
  cargandoArchivo = false;
  cargandoTabla = false;
  animarSalidaCard = false;

  mostrarBotonVolver = false;
  animarVolver = false;
  animarSalidaVolver = false;

  constructor(private excelData: ExcelData) {}

  ngOnInit(): void {
    const datos = this.excelData.getDatos();
    const columnas = this.excelData.getColumnas();
    const nombre = this.excelData.getNombreArchivo();

    if (datos.length > 0 && columnas.length > 0) {
      this.datos = datos;
      this.columnas = columnas;
      this.nombreArchivo = nombre;
      this.mostrarDetalles = true;
    }
  }

  seleccionarArchivo() {
    this.inputArchivo.nativeElement.value = '';
    this.inputArchivo.nativeElement.click();
  }

  onFileChange(event: any) {
    const archivo: File = event.target.files[0];
    if (!archivo) return;

    const nombre = archivo.name;

    if (this.excelData.getArchivoAnterior() === nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo duplicado',
        text: 'Ya has cargado este archivo. Selecciona uno diferente.',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'swal-popup-custom',
          title: 'swal-title-custom',
          htmlContainer: 'swal-text-custom',
          confirmButton: 'swal-button-custom'
        }
      });
      this.inputArchivo.nativeElement.value = '';
      return;
    }

    this.nombreArchivo = nombre;
    this.excelData.setNombreArchivo(nombre);

    this.mostrarDetalles = false;
    this.mostrarTabla = false;
    this.animarSalidaCard = false;
    this.cargaExitosa = false;
    this.ocultarMensaje = false;
    this.cargandoArchivo = true;

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const datosBinarios = e.target.result;
      const libro = XLSX.read(datosBinarios, { type: 'binary' });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const datos = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      this.datos = datos;
      this.columnas = Object.keys(datos[0] || {});
      this.excelData.setDatos(this.datos);
      this.excelData.setColumnas(this.columnas);

      this.cargandoArchivo = false;
      this.cargaExitosa = true;

      setTimeout(() => {
        this.ocultarMensaje = true;
      }, 1000);

      setTimeout(() => {
        this.cargaExitosa = false;
        this.mostrarDetalles = true;
      }, 2000);
    };

    lector.readAsBinaryString(archivo);
  }

  verTabla() {
    this.animarSalidaCard = true;

    setTimeout(() => {
      this.mostrarDetalles = false;
      this.cargandoTabla = true;
    }, 700);

    setTimeout(() => {
      this.cargandoTabla = false;
      this.mostrarTabla = true;
      this.mostrarBotonVolver = true;
      setTimeout(() => (this.animarVolver = true), 10);
    }, 1000);
  }

  volverADetalles() {
    this.animarVolver = false;
    this.animarSalidaVolver = true;

    this.mostrarTabla = false;
    this.cargaExitosa = false;
    this.ocultarMensaje = false;
    this.animarSalidaCard = false;

    setTimeout(() => {
      this.mostrarBotonVolver = false;
      this.animarSalidaVolver = false;
      this.mostrarDetalles = true;
    }, 400);
  }
}
