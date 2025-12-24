<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verlo | El Futuro del Alquiler</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');

        :root {
            --primary: #6366f1;
            --secondary: #a855f7;
            --accent: #22d3ee;
            --bg: #030712;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg);
            color: #ffffff;
            overflow-x: hidden;
        }

        .glow-bg {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -1;
            background: 
                radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.15) 0%, transparent 40%);
        }

        .glass {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .glass:hover {
            background: rgba(255, 255, 255, 0.07);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .text-gradient {
            background: linear-gradient(to right, #6366f1, #a855f7, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .btn-main {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .btn-main::after {
            content: '';
            position: absolute;
            top: -50%; left: -50%; width: 200%; height: 200%;
            background: conic-gradient(from 180deg at 50% 50%, transparent 0%, var(--primary) 25%, transparent 50%);
            animation: rotate 4s linear infinite;
            z-index: -1;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .floating {
            animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .step-card {
            border-left: 2px solid transparent;
            background: linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%);
        }
        
        .step-card:hover {
            border-left: 2px solid var(--accent);
        }
    </style>
</head>
<body>

<div class="glow-bg"></div>

<nav class="fixed w-full z-50 px-6 py-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center glass px-6 py-3 rounded-2xl">
        <div class="text-2xl font-extrabold tracking-tighter">
            VERLO<span class="text-cyan-400">_</span>
        </div>
        <div class="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
            <a href="#experiencia" class="hover:text-cyan-400 transition">Experiencia</a>
            <a href="#proceso" class="hover:text-cyan-400 transition">El Viaje</a>
            <a href="#" class="hover:text-cyan-400 transition">Seguridad</a>
        </div>
        <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30">
            Lanzar App
        </button>
    </div>
</nav>

<main class="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
    <div class="absolute top-20 left-10 w-64 h-64 bg-indigo-600/10 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[150px] rounded-full"></div>

    <div class="text-center z-10" data-aos="fade-up">
        <span class="inline-block px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            Bienvenido a la Nueva Era
        </span>
        <h1 class="text-6xl md:text-9xl font-extrabold mb-8 tracking-tighter leading-tight">
            Alquila con <br> <span class="text-gradient">libertad total.</span>
        </h1>
        <p class="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Adiós a la burocracia, los depósitos infinitos y los intermediarios. <br class="hidden md:block">
            Hemos reinventado el acceso a la vivienda para que sea <strong>rápido, seguro e inspirador.</strong>
        </p>
        
        <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button class="group relative px-10 py-5 bg-white text-slate-950 rounded-2xl font-extrabold text-xl overflow-hidden transition-all hover:scale-105 active:scale-95">
                <span class="relative z-10">Empieza Ahora</span>
                <div class="absolute inset-0 bg-cyan-400 transform translate-y-full transition-transform group-hover:translate-y-0"></div>
            </button>
            <button class="px-10 py-5 glass rounded-2xl font-bold text-xl hover:bg-white/10 transition-all flex items-center gap-3">
                <i class="fas fa-play text-sm"></i> Ver Demo
            </button>
        </div>
    </div>
</main>

<script>
AOS.init({ duration: 1000, once: true, offset: 100 });

document.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
    document.querySelector('.glow-bg').style.transform = `translate(${moveX}px, ${moveY}px)`;
});
</script>

</body>
</html>
