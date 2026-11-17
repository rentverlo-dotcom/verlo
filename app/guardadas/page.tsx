// app/guardadas/page.tsx
'use client'
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowHeader from '@/components/FlowHeader'
import { supabase } from '@/lib/supabase/client'

type Match = {
  id: string;
  title: string;
  short_description: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function GuardadasPage() {
  const router = useRouter();
  const [savedMatches, setSavedMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          if (active) setError("Ingresá a tu cuenta para ver tus propiedades guardadas.");
          return;
        }
        const res = await fetch("/api/guardadas", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("No pudimos consultar tus propiedades guardadas.");
        const data = await res.json();
        if (active) setSavedMatches(Array.isArray(data) ? data : []);
      } catch {
        if (active) setError("No pudimos cargar tus propiedades guardadas.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <div style={container}>
      <FlowHeader title="Guardadas" />
      {loading && <p style={{ textAlign: 'center' }}>Cargando propiedades guardadas…</p>}
      {error && <p role="alert" style={{ textAlign: 'center' }}>{error}</p>}
      {!loading && !error && savedMatches.length === 0 && <p style={{ textAlign: 'center' }}>No tenés propiedades guardadas todavía.</p>}

      <div style={list}>
        {savedMatches.map((match) => (
          <div
            key={match.id}
            style={card}
            onClick={() => router.push(`/guardadas/${match.id}`)}
          >
            <div style={imageWrap}>
              <img
                src={match.cover_url}
                alt={match.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div style={overlay} />
            </div>

            <div style={info}>
              <h2>{match.title}</h2>
              <p style={desc}>{match.short_description}</p>
              <p style={address}>{match.address}</p>
              <strong>${match.price}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  color: "#fff",
  padding: "24px",
};

const title: React.CSSProperties = {
  fontSize: "22px",
  marginBottom: "24px",
  textAlign: "center",
};

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  maxWidth: "420px",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  borderRadius: "20px",
  overflow: "hidden",
  background: "#111",
  cursor: "pointer",
};

const imageWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "220px",
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
};

const info: React.CSSProperties = {
  padding: "16px",
};

const desc: React.CSSProperties = {
  fontSize: "14px",
  opacity: 0.9,
  marginBottom: "6px",
};

const address: React.CSSProperties = {
  fontSize: "13px",
  opacity: 0.7,
  marginBottom: "8px",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "12px",
};

const btn: React.CSSProperties = {
  flex: 1,
  border: "none",
  borderRadius: "12px",
  color: "#fff",
  padding: "10px",
  fontSize: "14px",
  cursor: "pointer",
};
