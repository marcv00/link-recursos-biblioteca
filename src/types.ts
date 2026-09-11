export type TipoRecurso =
  | 'Diario'
  | 'Revista'
  | 'Base de datos'
  | 'Libro'
  | string;

export interface Recurso {
  titulo: string;
  tipo: TipoRecurso;
  enlace: string;
  imagen?: string;
}

export interface RecursosResponse {
  ok: boolean;
  resources?: Recurso[];
  error?: string;
}
