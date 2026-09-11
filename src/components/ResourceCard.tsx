import { useState } from 'react';
import { ArrowUpRight, BookOpen, Database, Newspaper, FileText } from 'lucide-react';
import type { Recurso } from '../types';
import { logClick } from '../api';

interface ResourceCardProps {
  recurso: Recurso;
}

const MAX_INTENTOS_IMAGEN = 3;
const REINTENTO_IMAGEN_MS = 900;

function iconForTipo(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes('diario')) return Newspaper;
  if (t.includes('revista')) return FileText;
  if (t.includes('base de datos')) return Database;
  if (t.includes('libro')) return BookOpen;
  return FileText;
}

export default function ResourceCard({ recurso }: ResourceCardProps) {
  const [intento, setIntento] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = iconForTipo(recurso.tipo);
  const showImage = Boolean(recurso.imagen) && !imgFailed;

  // Las imágenes de logos a veces fallan por hipos de red pasajeros, no
  // porque la URL esté rota (se confirmó: la misma imagen carga bien en
  // otros intentos). En vez de rendirnos al primer error, reintentamos con
  // un pequeño retraso y un "cache-buster" antes de mostrar el ícono.
  function handleImgError() {
    if (intento + 1 < MAX_INTENTOS_IMAGEN) {
      setTimeout(() => setIntento((n) => n + 1), REINTENTO_IMAGEN_MS);
    } else {
      setImgFailed(true);
    }
  }

  const imagenConCacheBuster =
    intento === 0 ? recurso.imagen : `${recurso.imagen}${recurso.imagen?.includes('?') ? '&' : '?'}retry=${intento}`;

  function handleOpen() {
    // Abrimos primero para que el clic se sienta instantáneo; el registro
    // en el historial ocurre en paralelo y nunca bloquea la navegación.
    window.open(recurso.enlace, '_blank', 'noopener,noreferrer');
    logClick(recurso.titulo, recurso.enlace);
  }

  return (
    <button
      onClick={handleOpen}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-ulima-line bg-white text-left transition-all hover:-translate-y-0.5 hover:border-ulima-orange hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="flex h-28 items-center justify-center border-b border-ulima-line bg-ulima-bg">
        {showImage ? (
          <img
            key={intento}
            src={imagenConCacheBuster}
            alt=""
            onError={handleImgError}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-9 w-9 text-ulima-orange/80" strokeWidth={1.5} aria-hidden />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit items-center rounded-full bg-ulima-orange/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ulima-orange-dark">
          {recurso.tipo}
        </span>
        <h3 className="text-[15px] font-bold leading-snug text-ulima-ink">
          {recurso.titulo}
        </h3>
        <div className="mt-auto flex items-center gap-1 pt-1 text-[13px] font-semibold text-ulima-slate group-hover:text-ulima-orange">
          Ingresar
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </button>
  );
}