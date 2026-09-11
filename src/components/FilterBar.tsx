import { Search } from 'lucide-react';

interface FilterBarProps {
  tipos: string[];
  tipoActivo: string;
  onTipoChange: (tipo: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

const TODOS = 'Todos';

export default function FilterBar({
  tipos,
  tipoActivo,
  onTipoChange,
  query,
  onQueryChange,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-ulima-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-shell flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex flex-wrap items-center gap-2">
          {[TODOS, ...tipos].map((tipo) => {
            const active = tipo === tipoActivo;
            return (
              <button
                key={tipo}
                onClick={() => onTipoChange(tipo)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? 'border-ulima-orange bg-ulima-orange text-white'
                    : 'border-ulima-line bg-white text-ulima-slate hover:border-ulima-orange hover:text-ulima-orange'
                }`}
              >
                {tipo}
              </button>
            );
          })}
        </div>

        <label className="relative flex w-full items-center md:w-72">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 h-4 w-4 text-ulima-slate"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full rounded-md border border-ulima-line bg-white py-2 pl-9 pr-3 text-sm text-ulima-ink placeholder:text-ulima-slate/70 focus:border-ulima-orange"
          />
        </label>
      </div>
    </div>
  );
}
