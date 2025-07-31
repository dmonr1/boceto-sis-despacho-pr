import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute } from '@angular/router';
import { read, utils } from 'xlsx';
import html2pdf from 'html2pdf.js';

import { Archivo } from '../../services/archivo';
import { AlertaPersonalizada } from '../../components/alerta-personalizada/alerta-personalizada';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, NzAvatarModule, NzIconModule, AlertaPersonalizada],
  templateUrl: './lista-clientes.html',
  styleUrl: './lista-clientes.scss'
})
export class ListaClientes {
  datosOriginales: any[] = [];
  datosFiltrados: any[] = [];
  textoBusqueda: string = '';
  clienteSeleccionado: any = null;
  animarContenido = false;
  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';
  tipo: string = '';
  idArchivo: number = 0;
  indiceClienteActual = 0;
  archivosResumen: any[] = [];
  mostrarDropdown = false;
  animarCambioArchivo = false;

  constructor(private route: ActivatedRoute, private archivoService: Archivo) {}

  ngOnInit(): void {
    this.obtenerArchivosResumen();

    const idParam = this.route.snapshot.paramMap.get('id');
    const tipoParam = this.route.snapshot.paramMap.get('tipo');

    if (idParam && tipoParam && tipoParam === 'resumen') {
      this.tipo = tipoParam;
      this.idArchivo = Number(idParam);
      sessionStorage.setItem('archivo_resumen_seleccionado', JSON.stringify({ id: this.idArchivo, tipo: this.tipo }));
      this.cargarArchivoPorId(this.idArchivo);
    } else {
      const guardado = sessionStorage.getItem('archivo_resumen_seleccionado');
      if (guardado) {
        const { id, tipo } = JSON.parse(guardado);
        if (tipo === 'resumen') {
          this.idArchivo = id;
          this.tipo = tipo;
          this.cargarArchivoPorId(this.idArchivo);
        } else {
          this.mostrarNotificacion('warning', 'Solo se admiten archivos de tipo Resumen en este componente.');
        }
      } else {
        this.mostrarNotificacion('warning', 'Debe cargar un archivo tipo resumen desde la pestaña correspondiente.');
      }
    }
  }

  get hayArchivoCargado(): boolean {
    return !!sessionStorage.getItem('archivo_resumen_seleccionado');
  }

  obtenerArchivosResumen() {
    this.archivoService.listarPorTipo('resumen').subscribe({
      next: (res) => {
        this.archivosResumen = res;
      },
      error: () => this.mostrarNotificacion('error', 'No se pudo obtener la lista de archivos resumen.')
    });
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cambiarArchivo(archivo: any) {
    if (archivo.tipoArchivo !== 'resumen') {
      this.mostrarNotificacion('warning', 'Solo se admiten archivos tipo Resumen.');
      return;
    }

    this.idArchivo = archivo.id;
    this.tipo = archivo.tipoArchivo;
    sessionStorage.setItem('archivo_resumen_seleccionado', JSON.stringify({ id: this.idArchivo, tipo: this.tipo }));
    this.mostrarDropdown = false;
    this.cargarArchivoPorId(this.idArchivo);
  }

  cargarArchivoPorId(id: number) {
    this.archivoService.descargarArchivoPorId(id).subscribe({
      next: async (blob) => {
        const buffer = await blob.arrayBuffer();
        const workbook = read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const datos = utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!datos || datos.length === 0) {
          this.mostrarNotificacion('warning', 'El archivo seleccionado no contiene datos.');
          return;
        }

        this.procesarDatos(datos);
      },
      error: () => {
        this.mostrarNotificacion('error', 'Ocurrió un error al descargar el archivo.');
      }
    });
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'warning', mensaje: string) {
    this.tipoAlerta = tipo;
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
  }

  cerrarNotificacion() {
    this.mostrarAlerta = false;
  }

