"use client"

import { useMemo, useState } from "react"

const logoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-13%20at%2017.10.14.jpeg"

export default function PaginaDePrueba() {
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    propietario: "María Laura Gómez",
    inquilino: "Tomás Fernández",
    dniPropietario: "24.882.193",
    dniInquilino: "38.551.204",
    direccion: "Av. Corrientes 2450, Piso 6, Depto B, CABA",
    precio: "650000",
    deposito: "650000",
    duracion: "24",
    inicio: "01/07/2026",
  })

  const contrato = useMemo(() => {
    return `CONTRATO DE LOCACIÓN

Entre ${form.propietario}, DNI ${form.dniPropietario}, en adelante LA PARTE LOCADORA, y ${form.inquilino}, DNI ${form.dniInquilino}, en adelante LA PARTE LOCATARIA, acuerdan celebrar el presente contrato de locación sobre el inmueble ubicado en ${form.direccion}.

El plazo de duración será de ${form.duracion} meses, comenzando el día ${form.inicio}.

El valor mensual del alquiler será de $${Number(form.precio || 0).toLocaleString("es-AR")} pesos argentinos.

La parte locataria entrega en concepto de depósito la suma de $${Number(form.deposito || 0).toLocaleString("es-AR")} pesos argentinos.

Ambas partes declaran haber validado su identidad digitalmente a través de Verlo y aceptan firmar el presente contrato mediante firma electrónica con trazabilidad, fecha, hora y evidencia de identidad.`
  }, [form])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <main className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f7f8f6;
          color: #090909;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header {
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          height: 48px;
          width: auto;
          object-fit: contain;
        }

        .badge {
          padding: 10px 14px;
          border-radius: 999px;
          background: #eafff1;
          color: #0b7a35;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid rgba(37, 211, 102, 0.25);
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 54px 22px 80px;
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 42px;
          align-items: start;
        }

        h1 {
          margin: 0;
          font-size: clamp(44px, 6vw, 82px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          max-width: 720px;
        }

        .green {
          color: #25d366;
        }

        .sub {
          margin-top: 24px;
          font-size: 20px;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.62);
          max-width: 620px;
        }

        .steps {
          margin-top: 34px;
          display: grid;
          gap: 12px;
          max-width: 560px;
        }

        .step {
          padding: 16px 18px;
          border-radius: 18px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          gap: 12px;
          align-items: center;
          font-weight: 800;
        }

        .dot {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: #25d366;
          color: white;
          display: grid;
          place-items: center;
          font-size: 13px;
          flex: 0 0 auto;
        }

        .panel {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 30px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .panelTop {
          padding: 22px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .panelTitle {
          font-weight: 950;
          font-size: 20px;
          letter-spacing: -0.03em;
        }

        .status {
          font-size: 12px;
          font-weight: 900;
          color: #0b7a35;
          background: #eafff1;
          padding: 8px 10px;
          border-radius: 999px;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .tab {
          border: 0;
          background: #fafafa;
          padding: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .tab.active {
          background: #25d366;
          color: white;
        }

        .content {
          padding: 24px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        label {
          display: grid;
          gap: 7px;
          font-size: 13px;
          font-weight: 850;
          color: rgba(0, 0, 0, 0.7);
        }

        input {
          height: 46px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          padding: 0 14px;
          font-size: 15px;
          outline: none;
        }

        input:focus {
          border-color: #25d366;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.14);
        }

        .contract {
          white-space: pre-wrap;
          background: #fbfbfb;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          padding: 20px;
          font-family: Georgia, serif;
          line-height: 1.55;
          color: rgba(0, 0, 0, 0.78);
          max-height: 430px;
          overflow: auto;
        }

        .identity {
          display: grid;
          gap: 14px;
        }

        .identityBox {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(37, 211, 102, 0.3);
          background: #f4fff7;
        }

        .identityBox strong {
          display: block;
          margin-bottom: 6px;
        }

        .signBox {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .signature {
          border-radius: 18px;
          border: 1px dashed rgba(0, 0, 0, 0.25);
          padding: 18px;
          min-height: 112px;
          display: grid;
          align-content: end;
          background: #fff;
        }

        .signature strong {
          font-family: Georgia, serif;
          font-size: 24px;
          font-style: italic;
        }

        .button {
          margin-top: 20px;
          width: 100%;
          height: 54px;
          border: 0;
          border-radius: 999px;
          background: #25d366;
          color: #07140b;
          font-weight: 950;
          font-size: 16px;
          cursor: pointer;
        }

        @media (max-width: 920px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .grid,
          .signBox {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="header">
        <img src={logoUrl} alt="Verlo" className="logo" />
        <div className="badge">Testigo digital de contratos</div>
      </header>

      <section className="hero">
        <div>
          <h1>
            Firmá tu contrato con <span className="green">identidad validada.</span>
          </h1>

          <p className="sub">
            Verlo permite crear, renderizar y firmar contratos de alquiler con validación de identidad, trazabilidad y evidencia digital para ambas partes.
          </p>

          <div className="steps">
            <div className="step">
              <span className="dot">1</span>
              Completan los datos del acuerdo.
            </div>
            <div className="step">
              <span className="dot">2</span>
              Verlo genera el contrato.
            </div>
            <div className="step">
              <span className="dot">3</span>
              Ambas partes validan identidad.
            </div>
            <div className="step">
              <span className="dot">4</span>
              Firman con constancia digital.
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelTop">
            <div className="panelTitle">Contrato de alquiler</div>
            <div className="status">Identidad pendiente</div>
          </div>

          <div className="tabs">
            <button className={`tab ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>
              Datos
            </button>
            <button className={`tab ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>
              Contrato
            </button>
            <button className={`tab ${step === 3 ? "active" : ""}`} onClick={() => setStep(3)}>
              Firma
            </button>
          </div>

          <div className="content">
            {step === 1 && (
              <>
                <div className="grid">
                  <label>
                    Propietario
                    <input value={form.propietario} onChange={(e) => updateField("propietario", e.target.value)} />
                  </label>

                  <label>
                    DNI propietario
                    <input value={form.dniPropietario} onChange={(e) => updateField("dniPropietario", e.target.value)} />
                  </label>

                  <label>
                    Inquilino
                    <input value={form.inquilino} onChange={(e) => updateField("inquilino", e.target.value)} />
                  </label>

                  <label>
                    DNI inquilino
                    <input value={form.dniInquilino} onChange={(e) => updateField("dniInquilino", e.target.value)} />
                  </label>

                  <label>
                    Dirección del inmueble
                    <input value={form.direccion} onChange={(e) => updateField("direccion", e.target.value)} />
                  </label>

                  <label>
                    Inicio
                    <input value={form.inicio} onChange={(e) => updateField("inicio", e.target.value)} />
                  </label>

                  <label>
                    Alquiler mensual
                    <input value={form.precio} onChange={(e) => updateField("precio", e.target.value)} />
                  </label>

                  <label>
                    Depósito
                    <input value={form.deposito} onChange={(e) => updateField("deposito", e.target.value)} />
                  </label>
                </div>

                <button className="button" onClick={() => setStep(2)}>
                  Generar contrato
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="contract">{contrato}</div>
                <button className="button" onClick={() => setStep(3)}>
                  Validar identidad y firmar
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="identity">
                  <div className="identityBox">
                    <strong>Validación de identidad</strong>
                    DNI + selfie + email + teléfono. La firma queda asociada a evidencia digital.
                  </div>

                  <div className="identityBox">
                    <strong>Constancia Verlo</strong>
                    Fecha, hora, IP, identidad declarada, documento firmado y hash del contrato.
                  </div>
                </div>

                <div className="signBox">
                  <div className="signature">
                    <span>Firma propietario</span>
                    <strong>{form.propietario}</strong>
                  </div>

                  <div className="signature">
                    <span>Firma inquilino</span>
                    <strong>{form.inquilino}</strong>
                  </div>
                </div>

                <button className="button">Firmar contrato con Verlo</button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
