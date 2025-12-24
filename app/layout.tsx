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
        {/* HEADER SPACE */}
        <div className="fixed top-0 left-0 right-0 z-50 h-24 backdrop-blur-xl bg-[#030712]/60 border-b border-white/5" />

        {/* PAGE WRAPPER */}
        <div className="relative">
          {/* GLOBAL BACKGROUND GLOWS */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[180px]" />
            <div className="absolute right-[5%] bottom-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[200px]" />
          </div>

          {/* CONTENT CONTAINER */}
          <main className="mx-auto max-w-[1200px] px-6 pt-40">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
