import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelData {

  private datos: any[] = [];
  private columnas: string[] = [];
  private nombreArchivo: string = '';
  private archivoAnterior: string | null = null;

  private repararTexto(valor: any): string {
    if (!valor) return '';
    return valor.toString()
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'Á')
      .replace(/Ã‰/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ãš/g, 'Ú')
      .replace(/Ã‘/g, 'Ñ')
      .replace(/Ã/g, '');
  }

  private repararObjeto(obj: any): any {
    const reparado: any = {};
    for (const clave in obj) {
      reparado[this.repararTexto(clave)] = this.repararTexto(obj[clave]);
    }
    return reparado;
  }

  setDatos(datos: any[]) {
    this.datos = datos.map(d => this.repararObjeto(d));
  }

  getDatos(): any[] {
    return this.datos;
  }

  setColumnas(columnas: string[]) {
    this.columnas = columnas.map(c => this.repararTexto(c));
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
