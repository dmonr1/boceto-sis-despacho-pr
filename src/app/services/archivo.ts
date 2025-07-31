import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoArchivo, ArchivoExcel } from '../interfaces/archivo-excel';
import { ArchivoExcelResponse } from '../interfaces/archivo-excel-response';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Archivo {
  private apiUrl = `${environment.apiBaseUrl}/archivos`;

  constructor(private http: HttpClient) {}

  subirArchivo(file: File, tipo: TipoArchivo): Observable<ArchivoExcelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    return this.http.post<ArchivoExcelResponse>(`${this.apiUrl}/subir`, formData);
  }

  listarPorTipo(tipo: TipoArchivo): Observable<ArchivoExcel[]> {
    return this.http.get<ArchivoExcel[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  descargarArchivo(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/descargar`, { responseType: 'blob' });
  }

  eliminarArchivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerArchivosPorTipo(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  descargarArchivoPorId(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/descargar`, { responseType: 'blob' });
  }

  listarTodos(): Observable<ArchivoExcel[]> {
    return this.http.get<ArchivoExcel[]>(this.apiUrl);
  }
}
