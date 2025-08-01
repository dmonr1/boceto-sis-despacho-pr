import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { Archivo } from '../../services/archivo';
import { AlertaPersonalizada } from '../../components/alerta-personalizada/alerta-personalizada';
import { read, utils } from 'xlsx';

@Component({
  selector: 'app-cliente-hardware',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzAvatarModule, NzProgressModule, AlertaPersonalizada],
  templateUrl: './cliente-hardware.html',
  styleUrl: './cliente-hardware.scss'
})
export class ClienteHardware implements OnInit {
  datosHardware: any[] = [];
  clientesFiltrados: any[] = [];
  filtroCliente: string = '';

  memoriaDisponibleGB: number = 0;
  memoriaTotalGB: number = 0;
  porcentajeMemoriaDisponible: number = 0;

  clienteSeleccionadoHardware: any = null;
  animarContenidoHardware: boolean = false;

  archivosHardware: any[] = [];
  mostrarDropdown = false;
  cargandoArchivo = false;

  idArchivo: number = 0;

  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';

  constructor(private archivoService: Archivo) { }

  ngOnInit(): void {
    this.obtenerArchivosHardware();

    const guardado = sessionStorage.getItem('archivo_hardware_seleccionado');
    if (guardado) {
      const { id, tipo } = JSON.parse(guardado);
      if (tipo === 'hardware') {
        this.idArchivo = id;
        this.cargarArchivoHardwarePorId(id);
        return;
      }
    }

    this.mostrarNotificacion('warning', 'Debe seleccionar un archivo de tipo hardware desde la pestaña correspondiente.');
  }

  get hayArchivoCargado(): boolean {
    return !!sessionStorage.getItem('archivo_hardware_seleccionado');
  }

