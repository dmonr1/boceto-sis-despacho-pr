import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelData {
  private datosResumen: any[] = [];
  private columnasResumen: string[] = [];
  private nombreResumen: string = '';

  private datosHardware: any[] = [];
  private columnasHardware: string[] = [];
  private nombreHardware: string = '';

  private datosSoftware: any[] = [];
  private columnasSoftware: string[] = [];
  private nombreSoftware: string = '';

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

  
  private tipoArchivoActivo: 'resumen' | 'hardware' | 'software' | null = null;

setArchivoActivo(tipo: 'resumen' | 'hardware' | 'software'): void {
  this.tipoArchivoActivo = tipo;
}

getArchivoActivo(): 'resumen' | 'hardware' | 'software' | null {
  return this.tipoArchivoActivo;
}

  private repararObjeto(obj: any): any {
    const reparado: any = {};
    for (const clave in obj) {
      reparado[this.repararTexto(clave)] = this.repararTexto(obj[clave]);
    }
    return reparado;
  }
  setDatosPorTipo(tipo: 'resumen' | 'hardware' | 'software', datos: any[], columnas: string[], nombre: string): void {
    const datosReparados = datos.map(d => this.repararObjeto(d));
    const columnasReparadas = columnas.map(c => this.repararTexto(c));
  
    if (tipo === 'resumen') {
      this.datosResumen = datosReparados;
      this.columnasResumen = columnasReparadas;
      this.nombreResumen = nombre;
    } else if (tipo === 'hardware') {
      this.datosHardware = datosReparados;
      this.columnasHardware = columnasReparadas;
      this.nombreHardware = nombre;
    } else if (tipo === 'software') {
      this.datosSoftware = datosReparados;
      this.columnasSoftware = columnasReparadas;
      this.nombreSoftware = nombre;
    }
  
    this.setArchivoActivo(tipo);
  }
  

  getDatosPorTipo(tipo: 'resumen' | 'hardware' | 'software'): any[] {
    return tipo === 'resumen' ? this.datosResumen
         : tipo === 'hardware' ? this.datosHardware
         : this.datosSoftware;
  }

  getColumnasPorTipo(tipo: 'resumen' | 'hardware' | 'software'): string[] {
    return tipo === 'resumen' ? this.columnasResumen
         : tipo === 'hardware' ? this.columnasHardware
         : this.columnasSoftware;
  }

  getNombrePorTipo(tipo: 'resumen' | 'hardware' | 'software'): string {
    return tipo === 'resumen' ? this.nombreResumen
         : tipo === 'hardware' ? this.nombreHardware
         : this.nombreSoftware;
  }

  isCargado(tipo: 'resumen' | 'hardware' | 'software'): boolean {
    const datos = this.getDatosPorTipo(tipo);
    return Array.isArray(datos) && datos.length > 0;
  }

  eliminarPorTipo(tipo: 'resumen' | 'hardware' | 'software'): void {
    if (tipo === 'resumen') {
      this.datosResumen = [];
      this.columnasResumen = [];
      this.nombreResumen = '';
    } else if (tipo === 'hardware') {
      this.datosHardware = [];
      this.columnasHardware = [];
      this.nombreHardware = '';
    } else if (tipo === 'software') {
      this.datosSoftware = [];
      this.columnasSoftware = [];
      this.nombreSoftware = '';
    }
  }

  limpiar(): void {
    this.datosResumen = [];
    this.columnasResumen = [];
    this.nombreResumen = '';

    this.datosHardware = [];
    this.columnasHardware = [];
    this.nombreHardware = '';

    this.datosSoftware = [];
    this.columnasSoftware = [];
    this.nombreSoftware = '';
  }

  
}
