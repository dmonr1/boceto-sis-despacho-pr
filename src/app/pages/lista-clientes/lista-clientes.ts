import { Component } from '@angular/core';
import { ExcelData } from '../../services/excel-data';
import { CommonModule } from '@angular/common';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import html2pdf from 'html2pdf.js';
import { read, utils } from 'xlsx';
import { ActivatedRoute } from '@angular/router';
import { Archivo } from '../../services/archivo';

@Component({
  selector: 'app-lista-clientes',
  imports: [CommonModule, NzAvatarModule, FormsModule, NzIconModule],
  standalone: true,
  templateUrl: './lista-clientes.html',
  styleUrl: './lista-clientes.scss'
})
export class ListaClientes {
  datosOriginales: any[] = [];
  datosFiltrados: any[] = [];
  textoBusqueda: string = '';
  clienteSeleccionado: any = null;
  animarContenido = false;

  tipo: string = '';
  idArchivo: number = 0;

  constructor(
    private route: ActivatedRoute,
    private archivoService: Archivo
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const tipoParam = this.route.snapshot.paramMap.get('tipo');

    if (idParam && tipoParam) {
      this.tipo = tipoParam;
      this.idArchivo = Number(idParam);
      sessionStorage.setItem('archivoResumAct', JSON.stringify({ id: this.idArchivo, tipo: this.tipo }));
    } else {
      const guardado = sessionStorage.getItem('archivoResumAct');
      if (guardado) {
        const { id, tipo } = JSON.parse(guardado);
        this.idArchivo = id;
        this.tipo = tipo;
      } else {
        console.warn('No hay archivo seleccionado');
        return;
      }
    }

    this.archivoService.descargarArchivoPorId(this.idArchivo).subscribe({
      next: async (blob) => {
        const buffer = await blob.arrayBuffer();
        const workbook = read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const datos = utils.sheet_to_json(workbook.Sheets[sheetName]);
        this.procesarDatos(datos);
        console.log(datos)
      },
      error: () => {
        console.error('Error al cargar el archivo Excel.');
      }
    });
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
    const texto = this.textoBusqueda.trim().toLowerCase();

    if (!texto) {
      this.datosFiltrados = [...this.datosOriginales];
      this.clienteSeleccionado = this.datosFiltrados[0] || null;
      return;
    }

    const terminos = texto.split(',').map(t => t.trim()).filter(t => t);

    this.datosFiltrados = this.datosOriginales.filter(cliente =>
      terminos.some(termino => cliente.cliente.toLowerCase().includes(termino))
    );

    this.clienteSeleccionado = this.datosFiltrados[0] || null;
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
    if (estado.includes('no autorizado')) return '#ffde4dff';
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
