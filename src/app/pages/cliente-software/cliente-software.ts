import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute } from '@angular/router';
import { Archivo } from '../../services/archivo';
import { AlertaPersonalizada } from '../../components/alerta-personalizada/alerta-personalizada';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-cliente-software',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, AlertaPersonalizada],
  templateUrl: './cliente-software.html',
  styleUrl: './cliente-software.scss'
})

export class ClienteSoftware {
  textoBusqueda = '';
  filtroSoftware = '';
  inputActivo = false;
  datosFiltrados: any[] = [];
  datosFiltradosOriginal: any[] = [];
  archivosSoftware: any[] = [];
  idArchivo = 0;
  mostrarDropdown = false;
  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';
  todosLosClientes: string[] = [];
  clientesFiltrados: string[] = [];
  filaSeleccionada: any = null;
  historialVersiones: any[] = [];
  ultimaFechaVersion: string = '';
  ultimaVersionNombre: string = '';
  cargandoHistorial: boolean = false;
  cargandoGraficos: boolean = false;

  constructor(private archivoService: Archivo, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const guardado = sessionStorage.getItem('archivo_software_seleccionado');
    if (guardado) {
      const { id, tipo } = JSON.parse(guardado);
      if (tipo === 'software') this.idArchivo = id;
    } else {
      const idParam = this.route.snapshot.queryParamMap.get('id');
      if (idParam) this.idArchivo = parseInt(idParam, 10);
    }

    this.obtenerArchivosSoftware();
    if (this.idArchivo) {
      this.obtenerTodosLosClientes();

      const clienteGuardado = sessionStorage.getItem('cliente_software_seleccionado');
      if (clienteGuardado) {
        this.textoBusqueda = clienteGuardado;
        setTimeout(() => this.buscarCliente(), 0);
      }
    }
  }

