import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ResourceCard from './components/ResourceCard';
import Footer from './components/Footer';
import { fetchRecursos, flushPendingLogs } from './api';
import type { Recurso } from './types';

const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 min: el listado casi no cambia intradía

export default function App() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoActivo, setTipoActivo] = useState('Todos');
  const [query, setQuery] = useState('');

  async function load(force = false) {
    try {
      setError(null);
      const data = await fetchRecursos({ force });
      setRecursos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de recursos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    flushPendingLogs();

    const interval = setInterval(() => load(true), AUTO_REFRESH_MS);
    const onOnline = () => flushPendingLogs();
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipos = useMemo(() => {
    const set = new Set(recursos.map((r) => r.tipo).filter(Boolean));
    return Array.from(set).sort();
  }, [recursos]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recursos.filter((r) => {
      const matchTipo = tipoActivo === 'Todos' || r.tipo === tipoActivo;
      const matchQuery = !q || r.titulo.toLowerCase().includes(q);
      return matchTipo && matchQuery;
    });
  }, [recursos, tipoActivo, query]);

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <FilterBar
        tipos={tipos}
        tipoActivo={tipoActivo}
        onTipoChange={setTipoActivo}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="mx-auto w-full max-w-shell flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ulima-ink md:text-3xl">
            Recursos de Biblioteca
          </h1>
          <div className="mt-2 h-1 w-14 bg-ulima-orange" />
          <p className="mt-3 max-w-2xl text-sm text-ulima-slate">
            Diarios, revistas, libros y bases de datos suscritos por la Universidad de Lima.
            Haz clic en cualquier recurso para acceder directamente.
          </p>
        </div>

        {loading && <SkeletonGrid />}

        {!loading && error && (
          <div className="rounded-md border border-ulima-line bg-white p-6 text-sm text-ulima-slate">
            <p className="font-semibold text-ulima-ink">No se pudo cargar el listado.</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                load(true);
              }}
              className="mt-4 rounded-md bg-ulima-orange px-4 py-2 text-xs font-semibold text-white hover:bg-ulima-orange-dark"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filtrados.length === 0 && (
          <div className="rounded-md border border-ulima-line bg-white p-6 text-sm text-ulima-slate">
            No hay recursos que coincidan con la búsqueda.
          </div>
        )}

        {!loading && !error && filtrados.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtrados.map((r) => (
              <ResourceCard key={`${r.titulo}-${r.enlace}`} recurso={r} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-md border border-ulima-line bg-white"
        >
          <div className="h-28 border-b border-ulima-line bg-ulima-bg" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 rounded bg-ulima-line" />
            <div className="h-4 w-3/4 rounded bg-ulima-line" />
            <div className="h-4 w-1/2 rounded bg-ulima-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
