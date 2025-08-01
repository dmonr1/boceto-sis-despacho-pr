import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute } from '@angular/router';
import { Archivo } from '../../services/archivo';
import { AlertaPersonalizada } from '../../components/alerta-personalizada/alerta-personalizada';

@Component({
  selector: 'app-cliente-software',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, AlertaPersonalizada],
  templateUrl: './cliente-software.html',
  styleUrl: './cliente-software.scss'
})
export class ClienteSoftware {
  textoBusqueda = '';
  datosFiltrados: any[] = [];
  archivosSoftware: any[] = [];
  mostrarDropdown = false;
  idArchivo = 0;
  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';

  constructor(private archivoService: Archivo, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('🔁 ngOnInit() llamado');
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      this.idArchivo = parseInt(idParam, 10);
      console.log('📥 ID de archivo desde URL:', this.idArchivo);
    }
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
    console.log('📂 Toggle dropdown:', this.mostrarDropdown);
  }

  cambiarArchivo(archivo: any) {
    console.log('🔁 Cambiar archivo seleccionado:', archivo);

    if (archivo.tipoArchivo !== 'software') {
      this.mostrarNotificacion('warning', 'Solo se admiten archivos tipo Software.');
      return;
    }

    this.idArchivo = archivo.id;
    console.log('📌 Nuevo archivo seleccionado con ID:', this.idArchivo);
    this.mostrarDropdown = false;
  }


  buscarCliente() {
    const texto = this.textoBusqueda.trim();
    console.log('🔎 Buscar cliente con texto:', texto);

    if (!texto) {
      this.mostrarNotificacion('warning', 'Debe ingresar un cliente para buscar.');
      return;
    }

    if (!this.idArchivo) {
      this.mostrarNotificacion('warning', 'Debe elegir un archivo antes de buscar.');
      return;
    }

    console.log(`📤 Enviando búsqueda al backend con ID: ${this.idArchivo}, cliente: ${texto}`);

    this.archivoService.obtenerDatosSoftware(this.idArchivo, texto).subscribe({
      next: (res) => {
        console.log('📥 Respuesta del backend (clientes encontrados):', res);
        this.datosFiltrados = res;

        if (res.length === 0) {
          this.mostrarNotificacion('warning', 'No se encontraron datos para ese cliente.');
        }
      },
      error: (err) => {
        console.error('❌ Error al buscar datos en el servidor:', err);
        this.mostrarNotificacion('error', 'Error al buscar datos en el servidor.');
      }
    });
  }

  obtenerValorSeguro(valor: any): string {
    return valor && valor.toString().trim() !== '' ? valor : 'Desconocido';
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'warning', mensaje: string) {
    console.log(`⚠️ Notificación (${tipo}):`, mensaje);
    this.tipoAlerta = tipo;
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
  }

  cerrarNotificacion() {
    console.log('✅ Notificación cerrada');
    this.mostrarAlerta = false;
  }
}