  procesarDatos(datos: any[]) {
    const reparado = datos.map(fila => {
      const limpio = this.repararObjeto(fila);
      return {
        cliente: limpio['Cliente'] ?? '',
        ipv4: limpio['Dirección IPv4'] ?? '',
        estado: limpio['Estado de seguridad'] ?? '',
        motorA: limpio['Motor A'] ?? '',
        motorB: limpio['Motor B'] ?? '',
        version: limpio['Versión de G DATA Security Client'] ?? '',
        componentes: limpio['Componentes de seguridad'] ?? '',
        reiniciar: limpio['Es necesario reiniciar'] ?? '',
        ultimaSync: limpio['Última sincronización'] ?? '',
        actualizarVirus: limpio['Actualizar base de datos de virus / fecha'] ?? '',
        actualizarProgramas: limpio['Actualizar archivos de programa / fecha'] ?? '',
        tipo: limpio['Tipo'] ?? ''
      };
    });

    this.datosOriginales = reparado;
    this.datosFiltrados = [...reparado];

    if (this.datosFiltrados.length > 0) {
      this.seleccionarCliente(this.datosFiltrados[0]);
    }
  }

  seleccionarCliente(fila: any) {
    this.clienteSeleccionado = { ...fila };
    this.animarContenido = false;
    setTimeout(() => this.animarContenido = true, 10);
  }

  obtenerValorSeguro(valor: any, textoPorDefecto: string = 'Desconocido'): string {
    return valor && valor.toString().trim() !== '' ? valor : textoPorDefecto;
  }

  filtrarClientes() {
    if (!this.textoBusqueda.trim()) {
      this.mostrarNotificacion('warning', 'Debe ingresar un nombre de cliente para buscar.');
      return;
    }

    const texto = this.textoBusqueda.trim().toLowerCase();
    const terminos = texto.split(',').map(t => t.trim()).filter(t => t);

    this.datosFiltrados = this.datosOriginales.filter(cliente =>
      terminos.some(termino => cliente.cliente.toLowerCase().includes(termino))
    );

    this.indiceClienteActual = 0;
    this.seleccionarCliente(this.datosFiltrados[this.indiceClienteActual] || null);
  }

  cambiarCliente(direccion: number) {
    const nuevoIndice = this.indiceClienteActual + direccion;
    if (nuevoIndice >= 0 && nuevoIndice < this.datosFiltrados.length) {
      this.indiceClienteActual = nuevoIndice;
      this.seleccionarCliente(this.datosFiltrados[nuevoIndice]);
    }
  }

  onCambioTextoBusqueda() {
    const texto = this.textoBusqueda.trim().toLowerCase();

    if (texto === '') {
      this.datosFiltrados = [...this.datosOriginales];
      this.indiceClienteActual = 0;
      if (this.datosFiltrados.length > 0) {
        this.seleccionarCliente(this.datosFiltrados[0]);
      } else {
        this.clienteSeleccionado = null;
      }
    }
  }

  get letraAvatar() {
    return this.clienteSeleccionado?.cliente?.charAt(0).toUpperCase() || '-';
  }

  get iconoEstado() {
    const estado = this.clienteSeleccionado?.estado?.toLowerCase() || '';
    if (estado.includes('sin conexión con el servidor')) return 'disconnect';
    if (estado.includes('protegido')) return 'check-circle';
    if (estado.includes('riesgo')) return 'stop';
    if (estado.includes('no autorizado')) return 'warning';
    if (estado.includes('error') || estado.includes('sin conexión')) return 'wifi';
    return 'info-circle';
  }

  get colorEstado() {
    const estado = this.clienteSeleccionado?.estado?.toLowerCase() || '';
    if (estado.includes('sin conexión con el servidor')) return '#ff4d4f';
    if (estado.includes('protegido')) return '#52c41a';
    if (estado.includes('riesgo')) return '#ff4d4f';
    if (estado.includes('no autorizado')) return '#ffde4d';
    if (estado.includes('error') || estado.includes('sin conexión')) return '#ff4d4f';
    return '#d9d9d9';
  }

  imprimirPDF() {
    window.print();
  }

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
}
