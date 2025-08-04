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
  datosFiltrados: any[] = [];
  archivosSoftware: any[] = [];
  mostrarDropdown = false;
  idArchivo = 0;
  mostrarAlerta = false;
  tipoAlerta: 'success' | 'error' | 'warning' = 'success';
  mensajeAlerta = '';
  cantidadInstalados = 0;

  constructor(private archivoService: Archivo, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const guardado = sessionStorage.getItem('archivo_software_seleccionado');
    if (guardado) {
      const { id, tipo } = JSON.parse(guardado);
      if (tipo === 'software') {
        this.idArchivo = id;
      }
    } else {
      const idParam = this.route.snapshot.queryParamMap.get('id');
      if (idParam) {
        this.idArchivo = parseInt(idParam, 10);
      }
    }

    this.obtenerArchivosSoftware();
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
    sessionStorage.setItem('archivo_software_seleccionado', JSON.stringify({
      id: archivo.id,
      tipo: archivo.tipoArchivo
    }));

    this.mostrarDropdown = false;
  }

  buscarCliente() {
    const texto = this.textoBusqueda.trim();

    if (!texto) {
      this.mostrarNotificacion('warning', 'Debe ingresar un cliente para buscar.');
      return;
    }

    if (!this.idArchivo) {
      this.mostrarNotificacion('warning', 'Debe elegir un archivo antes de buscar.');
      return;
    }

    this.archivoService.obtenerClientesUnicosSoftware(this.idArchivo).subscribe({
      next: (clientes) => {
        const clienteExiste = clientes.some(nombre => nombre.toLowerCase() === texto.toLowerCase());

        if (!clienteExiste) {
          this.mostrarNotificacion('error', `El cliente "${texto}" no existe en el archivo seleccionado.`);
          return;
        }

        this.archivoService.obtenerDatosSoftware(this.idArchivo, texto).subscribe({
          next: (res) => {
            this.datosFiltrados = res.filter(item => {
              const valor = (item.instalado || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
              return valor === 'SI';
            });

            if (this.datosFiltrados.length === 0) {
              this.mostrarNotificacion('warning', 'No se encontraron registros instalados para ese cliente.');
            }

            // ✅ Generar gráficos solo cuando hay datos reales
            this.generarGraficoFabricantes();
            this.generarGraficoInstalaciones();
          },
          error: (err) => {
            console.error('Error al buscar datos:', err);
            this.mostrarNotificacion('error', 'Error al buscar datos en el servidor.');
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener clientes únicos:', err);
        this.mostrarNotificacion('error', 'No se pudo validar el cliente en el archivo.');
      }
    });
  }

  mostrarHistorialSoftware(filaSeleccionada: any) {
    const nombreSoftware = filaSeleccionada.nombre;
    const cliente = filaSeleccionada.cliente;
  
    this.archivoService.obtenerDatosSoftware(this.idArchivo, cliente).subscribe({
      next: (res) => {
        const historial = res.filter(item => item.nombre === nombreSoftware);
  
        this.historialVersiones = historial.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return fechaB - fechaA;
        });
  
        this.ultimaFechaVersion = this.historialVersiones[0]?.fecha || '';
      },
      error: (err) => {
        console.error('Error al obtener historial del software:', err);
        this.historialVersiones = [];
        this.ultimaFechaVersion = '';
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

  get hayArchivoCargado(): boolean {
    return !!sessionStorage.getItem('archivo_software_seleccionado');
  }

  obtenerArchivosSoftware() {
    this.archivoService.listarPorTipo('software').subscribe({
      next: (res) => {
        this.archivosSoftware = res;
      },
      error: (err) => {
        this.mostrarNotificacion('error', 'No se pudieron cargar los archivos.');
      }
    });
  }

  generarGraficoFabricantes() {
    const conteo = this.datosFiltrados.reduce((acc, fila) => {
      const fabricante = fila.fabricante || 'Desconocido';
      acc[fabricante] = (acc[fabricante] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const canvas = document.getElementById('graficoBarras') as HTMLCanvasElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.replaceChild(canvas.cloneNode(true), canvas); // Limpiar gráfico anterior
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { beginAtZero: true }
        }
      }
    });
  }

  historialVersiones: any[] = [];
ultimaFechaVersion: string = '';


  generarGraficoInstalaciones() {
    const fechas = this.datosFiltrados
      .filter(f => f.fecha && f.fecha !== 'Desconocido')
      .map(f => f.fecha);

    const conteoFechas = fechas.reduce((acc, fecha) => {
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const canvas = document.getElementById('graficoLineas') as HTMLCanvasElement;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.replaceChild(canvas.cloneNode(true), canvas); // Limpiar gráfico anterior
    }

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
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { title: { display: true, text: 'Fecha' } },
          y: { title: { display: true, text: 'Cantidad' }, beginAtZero: true }
        }
      }
    });
  }
}
