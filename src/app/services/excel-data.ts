import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelData {

  private datos: any[] = [];
  private columnas: string[] = [];
  private nombreArchivo: string = '';
  private archivoAnterior: string | null = null;

  setDatos(datos: any[]) {
    this.datos = datos;
  }

  getDatos(): any[] {
    return this.datos;
  }

  setColumnas(columnas: string[]) {
    this.columnas = columnas;
  }

  getColumnas(): string[] {
    return this.columnas;
  }

  setNombreArchivo(nombre: string) {
    this.nombreArchivo = nombre;
    this.archivoAnterior = nombre;
  }

  getNombreArchivo(): string {
    return this.nombreArchivo;
  }

  getArchivoAnterior(): string | null {
    return this.archivoAnterior;
  }
  
  limpiar(): void {
    this.datos = [];
    this.columnas = [];
  }
}
