import { Component, ViewChild, ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carga-datos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carga-datos.html',
  styleUrls: ['./carga-datos.scss']
})
export class CargaDatos {
  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;
  datos: Record<string, any>[] = [];
  columnas: string[] = [];

  seleccionarArchivo() {
    this.inputArchivo.nativeElement.click();
  }

  onFileChange(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e: any) => {
      const datosBinarios = e.target.result;
      const libro = XLSX.read(datosBinarios, { type: 'binary' });
      const nombreHoja = libro.SheetNames[0];
      const hoja = libro.Sheets[nombreHoja];
      const datos = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { header: 0 });
      this.datos = datos;
      this.columnas = datos.length > 0 ? Object.keys(datos[0]) : [];
    };
    lector.readAsBinaryString(archivo);
  }
}