  get hayArchivoCargado(): boolean {
    return !!sessionStorage.getItem('archivo_software_seleccionado');
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  cambiarArchivo(archivo: any) {
    if (archivo.tipoArchivo !== 'software') {
      this.mostrarNotificacion('warning', 'Solo se admiten archivos tipo Software.');
      return;
    }

    this.idArchivo = archivo.id;
    sessionStorage.removeItem('cliente_software_seleccionado');

    sessionStorage.setItem('archivo_software_seleccionado', JSON.stringify({
      id: archivo.id,
      tipo: archivo.tipoArchivo
    }));

    this.mostrarDropdown = false;
    this.obtenerTodosLosClientes();
  }

  ocultarListaConRetraso() {
    setTimeout(() => (this.inputActivo = false), 200);
  }

  filtrarClientes() {
    const texto = this.textoBusqueda.trim().toLowerCase();
    this.clientesFiltrados = texto
      ? this.todosLosClientes.filter(c => c.toLowerCase().includes(texto)).slice(0, 50)
      : [...this.todosLosClientes];
  }

  seleccionarClienteDesdeLista(cliente: string) {
    this.textoBusqueda = cliente;
    this.inputActivo = false;
    this.clientesFiltrados = [];
    setTimeout(() => this.buscarCliente(), 0);
  }

  buscarCliente() {
    const texto = this.textoBusqueda.trim();
    if (!texto) return this.mostrarNotificacion('warning', 'Debe ingresar un cliente para buscar.');
    if (!this.idArchivo) return this.mostrarNotificacion('warning', 'Debe elegir un archivo antes de buscar.');

    this.archivoService.obtenerClientesUnicosSoftware(this.idArchivo).subscribe({
      next: clientes => {
        const clienteExiste = clientes.some(nombre => nombre.toLowerCase() === texto.toLowerCase());
        sessionStorage.setItem('cliente_software_seleccionado', texto);
        if (!clienteExiste) {
          this.mostrarNotificacion('error', `El cliente "${texto}" no existe en el archivo seleccionado.`);
          return;
        }

        this.archivoService.obtenerDatosSoftware(this.idArchivo, texto).subscribe({
          next: res => {
            const normalizados = res.map(item => ({
              ...item,
              nombre: (item.nombre || '').trim(),
              instalado: (item.instalado || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
            }));

            const porSoftware = new Map<string, any[]>();
            normalizados.forEach(item => {
              if (!porSoftware.has(item.nombre)) porSoftware.set(item.nombre, []);
              porSoftware.get(item.nombre)!.push(item);
            });

            const resultadoFinal: any[] = [];
            porSoftware.forEach(items => {
              const siItems = items.filter(i => i.instalado === 'SI');
              if (siItems.length > 0) {
                resultadoFinal.push(...siItems);
              } else {
                const noItems = items.filter(i => i.instalado === 'NO' && i.fecha)
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                resultadoFinal.push(noItems[0] || items[0]);
              }
            });

            this.datosFiltrados = resultadoFinal.sort((a, b) =>
              a.nombre.localeCompare(b.nombre, 'es', { numeric: true, sensitivity: 'base' })
            );
            this.datosFiltradosOriginal = [...this.datosFiltrados];

            if (this.datosFiltrados.length > 0) {
              this.seleccionarFilaTabla(this.datosFiltrados[0]);
            } else {
              this.mostrarNotificacion('warning', 'No se encontraron registros para ese cliente.');
            }

            this.generarGraficoFabricantes();
            this.generarGraficoInstalaciones();
          },
          error: err => {
            console.error('Error al buscar datos:', err);
            this.mostrarNotificacion('error', 'Error al buscar datos en el servidor.');
          }
        });
      },
      error: err => {
        console.error('Error al obtener clientes únicos:', err);
        this.mostrarNotificacion('error', 'No se pudo validar el cliente en el archivo.');
      }
    });
  }

  seleccionarFilaTabla(fila: any) {
    this.filaSeleccionada = fila;
    this.mostrarHistorialSoftware(fila);
  }

  mostrarHistorialSoftware(filaSeleccionada: any) {
    this.cargandoHistorial = true;
    const nombreSoftware = filaSeleccionada.nombre;
    const cliente = filaSeleccionada.cliente;

    this.archivoService.obtenerDatosSoftware(this.idArchivo, cliente).subscribe({
      next: (res) => {
        const historial = res.filter(item => item.nombre === nombreSoftware);
        const historialLimpio = historial.map(item => ({
          ...item,
          fecha: item.fecha?.toLowerCase() === 'desconocido' || !item.fecha ? null : item.fecha,
          version: item.version || '0.0.0'
        }));

        const conFecha = historialLimpio.filter(h => h.fecha);
        if (conFecha.length > 0) {
          this.historialVersiones = historialLimpio.sort((a, b) =>
            new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime()
          );
          this.ultimaFechaVersion = conFecha[0]?.fecha || '';
        } else {
          const parseVersion = (v: string) => v.split('.').map(num => parseInt(num) || 0);
          this.historialVersiones = historialLimpio.sort((a, b) => {
            const va = parseVersion(a.version);
            const vb = parseVersion(b.version);
            for (let i = 0; i < Math.max(va.length, vb.length); i++) {
              const diff = (vb[i] || 0) - (va[i] || 0);
              if (diff !== 0) return diff;
            }
            return 0;
          });
          this.ultimaFechaVersion = '';
          this.ultimaVersionNombre = this.historialVersiones[0]?.version || '';
        }
      },
      error: () => {
        this.historialVersiones = [];
        this.ultimaFechaVersion = '';
        this.ultimaVersionNombre = '';
      },
      complete: () => {
        this.cargandoHistorial = false;
      }
    });
  }

  obtenerValorSeguro(valor: any): string {
    return valor && valor.toString().trim() !== '' ? valor : 'Desconocido';
  }

  mostrarNotificacion(tipo: 'success' | 'error' | 'warning', mensaje: string) {
    this.tipoAlerta = tipo;
    this.mensajeAlerta = mensaje;
    this.mostrarAlerta = true;
  }

  cerrarNotificacion() {
    this.mostrarAlerta = false;
  }

  obtenerArchivosSoftware() {
    this.archivoService.listarPorTipo('software').subscribe({
      next: res => this.archivosSoftware = res,
      error: () => this.mostrarNotificacion('error', 'No se pudieron cargar los archivos.')
    });
  }

  obtenerTodosLosClientes() {
    this.archivoService.obtenerClientesUnicosSoftware(this.idArchivo).subscribe({
      next: clientes => {
        this.todosLosClientes = clientes.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
        this.clientesFiltrados = [...this.todosLosClientes];
      },
      error: () => {
        this.todosLosClientes = [];
        this.clientesFiltrados = [];
      }
    });
  }

  filtrarPorSoftware() {
    const texto = this.filtroSoftware.trim().toLowerCase();
    this.datosFiltrados = texto
      ? this.datosFiltradosOriginal.filter(d => (d.nombre || '').toLowerCase().includes(texto))
      : [...this.datosFiltradosOriginal];
  }

  generarGraficoFabricantes() {
    this.cargandoGraficos = true;

    const conteo = this.datosFiltrados.reduce((acc, fila) => {
      const fabricante = fila.fabricante || 'Desconocido';
      acc[fabricante] = (acc[fabricante] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const canvas = document.getElementById('graficoBarras') as HTMLCanvasElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.replaceChild(canvas.cloneNode(true), canvas);
    }

    new Chart('graficoBarras', {
      type: 'bar',
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: 'Programas instalados',
          data: Object.values(conteo),
          backgroundColor: '#faaa3b',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { beginAtZero: true }
        }
      }
    });

    setTimeout(() => this.cargandoGraficos = false, 300);
  }

  generarGraficoInstalaciones() {

    this.cargandoGraficos = true;

    const fechas = this.datosFiltrados
      .filter(f => f.fecha && f.fecha !== 'Desconocido')
      .map(f => f.fecha);

    const conteoFechas = fechas.reduce((acc, fecha) => {
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const canvas = document.getElementById('graficoLineas') as HTMLCanvasElement;
    if (canvas?.parentNode) canvas.parentNode.replaceChild(canvas.cloneNode(true), canvas);

    new Chart('graficoLineas', {
      type: 'line',
      data: {
        labels: Object.keys(conteoFechas),
        datasets: [{
          label: 'Instalaciones',
          data: Object.values(conteoFechas),
          fill: false,
          borderColor: '#df2319',
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Fecha' } },
          y: { title: { display: true, text: 'Cantidad' }, beginAtZero: true }
        }
      }
    });
    setTimeout(() => this.cargandoGraficos = false, 300);
  }

  limpiarInput() {
    this.filtroSoftware = '';
    this.filtrarPorSoftware(); 
  }
}
