export default function Header() {
  return (
    <header className="border-b border-ulima-line bg-white">
      <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-sm bg-ulima-orange text-sm font-extrabold text-white"
          >
            UL
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-bold tracking-tight text-ulima-ink">
              UNIVERSIDAD DE LIMA
            </p>
            <p className="text-[11px] font-medium tracking-wide text-ulima-slate">
              Biblioteca &middot; Recursos de información
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
