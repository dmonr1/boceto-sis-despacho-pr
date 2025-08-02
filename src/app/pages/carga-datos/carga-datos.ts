import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Archivo } from '../../services/archivo';
import { TipoArchivo } from '../../interfaces/archivo-excel';
import { AlertaPersonalizada } from '../../components/alerta-personalizada/alerta-personalizada';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-carga-datos',
  standalone: true,
  imports: [CommonModule, NzIconModule, AlertaPersonalizada],
  templateUrl: './carga-datos.html',
  styleUrls: ['./carga-datos.scss']
})
export class CargaDatos implements OnInit, OnDestroy {
  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  nombreArchivo = '';
  tipoArchivo: TipoArchivo | null = null;
  archivosGuardados: any[] = [];
  cargaExitosa = false;
  ocultarMensaje = false;
  cargandoArchivo = false;
  idUltimoAgregado: number | null = null;
  idArchivoEliminar: number | null = null;
  paginaActual = 1;
  tamanioPagina = 10;
  totalPaginas = 1;
  archivosPaginados: any[] = [];
  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';
  mostrarPregunta = false;
  reintentoIntervalo: any = null;

  constructor(
    private archivoService: Archivo,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTodosLosArchivos();
  }

  ngOnDestroy(): void {
    if (this.reintentoIntervalo) {
      clearInterval(this.reintentoIntervalo);
    }
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'warning', mensaje: string) {
    this.tipoAlerta = tipo;
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
  }

  cerrarNotificacion() {
    this.mostrarAlerta = false;
  }

  cargarTodosLosArchivos() {
    if (this.reintentoIntervalo) {
      clearInterval(this.reintentoIntervalo);
      this.reintentoIntervalo = null;
    }

    this.archivoService.listarTodos().subscribe({
      next: (archivos) => {
        this.archivosGuardados = archivos.sort((a, b) => {
          return new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime();
        });

        this.totalPaginas = Math.ceil(this.archivosGuardados.length / this.tamanioPagina);
        this.actualizarPaginacion();

        setTimeout(() => {
          const filaNueva = document.querySelector('.fila-nueva');
          if (filaNueva) {
            filaNueva.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        if (this.reintentoIntervalo) {
          clearInterval(this.reintentoIntervalo);
          this.reintentoIntervalo = null;
        }
      },
      error: (err) => {
        console.error('Error al listar archivos:', err);
        this.mostrarNotificacion('error', 'No hay respuesta del servidor. Reintentando en 1 minuto...');

        if (!this.reintentoIntervalo) {
          this.reintentoIntervalo = setInterval(() => {
            console.log('Reintentando conexión con el servidor...');
            this.cargarTodosLosArchivos();
          }, 60000);
        }
      }
    });
  }

  seleccionarArchivo() {
    this.inputArchivo.nativeElement.value = '';
    this.inputArchivo.nativeElement.click();
  }

  async calcularHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async onFileChange(event: any) {
    const archivo: File = event.target.files[0];
    if (!archivo) return;

    this.inputArchivo.nativeElement.disabled = true;

    const nombre = archivo.name;
    const tipo = this.detectarTipo(nombre);
    if (!tipo) {
      this.mostrarNotificacion('error', 'El nombre del archivo debe incluir "Resumen", "Hardware" o "Software".');
      this.inputArchivo.nativeElement.disabled = false;
      return;
    }

    this.archivoService.listarTodos().subscribe({
      next: async (archivos) => {
        this.archivosGuardados = archivos;

        const hash = await this.calcularHash(archivo);
        const hashYaExiste = this.archivosGuardados.some(a => a.hashContenido === hash);

        if (hashYaExiste) {
          this.mostrarNotificacion('warning', 'Ya existe un archivo con el mismo contenido.');
          this.inputArchivo.nativeElement.disabled = false;
          return;
        }

        this.nombreArchivo = nombre;
        this.tipoArchivo = tipo;
        this.cargaExitosa = false;
        this.ocultarMensaje = false;
        this.cargandoArchivo = true;

        this.archivoService.subirArchivo(archivo, tipo).subscribe({
          next: (respuesta) => {
            this.cargandoArchivo = false;
            this.cargaExitosa = true;
            this.idUltimoAgregado = respuesta?.id ?? null;

            setTimeout(() => (this.ocultarMensaje = true), 1000);
            setTimeout(() => {
              this.cargaExitosa = false;
              this.cargarTodosLosArchivos();
            }, 2000);

            this.mostrarNotificacion('success', 'Archivo cargado exitosamente.');
            this.inputArchivo.nativeElement.disabled = false;
          },
          error: (err) => {
            this.cargandoArchivo = false;
            console.error('Error al subir archivo:', err);
            this.mostrarNotificacion('error', 'No hay respuesta del servidor. Intente más tarde.');
            this.inputArchivo.nativeElement.disabled = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al listar archivos:', err);
        this.mostrarNotificacion('error', 'No se pudo verificar archivos. Verifique su conexión.');
        this.inputArchivo.nativeElement.disabled = false;
      }
    });
  }

  eliminarArchivo(id: number) {
    this.idArchivoEliminar = id;
    this.mostrarPregunta = true;
  }

  confirmarEliminacion() {
    if (this.idArchivoEliminar !== null) {
      this.archivoService.eliminarArchivo(this.idArchivoEliminar).subscribe({
        next: () => {
          this.tipoAlerta = 'success';
          this.mostrarNotificacion('success', 'El archivo ha sido eliminado.');
          this.cargarTodosLosArchivos();
        },
        error: (err) => {
          console.error('Error al eliminar archivo:', err);
          this.tipoAlerta = 'error';
          this.mostrarNotificacion('error', 'No hay respuesta del servidor. No se pudo eliminar el archivo.');
        },
        complete: () => {
          this.idArchivoEliminar = null;
          this.mostrarPregunta = false;
        }
      });
    }
  }

  cancelarEliminacion() {
    this.idArchivoEliminar = null;
    this.mostrarPregunta = false;
  }

  private detectarTipo(nombre: string): TipoArchivo | null {
    const lower = nombre.toLowerCase();
    if (lower.includes('resumen')) return 'resumen';
    if (lower.includes('hardware')) return 'hardware';
    if (lower.includes('software')) return 'software';
    return null;
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;
    this.archivosPaginados = this.archivosGuardados.slice(inicio, fin);
  }

verDashboard(archivo: any) {
  const tipo = archivo.tipoArchivo;
  const id = archivo.id;

  if (tipo === 'software') {
    sessionStorage.setItem('archivo_software_seleccionado', JSON.stringify({ id, tipo }));
    this.router.navigate(['/cliente-software'], { queryParams: { id } });
  } else {
    const claveStorage = `archivo_${tipo}_seleccionado`;
    sessionStorage.setItem(claveStorage, JSON.stringify({ id, tipo }));
    this.router.navigate([`/dashboard/${tipo}`, id]);
  }
}

}
