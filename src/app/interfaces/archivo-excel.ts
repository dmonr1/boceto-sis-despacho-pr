export type TipoArchivo = 'resumen' | 'hardware' | 'software';

export interface ArchivoExcel {
  id: number;
  nombreArchivo: string;
  nombreOriginal: string;
  tipoArchivo: TipoArchivo;
  fechaSubida: string;
}
