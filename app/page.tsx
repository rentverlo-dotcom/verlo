'use client';

import { useState } from 'react';

type UserType = 'tenant' | 'owner' | null;

export default function Page() {
  const [userType, setUserType] = useState<UserType>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main style={styles.main}>
        <h1>Formulario enviado</h1>
        <p>Cuando exista un match, el sistema notificará a ambas partes.</p>
        <button onClick={() => {
          setUserType(null);
          setSubmitted(false);
        }}>
          Volver al inicio
        </button>
      </main>
    );
  }

  if (!userType) {
    return (
      <main style={styles.main}>
        <h1>VERLO</h1>
        <p>Plataforma de matching inmobiliario</p>

        <div style={styles.row}>
          <button onClick={() => setUserType('tenant')}>
            Soy Inquilino
          </button>
          <button onClick={() => setUserType('owner')}>
            Soy Propietario
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1>{userType === 'tenant' ? 'Inquilino' : 'Propietario'}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        style={styles.form}
      >
        <input placeholder="Nombre completo" required />
        <input placeholder="Email" type="email" required />
        <input placeholder="Teléfono" required />

        {userType === 'tenant' && (
          <>
            <input placeholder="Zona buscada" required />
            <input placeholder="Presupuesto máximo" required />
          </>
        )}

        {userType === 'owner' && (
          <>
            <input placeholder="Dirección de la propiedad" required />
            <input placeholder="Precio esperado" required />
          </>
        )}

        <button type="submit">Enviar</button>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    padding: '40px',
    fontFamily: 'system-ui',
  },
  row: {
    display: 'flex',
    gap: '20px',
    marginTop: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
    marginTop: '30px',
  },
};

