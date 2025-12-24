'use client';

import { useState } from 'react';

type Role = 'inquilino' | 'propietario' | null;

export default function Page() {
  const [role, setRole] = useState<Role>(null);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>VERLO</h1>
        <p style={styles.subtitle}>Plataforma de matching inmobiliario</p>
      </header>

      {!role && (
        <section style={styles.selector}>
          <button style={styles.primary} onClick={() => setRole('inquilino')}>
            Soy Inquilino
          </button>
          <button style={styles.secondary} onClick={() => setRole('propietario')}>
            Soy Propietario
          </button>
        </section>
      )}

      {role && (
        <section style={styles.form}>
          <h2 style={styles.formTitle}>
            Registro {role === 'inquilino' ? 'Inquilino' : 'Propietario'}
          </h2>

          <input style={styles.input} placeholder="Nombre completo" />
          <input style={styles.input} placeholder="Email" />
          <input style={styles.input} placeholder="Teléfono" />

          {role === 'inquilino' && (
            <>
              <input style={styles.input} placeholder="Zona deseada" />
              <input style={styles.input} placeholder="Presupuesto máximo" />
            </>
          )}

          {role === 'propietario' && (
            <>
              <input style={styles.input} placeholder="Dirección del inmueble" />
              <input style={styles.input} placeholder="Precio de alquiler" />
            </>
          )}

          <button style={styles.primary}>
            Enviar y entrar en matching
          </button>

          <button style={styles.link} onClick={() => setRole(null)}>
            ← volver
          </button>
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0b0b0f',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    margin: 0,
    letterSpacing: 2,
  },
  subtitle: {
    opacity: 0.7,
  },
  selector: {
    display: 'flex',
    gap: 20,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    background: '#15151c',
    padding: 30,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  formTitle: {
    marginBottom: 10,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: 'none',
    outline: 'none',
  },
  primary: {
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    border: 'none',
    background: '#ffffff',
    color: '#000',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondary: {
    padding: 14,
    borderRadius: 8,
    border: '1px solid #fff',
    background: 'transparent',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  link: {
    marginTop: 10,
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
  },
};