  obtenerArchivosHardware(): void {
    this.archivoService.listarPorTipo('hardware').subscribe({
      next: (res) => this.archivosHardware = res,
      error: () => this.mostrarNotificacion('error', 'No se pudo obtener la lista de archivos hardware.')
    });
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cambiarArchivo(archivo: any): void {
    if (archivo.tipoArchivo !== 'hardware') {
      this.mostrarNotificacion('warning', 'Solo se admiten archivos tipo Hardware.');
      return;
    }

    this.idArchivo = archivo.id;
    sessionStorage.setItem('archivo_hardware_seleccionado', JSON.stringify({ id: archivo.id, tipo: archivo.tipoArchivo }));
    this.mostrarDropdown = false;
    this.cargarArchivoHardwarePorId(archivo.id);
  }

  obtenerValorSeguro(valor: any, textoPorDefecto: string = 'Desconocido'): string {
    return valor && valor.toString().trim() !== '' ? valor : textoPorDefecto;
  }

  cargarArchivoHardwarePorId(id: number): void {
    this.cargandoArchivo = true;
    this.archivoService.descargarArchivoPorId(id).subscribe({
      next: async (blob) => {
        try {
          const buffer = await blob.arrayBuffer();
          const workbook = read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const datos = utils.sheet_to_json(workbook.Sheets[sheetName]);

          console.log('Datos brutos:', datos);

          this.datosHardware = datos.map(fila => this.repararObjeto(fila));
          console.log('Datos reparados:', this.datosHardware);

          this.clientesFiltrados = this.datosHardware;

          if (this.datosHardware.length > 0) {
            this.seleccionarClienteHardware(this.datosHardware[0]);
          } else {
            this.mostrarNotificacion('warning', 'El archivo de hardware está vacío o corrupto.');
          }
        } catch (e) {
          console.error('Error procesando Excel:', e);
          this.mostrarNotificacion('error', 'Error al procesar el archivo.');
        } finally {
          this.cargandoArchivo = false;
        }
      },
      error: () => {
        this.mostrarNotificacion('error', 'No se pudo cargar el archivo de hardware.');
        this.cargandoArchivo = false;
      }
    });
  }

  seleccionarClienteHardware(fila: any): void {
    this.clienteSeleccionadoHardware = {
      cliente: this.obtenerValorSeguro(fila['Cliente']),
      cpu: this.obtenerValorSeguro(fila['CPU']),
      idCpu: this.obtenerValorSeguro(fila['ID de la CPU']),
      velocidadCpu: this.obtenerValorSeguro(fila['Velocidad de la CPU (MHz)']),
      ram: this.obtenerValorSeguro(fila['RAM']),
      fabricanteSistema: this.obtenerValorSeguro(fila['Fabricante del sistema']),
      nombreSistema: this.obtenerValorSeguro(fila['Nombre del sistema']),
      versionSistema: this.obtenerValorSeguro(fila['Versión del sistema']),
      familiaSistema: this.obtenerValorSeguro(fila['Familia del sistema']),
      fabricanteBios: this.obtenerValorSeguro(fila['Fabricante del BIOS']),
      fechaBios: this.obtenerValorSeguro(fila['Fecha de publicación del BIOS']),
      versionBios: this.obtenerValorSeguro(fila['Versión del BIOS']),
      fabricantePlaca: this.obtenerValorSeguro(fila['Fabricante de la placa base']),
      placaBase: this.obtenerValorSeguro(fila['Placa base']),
      versionPlaca: this.obtenerValorSeguro(fila['Versión de la placa base']),
      memoriaDisponible: this.obtenerValorSeguro(fila['Memoria del sistema disponible']),
      memoriaTotal: this.obtenerValorSeguro(fila['Memoria total disponible']),
    };

    this.memoriaDisponibleGB = this.convertirAMemoriaGB(fila['Memoria del sistema disponible']);
    this.memoriaTotalGB = this.convertirAMemoriaGB(fila['Memoria total disponible']);
    this.porcentajeMemoriaDisponible = this.memoriaTotalGB > 0
      ? Math.round((this.memoriaDisponibleGB / this.memoriaTotalGB) * 100)
      : 0;

    this.animarContenidoHardware = false;
    setTimeout(() => this.animarContenidoHardware = true, 10);
  }

  convertirAMemoriaGB(valor: string): number {
    if (!valor) return 0;
    valor = valor.replace(',', '.').trim().toUpperCase();
    if (valor.endsWith('TB')) return parseFloat(valor) * 1024;
    if (valor.endsWith('GB')) return parseFloat(valor);
    if (valor.endsWith('MB')) return parseFloat(valor) / 1024;
    return 0;
  }

  convertirFechaExcel(fechaSerial: number): string {
    const fechaBase = new Date(1899, 11, 30);
    const fecha = new Date(fechaBase.getTime() + fechaSerial * 86400000);
    return fecha.toISOString().split('T')[0];
  }

  formatPorcentaje = (): string => `${this.porcentajeMemoriaDisponible}%`;

  obtenerColorMemoria(): string {
    if (this.porcentajeMemoriaDisponible > 70) return '#52c41a';
    if (this.porcentajeMemoriaDisponible > 30) return '#faad14';
    return '#f5222d';
  }


  buscarCliente(): void {
    const filtros = this.filtroCliente
      .split(',')
      .map(f => f.trim().toLowerCase())
      .filter(f => f !== '');

    if (filtros.length === 0) {
      this.mostrarNotificacion('warning', 'Debe ingresar un nombre de cliente para buscar.');
      this.filtroCliente = '';
      this.clientesFiltrados = this.datosHardware;
      return;
    }

    this.clientesFiltrados = this.datosHardware.filter(cliente => {
      const nombre = (cliente['Cliente'] || '').toLowerCase();
      return filtros.some(filtro => nombre.includes(filtro));
    });
  }

  filtrarAlEscribir(): void {
    const filtros = this.filtroCliente
      .split(',')
      .map(f => f.trim().toLowerCase())
      .filter(f => f !== '');

    this.clientesFiltrados = filtros.length === 0
      ? this.datosHardware
      : this.datosHardware.filter(cliente => {
        const nombre = (cliente['Cliente'] || '').toLowerCase();
        return filtros.some(filtro => nombre.includes(filtro));
      });
  }

  validarBusqueda(): void {
    const valor = this.filtroCliente.trim();
    if (!valor) {
      this.mostrarNotificacion('warning', 'Debe ingresar un nombre de cliente para buscar.');
      this.clientesFiltrados = this.datosHardware;
    }
  }

  obtenerLogoFabricante(fabricante: string | undefined): string {
    const clave = (fabricante || '').toLowerCase().trim();

    if (clave.includes('lenovo')) return 'assets/images/logos-hardware/lenovo.png';
    if (clave.includes('dell')) return 'assets/images/logos-hardware/Dell_Logo.png';
    if (clave.includes('hp') || clave.includes('hewlett')) return 'assets/images/logos-hardware/hp-logo.png';
    if (clave.includes('intel')) return 'assets/images/logos-hardware/intel.png';
    if (clave.includes('toshiba')) return 'assets/images/logos-hardware/toshiba.png';
    if (clave.includes('vmware')) return 'assets/images/logos-hardware/Vmware.png';
    return 'assets/images/logos-hardware/determinar.png';
  }

  obtenerLogoCPU(cpu: string | undefined): string {
    const clave = (cpu || '').toLowerCase();

    if (clave.includes('i3')) return 'assets/images/logos-cpu/core-i3.png';
    if (clave.includes('i5')) return 'assets/images/logos-cpu/core-i5.png';
    if (clave.includes('i7')) return 'assets/images/logos-cpu/core-i7.png';
    if (clave.includes('i9')) return 'assets/images/logos-cpu/core-i9.png';
    if (clave.includes('xeon')) return 'assets/images/logos-cpu/intel-xeon.png';

    return 'assets/images/logos-cpu/images.png';
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'warning', mensaje: string) {
    this.tipoAlerta = tipo;
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
  }

  cerrarNotificacion() {
    this.mostrarAlerta = false;
  }

  private repararTexto(valor: any): string {
    if (!valor) return '';
    return valor.toString()
      .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í')
      .replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú').replace(/Ã‘/g, 'Ñ')
      .replace(/Ã/g, '');
  }

  private repararObjeto(obj: any): any {
    const reparado: any = {};

    for (const clave in obj) {
      let valor = this.repararTexto(obj[clave]);

      if (clave.toLowerCase().includes('fecha')) {
        const numero = Number(valor);
        if (!isNaN(numero) && numero > 30000 && numero < 60000) {
          valor = this.convertirFechaExcel(numero);
        }
      }

      if (valor === '---' || valor === '') {
        valor = 'Desconocido';
      }

      reparado[this.repararTexto(clave).trim()] = valor;
    }

    return reparado;
  }
}
