import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelData {

  private datos: Record<string, any>[] = [];
  private columnas: string[] = [];

  setDatos(datos: Record<string, any>[]): void {
    this.datos = datos;
    this.columnas = datos.length > 0 ? Object.keys(datos[0]) : [];
    console.log('Datos del Excel guardados en el servicio:', this.datos);

  }

  getDatos(): Record<string, any>[] {
    return this.datos;
  }

  getColumnas(): string[] {
    return this.columnas;
  }

  limpiar(): void {
    this.datos = [];
    this.columnas = [];
  }
}
