import { Component, ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-carga-datos',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './carga-datos.html',
  styleUrls: ['./carga-datos.scss']
})
export class CargaDatos {
  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  datos: any[] = [];
  columnas: string[] = [];

  // Estados
  cargaExitosa = false;
  ocultarMensaje = false;
  mostrarDetalles = false;
  mostrarTabla = false;
  cargandoArchivo = false;
  cargandoTabla = false;
  animarSalidaCard = false;

  seleccionarArchivo() {
    this.inputArchivo.nativeElement.click();
  }

  onFileChange(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // Resetear estados
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
      this.cargandoArchivo = false;
      this.cargaExitosa = true;

      setTimeout(() => {
        this.ocultarMensaje = true;
      }, 1000);

      setTimeout(() => {
        this.cargaExitosa = false;
        this.mostrarDetalles = true;
      }, 1000);
    };

    lector.readAsBinaryString(archivo);
  }

  verTabla() {
    this.animarSalidaCard = true;

    setTimeout(() => {
      this.mostrarDetalles = false;
      this.cargandoTabla = true;
    }, 400); // Esperar la animación de salida

    setTimeout(() => {
      this.cargandoTabla = false;
      this.mostrarTabla = true;
    }, 1000); // Mostrar tabla luego de carga
  }
}
