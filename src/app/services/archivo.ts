import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoArchivo, ArchivoExcel } from '../interfaces/archivo-excel';
import { ArchivoExcelResponse } from '../interfaces/archivo-excel-response';

@Injectable({
  providedIn: 'root'
})
export class Archivo {
  private apiUrl = 'http://localhost:8086/api/archivos';

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
    return this.http.get<any[]>(`http://localhost:8086/api/archivos/tipo/${tipo}`);
  }
  
  descargarArchivoPorId(id: number): Observable<Blob> {
    return this.http.get(`http://localhost:8086/api/archivos/${id}/descargar`, {
      responseType: 'blob'
    });
  }
  
  listarTodos(): Observable<ArchivoExcel[]> {
    return this.http.get<ArchivoExcel[]>(`${this.apiUrl}`);
  }
  
}
