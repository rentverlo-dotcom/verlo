'use client';

import { useState } from 'react';
import {
  ChevronRight, ArrowLeft, CheckCircle,
  Building2, User,
  Check, FileText,
  UserCircle, ShieldCheck,
  FileSignature, Camera, Shield
} from 'lucide-react';

/* =======================
   DATA
======================= */

const ARGENTINA_DATA = {
  CABA: {
    localidades: ['CABA'],
    barrios: { CABA: ['Palermo', 'Recoleta', 'Belgrano'] },
  },
  'Buenos Aires': {
    localidades: ['Zona Norte', 'Zona Sur'],
    barrios: {
      'Zona Norte': ['Olivos', 'San Isidro'],
      'Zona Sur': ['Quilmes', 'Lanús'],
    },
  },
};

const PROVINCIAS = Object.keys(ARGENTINA_DATA);
const PROPERTY_TYPES = ['Departamento', 'Casa', 'PH'];
const AMBIENTES_OPTIONS = ['1 Ambiente', '2 Ambientes', '3 Ambientes'];
const ORIENTACIONES = ['Norte', 'Sur', 'Este', 'Oeste'];

const HIGH_VALUE_FILTERS = [
  'Balcón Terraza',
  'Cochera',
  'Seguridad 24hs',
  'Mascotas Permitidas',
];

/* =======================
   PAGE
======================= */

export default function Page() {
  const [view, setView] = useState<'landing' | 'form' | 'biometric' | 'success'>('landing');
  const [userType, setUserType] = useState<'owner' | 'tenant' | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    celular: '',
    provincia: '',
    localidad: '',
    barrio: '',
    tipoPropiedad: '',
    ambientes: '',
    orientacion: '',
    precioMin: '',
    precioMax: '',
    tipoGarantia: '',
    filtros: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleFilter = (f: string) => {
    setForm((p) => ({
      ...p,
      filtros: p.filtros.includes(f)
        ? p.filtros.filter((x) => x !== f)
        : [...p.filtros, f],
    }));
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 px-6 py-32">

      {/* LANDING */}
      {view === 'landing' && (
        <section className="max-w-6xl mx-auto text-center space-y-14">
          <h1 className="text-6xl md:text-8xl font-black text-white">
            GESTIÓN{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              INTELIGENTE
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-500">
            Conecta, valida y firma contratos inmobiliarios en una sola plataforma.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <ActionCard
              title="Soy Propietario"
              icon={<Building2 />}
              onClick={() => {
                setUserType('owner');
                setView('form');
              }}
            />
            <ActionCard
              title="Soy Inquilino"
              icon={<User />}
              onClick={() => {
                setUserType('tenant');
                setView('form');
              }}
            />
            <ActionCard
              title="Contrato Digital"
              icon={<FileSignature />}
              onClick={() => setView('form')}
            />
          </div>
        </section>
      )}

      {/* FORM */}
      {view === 'form' && (
        <section className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-12 space-y-12">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-xs uppercase text-slate-400 hover:text-white"
          >
            <ArrowLeft size={14} /> Volver
          </button>

          <h2 className="text-4xl font-black text-white">
            Registro {userType === 'owner' ? 'Propietario' : 'Inquilino'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
            <Input label="Email" name="email" value={form.email} onChange={handleChange} />
            <Input label="Celular" name="celular" value={form.celular} onChange={handleChange} />

            <Select label="Provincia" name="provincia" value={form.provincia} onChange={handleChange}>
              <option value="">Seleccionar</option>
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>

            <Select label="Tipo Propiedad" name="tipoPropiedad" value={form.tipoPropiedad} onChange={handleChange}>
              <option value="">Seleccionar</option>
              {PROPERTY_TYPES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HIGH_VALUE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`p-3 rounded-xl text-xs border ${
                  form.filtros.includes(f)
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setView('biometric')}
            className="w-full py-5 bg-white text-black font-black rounded-xl"
          >
            Confirmar y Validar
          </button>
        </section>
      )}

      {/* BIOMETRIC */}
      {view === 'biometric' && (
        <section className="max-w-xl mx-auto text-center space-y-10">
          <h2 className="text-3xl font-black text-white">Validación Biométrica</h2>

          <div className="w-56 h-56 mx-auto rounded-full border border-cyan-500 flex items-center justify-center">
            {biometricStatus === 'idle' && <UserCircle size={80} />}
            {biometricStatus === 'scanning' && <Camera size={80} />}
            {biometricStatus === 'success' && <Check size={80} className="text-emerald-400" />}
          </div>

          <button
            onClick={() => {
              setBiometricStatus('scanning');
              setTimeout(() => setBiometricStatus('success'), 2000);
              setTimeout(() => setView('success'), 3000);
            }}
            className="w-full py-5 bg-white text-black rounded-xl font-black"
          >
            Iniciar Captura
          </button>
        </section>
      )}

      {/* SUCCESS */}
      {view === 'success' && (
        <section className="text-center space-y-6">
          <CheckCircle size={80} className="mx-auto text-emerald-400" />
          <h2 className="text-4xl font-black text-white">Registro Completado</h2>
          <button
            onClick={() => setView('landing')}
            className="px-10 py-4 bg-white/10 border border-white/20 rounded-full"
          >
            Volver al inicio
          </button>
        </section>
      )}
    </main>
  );
}

/* =======================
   COMPONENTS
======================= */

function ActionCard({ title, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500 transition text-left"
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-black text-white">{title}</h3>
    </button>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      <input
        {...props}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
      />
    </div>
  );
}

function Select({ label, children, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      <select
        {...props}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
      >
        {children}
      </select>
    </div>
  );
}
