import "./globals.css";

export const metadata = {
  title: "Verlo",
  description: "Alquila con libertad total",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#030712] text-white antialiased">

        {/* BACKGROUND GLOBAL */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[15%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[160px]" />
          <div className="absolute right-[10%] bottom-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[180px]" />
        </div>

        {/* NAVBAR */}
        <header className="fixed top-0 z-50 w-full">
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
              <div className="text-xl font-black tracking-tight">
                VERLO<span className="text-indigo-400">.</span>
              </div>

              <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
                <a className="hover:text-white" href="#">Experiencia</a>
                <a className="hover:text-white" href="#">El Viaje</a>
                <a className="hover:text-white" href="#">Seguridad</a>
              </nav>

              <button className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold hover:bg-indigo-500">
                Lanzar App
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="relative pt-32">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="mt-32 border-t border-white/10 px-6 py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm text-slate-500 md:flex-row">
            <div className="font-bold text-white">VERLO.TECH</div>

            <div className="flex gap-6">
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Soporte</a>
            </div>

            <div className="text-xs">
              © 2024 — Diseñado para el futuro
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
