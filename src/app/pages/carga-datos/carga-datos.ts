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
  tipoArchivo: 'resumen' | 'hardware' | 'software' | null = null;

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

  mostrarPanelTipos = true;

  tiposArchivos: ('resumen' | 'hardware' | 'software')[] = ['resumen', 'hardware', 'software'];

  nombresTipos: Record<'resumen' | 'hardware' | 'software', string> = {
    resumen: 'Resumen',
    hardware: 'Hardware',
    software: 'Software'
  };

  constructor(public excelData: ExcelData) {}

  ngOnInit(): void {
    const tipo = this.excelData.getArchivoActivo();
    if (!tipo) return;
  
    this.tipoArchivo = tipo;
    this.datos = this.excelData.getDatosPorTipo(tipo);
    this.columnas = this.excelData.getColumnasPorTipo(tipo);
    this.nombreArchivo = this.excelData.getNombrePorTipo(tipo);
  
    if (this.datos.length > 0 && this.columnas.length > 0) {
      this.mostrarDetalles = true;
      this.mostrarPanelTipos = true;
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
    const tipo = this.detectarTipo(nombre);

    if (!tipo) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo inválido',
        text: 'El nombre del archivo debe incluir "Resumen", "Hardware" o "Software".',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const nombrePrevio = this.excelData.getNombrePorTipo(tipo);
    if (nombrePrevio === nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo duplicado',
        text: 'Ya has cargado este archivo. Selecciona uno diferente.',
        confirmButtonText: 'Aceptar'
      });
      this.inputArchivo.nativeElement.value = '';
      return;
    }

    this.nombreArchivo = nombre;
    this.tipoArchivo = tipo;
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
      const columnas = Object.keys(datos[0] || {});

      this.datos = datos;
      this.columnas = columnas;
      this.excelData.setDatosPorTipo(tipo, datos, columnas, nombre);

      this.cargandoArchivo = false;
      this.cargaExitosa = true;

      setTimeout(() => (this.ocultarMensaje = true), 1000);
      setTimeout(() => {
        this.cargaExitosa = false;
        this.mostrarDetalles = true;
      }, 2000);
    };

    lector.readAsBinaryString(archivo);
  }

  verTabla() {
    this.animarSalidaCard = true;
    this.animarSalidaPanelTipos = true;
  
    setTimeout(() => {
      this.mostrarPanelTipos = false;
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
      this.mostrarPanelTipos = true;
      this.animarSalidaPanelTipos = false;
    }, 400);
  }
  
  private detectarTipo(nombre: string): 'resumen' | 'hardware' | 'software' | null {
    const lower = nombre.toLowerCase();
    if (lower.includes('resumen')) return 'resumen';
    if (lower.includes('hardware')) return 'hardware';
    if (lower.includes('software')) return 'software';
    return null;
  }

  eliminarArchivo(tipo: 'resumen' | 'hardware' | 'software'): void {
    this.excelData.eliminarPorTipo(tipo);

    if (this.tipoArchivo === tipo) {
      this.tipoArchivo = null;
      this.datos = [];
      this.columnas = [];
      this.nombreArchivo = '';
      this.mostrarDetalles = false;
      this.mostrarTabla = false;
      this.mostrarBotonVolver = false;
    }
  }

  mostrarAlerta = false;
  alertaTitulo = '';
  alertaMensaje = '';
  tipoPendienteEliminar: 'resumen' | 'hardware' | 'software' | null = null;

  mostrarAlertaEliminar(tipo: 'resumen' | 'hardware' | 'software') {
    this.alertaTitulo = '¿Estás seguro?';
    this.alertaMensaje = `¿Deseas eliminar el archivo cargado de tipo "${this.nombresTipos[tipo]}"?`;
    this.tipoPendienteEliminar = tipo;
    this.mostrarAlerta = true;
  }

  cancelarAlerta() {
    this.mostrarAlerta = false;
    this.tipoPendienteEliminar = null;
  }

  confirmarAlerta() {
    if (this.tipoPendienteEliminar) {
      this.eliminarArchivo(this.tipoPendienteEliminar);
    }
    this.mostrarAlerta = false;
  }

animarSalidaPanelTipos = false;

}
