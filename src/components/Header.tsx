export default function Header() {
  return (
    <header className="border-b border-ulima-line bg-white">
      <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-6 py-4 md:px-10">
        <a href="https://www.ulima.edu.pe/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
          <img
            src="https://www.ulima.edu.pe/themes/custom/ulima/logo.svg"
            alt="Universidad de Lima"
            className="h-9 w-auto"
          />
        </a>
      </div>
    </header>
  );
}