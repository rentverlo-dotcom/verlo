import type { CSSProperties } from "react"
import VerloBrand from "@/components/VerloBrand"

export const dynamic = "force-dynamic"

const lastUpdated = "30 de julio de 2026"

export default function TerminosPage() {
  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <a href="/" style={brandLink} aria-label="Volver a Verlo">
            <VerloBrand width={126} />
          </a>

          <nav style={topLinks} aria-label="Navegación legal">
            <a href="/privacidad" style={topLink}>
              Privacidad
            </a>
            <a href="/" style={topCta}>
              Volver a Verlo
            </a>
          </nav>
        </header>

        <section style={hero}>
          <p style={eyebrow}>Legales de Verlo</p>
          <h1 style={title}>Términos y Condiciones</h1>
          <p style={intro}>
            Estos términos regulan el acceso y uso de Verlo, una plataforma digital orientada a
            facilitar conexiones directas, ordenadas y seguras entre personas que buscan alquilar,
            ofrecer una propiedad o renovar un contrato.
          </p>
          <p style={updated}>Última actualización: {lastUpdated}</p>
        </section>

        <section style={notice}>
          <strong>Importante:</strong> Verlo no es una inmobiliaria, no actúa como corredor
          inmobiliario, no representa legalmente a ninguna parte y no garantiza la concreción de
          operaciones. La plataforma brinda herramientas digitales para ordenar información,
          facilitar contacto, registrar interés, validar identidad y acompañar procesos operativos.
        </section>

        <div style={layout}>
          <aside style={aside}>
            <p style={asideTitle}>Contenido</p>
            <a style={asideLink} href="#aceptacion">1. Aceptación</a>
            <a style={asideLink} href="#servicio">2. Servicio</a>
            <a style={asideLink} href="#usuarios">3. Usuarios</a>
            <a style={asideLink} href="#cuenta">4. Cuenta</a>
            <a style={asideLink} href="#leads">5. Formularios</a>
            <a style={asideLink} href="#contacto">6. Contacto</a>
            <a style={asideLink} href="#verificacion">7. Verificación</a>
            <a style={asideLink} href="#contratos">8. Contratos</a>
            <a style={asideLink} href="#pagos">9. Pagos</a>
            <a style={asideLink} href="#responsabilidad">10. Responsabilidad</a>
            <a style={asideLink} href="#uso">11. Uso indebido</a>
            <a style={asideLink} href="#propiedad">12. Propiedad intelectual</a>
            <a style={asideLink} href="#baja">13. Suspensión</a>
            <a style={asideLink} href="#cambios">14. Cambios</a>
            <a style={asideLink} href="#jurisdiccion">15. Ley aplicable</a>
            <a style={asideLink} href="#contacto-legal">16. Contacto legal</a>
          </aside>

          <article style={content}>
            <section id="aceptacion" style={section}>
              <h2 style={h2}>1. Aceptación de los términos</h2>
              <p style={p}>
                Al acceder, navegar, registrarte, completar formularios, solicitar contacto,
                confirmar tu cuenta mediante enlace mágico o utilizar cualquier funcionalidad de
                Verlo, aceptás estos Términos y Condiciones y la Política de Privacidad.
              </p>
              <p style={p}>
                Si no estás de acuerdo con estos términos, no deberías utilizar la plataforma ni
                enviar información a través de sus formularios.
              </p>
            </section>

            <section id="servicio" style={section}>
              <h2 style={h2}>2. Descripción del servicio</h2>
              <p style={p}>
                Verlo es una plataforma digital que permite registrar interés relacionado con
                alquileres, conectar personas con necesidades compatibles, ordenar información de
                propiedades, búsquedas o renovaciones, y facilitar próximos pasos mediante canales
                digitales.
              </p>
              <p style={p}>
                Entre sus funcionalidades actuales o futuras pueden incluirse formularios de
                captación, cuentas de usuario, validación de identidad, contacto entre partes,
                gestión de estados, documentación digital, firma de contratos, notificaciones,
                integraciones con CRM y herramientas de medición publicitaria.
              </p>
              <p style={p}>
                Verlo puede modificar, ampliar, limitar, suspender o discontinuar funciones de la
                plataforma en cualquier momento, especialmente durante etapas de prueba, validación
                privada, lanzamiento o mejora del producto.
              </p>
            </section>

            <section id="usuarios" style={section}>
              <h2 style={h2}>3. Usuarios alcanzados</h2>
              <p style={p}>
                La plataforma puede ser utilizada por propietarios, inquilinos, personas que buscan
                alquilar, personas que desean renovar un contrato, representantes autorizados,
                interesados comerciales y usuarios invitados a pruebas privadas.
              </p>
              <p style={p}>
                Cada usuario declara que la información que proporciona es verdadera, actual,
                completa y que cuenta con autorización suficiente para enviarla. Si una persona actúa
                en representación de otra, declara tener facultades para hacerlo.
              </p>
            </section>

            <section id="cuenta" style={section}>
              <h2 style={h2}>4. Cuenta de usuario y acceso</h2>
              <p style={p}>
                Verlo puede permitir el acceso mediante enlaces mágicos enviados por correo
                electrónico u otros mecanismos de autenticación. El usuario es responsable de
                utilizar una dirección de email propia, segura y vigente.
              </p>
              <p style={p}>
                El acceso mediante enlace mágico es personal. No debe reenviarse a terceros ni
                utilizarse para permitir accesos no autorizados. Verlo puede cancelar o limitar el
                acceso si detecta uso indebido, fraude, suplantación de identidad o incumplimiento de
                estos términos.
              </p>
            </section>

            <section id="leads" style={section}>
              <h2 style={h2}>5. Formularios, leads y datos enviados</h2>
              <p style={p}>
                Al completar formularios de Verlo, el usuario autoriza a la plataforma a registrar y
                procesar la información enviada para evaluar su caso, contactarlo, clasificar su
                solicitud, gestionar oportunidades compatibles y mejorar el servicio.
              </p>
              <p style={p}>
                La carga de un formulario no garantiza que Verlo encuentre interesados, propiedades,
                coincidencias, renovaciones, acuerdos, visitas, contratos ni resultados económicos.
                El formulario representa una manifestación de interés, no una contratación cerrada.
              </p>
              <p style={p}>
                Verlo puede clasificar los formularios según tipo de usuario, intención, zona,
                disponibilidad, presupuesto, estado de renovación u otros criterios operativos para
                mejorar el seguimiento comercial y funcional.
              </p>
            </section>

            <section id="contacto" style={section}>
              <h2 style={h2}>6. Contacto entre partes</h2>
              <p style={p}>
                Verlo puede facilitar el contacto entre partes cuando considere que existe
                compatibilidad suficiente entre una búsqueda, una propiedad, una renovación o una
                oportunidad. La decisión final de avanzar, responder, coordinar, contratar o desistir
                corresponde exclusivamente a las partes.
              </p>
              <p style={p}>
                Verlo no garantiza disponibilidad de inmuebles, solvencia de usuarios, conducta de
                terceros, exactitud absoluta de publicaciones externas, cumplimiento de pagos,
                entrega de inmuebles ni firma definitiva de contratos.
              </p>
            </section>

            <section id="verificacion" style={section}>
              <h2 style={h2}>7. Verificación de identidad y seguridad</h2>
              <p style={p}>
                Para habilitar determinadas funcionalidades, Verlo puede requerir validación de
                identidad, confirmación de email, verificación de teléfono, revisión de documentación
                o controles antifraude.
              </p>
              <p style={p}>
                La verificación puede realizarse directamente por Verlo o a través de proveedores
                externos especializados. La aprobación de una verificación no implica garantía total
                sobre la conducta futura del usuario ni reemplaza controles legales, patrimoniales o
                profesionales que las partes decidan realizar.
              </p>
              <p style={p}>
                Verlo puede rechazar, pausar o revisar manualmente cuentas, solicitudes o contactos
                cuando detecte inconsistencias, señales de riesgo, reportes de terceros, actividad
                anómala o incumplimientos.
              </p>
            </section>

            <section id="contratos" style={section}>
              <h2 style={h2}>8. Contratos, renovaciones y documentación</h2>
              <p style={p}>
                Verlo puede ofrecer herramientas para ordenar datos, generar borradores, asistir en
                la preparación de contratos, facilitar firma digital o registrar etapas de una
                renovación. Estas herramientas no reemplazan asesoramiento legal, contable,
                inmobiliario, notarial ni profesional.
              </p>
              <p style={p}>
                Cada parte es responsable de revisar el contenido de cualquier contrato,
                documentación, precio, plazo, ajuste, garantía, condición de ingreso, inventario,
                depósito, expensas, servicios, impuestos y obligaciones asumidas.
              </p>
              <p style={p}>
                La firma o aceptación de documentos a través de medios digitales queda sujeta a la
                normativa aplicable, al mecanismo utilizado y a la voluntad de las partes.
              </p>
            </section>

            <section id="pagos" style={section}>
              <h2 style={h2}>9. Pagos, señas, reservas y comisiones</h2>
              <p style={p}>
                Salvo que se indique expresamente lo contrario en una funcionalidad específica, Verlo
                no recibe alquileres, reservas, depósitos, señas ni pagos entre partes. Cualquier pago
                realizado fuera de la plataforma es responsabilidad exclusiva de quienes participan
                de la operación.
              </p>
              <p style={p}>
                Verlo podrá incorporar en el futuro funcionalidades pagas, planes, cargos por
                servicios digitales, validaciones, publicaciones, gestión documental o herramientas
                premium. En ese caso, informará condiciones comerciales específicas antes de la
                contratación.
              </p>
              <p style={p}>
                La expresión “sin comisión” refiere a la propuesta de facilitar contacto directo y
                reducir fricciones tradicionales. No implica gratuidad absoluta de todos los servicios
                presentes o futuros de Verlo.
              </p>
            </section>

            <section id="responsabilidad" style={section}>
              <h2 style={h2}>10. Limitación de responsabilidad</h2>
              <p style={p}>
                Verlo realiza esfuerzos razonables para brindar una experiencia segura, clara y
                funcional, pero no garantiza disponibilidad permanente, ausencia de errores,
                resultados determinados, compatibilidad entre usuarios ni concreción de operaciones.
              </p>
              <p style={p}>
                Verlo no será responsable por daños, pérdidas, reclamos o conflictos derivados de
                información falsa, incompleta o engañosa cargada por usuarios; incumplimientos entre
                partes; decisiones económicas; pagos externos; defectos del inmueble; cambios de
                voluntad; ni hechos de terceros ajenos al control de la plataforma.
              </p>
              <p style={p}>
                Ningún contenido de Verlo debe interpretarse como asesoramiento legal, financiero,
                inmobiliario, fiscal, notarial o profesional personalizado.
              </p>
            </section>

            <section id="uso" style={section}>
              <h2 style={h2}>11. Uso indebido de la plataforma</h2>
              <p style={p}>
                Está prohibido utilizar Verlo para publicar o enviar información falsa, suplantar
                identidades, captar datos sin autorización, hostigar usuarios, realizar maniobras
                fraudulentas, vulnerar derechos de terceros, introducir malware, interferir con el
                funcionamiento del servicio o incumplir la ley.
              </p>
              <p style={p}>
                También está prohibido intentar evadir controles de identidad, manipular eventos de
                medición, abusar de formularios, enviar spam, automatizar acciones sin autorización o
                utilizar datos obtenidos en Verlo para fines incompatibles con la finalidad de la
                plataforma.
              </p>
            </section>

            <section id="propiedad" style={section}>
              <h2 style={h2}>12. Propiedad intelectual</h2>
              <p style={p}>
                La marca Verlo, su identidad visual, textos, interfaces, diseños, componentes,
                flujos, software, bases de datos, estructura, contenidos y materiales pertenecen a
                Verlo o a sus respectivos titulares.
              </p>
              <p style={p}>
                El uso de la plataforma no otorga al usuario licencia, cesión ni derecho de propiedad
                sobre dichos activos, salvo autorización expresa y por escrito.
              </p>
            </section>

            <section id="baja" style={section}>
              <h2 style={h2}>13. Suspensión, baja o restricción de acceso</h2>
              <p style={p}>
                Verlo puede suspender, limitar o cancelar cuentas, leads, formularios, contactos,
                funcionalidades o accesos cuando detecte incumplimientos, riesgos de fraude, uso
                abusivo, datos inconsistentes, requerimientos legales o motivos operativos.
              </p>
              <p style={p}>
                El usuario puede solicitar la baja o eliminación de sus datos conforme a la Política
                de Privacidad y la normativa aplicable.
              </p>
            </section>

            <section id="cambios" style={section}>
              <h2 style={h2}>14. Cambios en estos términos</h2>
              <p style={p}>
                Verlo puede actualizar estos Términos y Condiciones para reflejar cambios legales,
                técnicos, comerciales, operativos o de producto. La versión vigente será la publicada
                en esta página.
              </p>
              <p style={p}>
                El uso continuado de la plataforma después de una actualización implica aceptación de
                la nueva versión.
              </p>
            </section>

            <section id="jurisdiccion" style={section}>
              <h2 style={h2}>15. Ley aplicable y jurisdicción</h2>
              <p style={p}>
                Estos términos se rigen por las leyes de la República Argentina. Ante cualquier
                controversia, las partes procurarán resolverla de buena fe. Si ello no fuera posible,
                resultarán competentes los tribunales ordinarios que correspondan según la normativa
                aplicable.
              </p>
            </section>

            <section id="contacto-legal" style={section}>
              <h2 style={h2}>16. Contacto legal</h2>
              <p style={p}>
                Para consultas sobre estos términos, uso de la plataforma, privacidad o ejercicio de
                derechos, podés escribir a:
              </p>
              <div style={contactCard}>
                <strong>Verlo</strong>
                <span>Contacto: rentverlo@gmail.com</span>
                <span>Sitio web: verlo.lat</span>
                <span>País: Argentina</span>
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>
  )
}

const page: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 88% 20%, rgba(242,168,169,0.28), transparent 28%), radial-gradient(circle at 8% 16%, rgba(116,190,220,0.18), transparent 24%), #f2ebec",
  color: "#050002",
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const shell: CSSProperties = {
  width: "min(1120px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "28px 0 64px",
}

const header: CSSProperties = {
  minHeight: 78,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
}

const brandLink: CSSProperties = {
  color: "inherit",
  textDecoration: "none",
}

const topLinks: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
}

const topLink: CSSProperties = {
  color: "rgba(5,0,2,0.68)",
  textDecoration: "none",
  fontWeight: 850,
  fontSize: 14,
}

const topCta: CSSProperties = {
  color: "#fff",
  background: "#050002",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
  padding: "11px 18px",
  borderRadius: 999,
}

const hero: CSSProperties = {
  padding: "56px 0 34px",
}

const eyebrow: CSSProperties = {
  margin: "0 0 14px",
  color: "#c37986",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: 12,
  fontWeight: 950,
}

const title: CSSProperties = {
  margin: 0,
  maxWidth: 860,
  fontSize: "clamp(48px, 7vw, 92px)",
  lineHeight: 0.94,
  letterSpacing: "-0.075em",
  fontWeight: 950,
}

const intro: CSSProperties = {
  margin: "24px 0 0",
  maxWidth: 820,
  fontSize: 20,
  lineHeight: 1.55,
  color: "rgba(5,0,2,0.68)",
}

const updated: CSSProperties = {
  margin: "18px 0 0",
  color: "rgba(5,0,2,0.52)",
  fontSize: 14,
  fontWeight: 800,
}

const notice: CSSProperties = {
  padding: 22,
  borderRadius: 26,
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(5,0,2,0.08)",
  boxShadow: "0 18px 50px rgba(5,0,2,0.06)",
  color: "rgba(5,0,2,0.72)",
  lineHeight: 1.55,
  fontSize: 15,
}

const layout: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: 28,
  marginTop: 28,
  alignItems: "start",
}

const aside: CSSProperties = {
  position: "sticky",
  top: 24,
  padding: 22,
  borderRadius: 28,
  background: "rgba(255,255,255,0.58)",
  border: "1px solid rgba(5,0,2,0.08)",
  display: "grid",
  gap: 10,
}

const asideTitle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 13,
  fontWeight: 950,
  color: "rgba(5,0,2,0.48)",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
}

const asideLink: CSSProperties = {
  color: "rgba(5,0,2,0.68)",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  lineHeight: 1.3,
}

const content: CSSProperties = {
  borderRadius: 36,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(5,0,2,0.08)",
  boxShadow: "0 28px 80px rgba(5,0,2,0.08)",
  padding: "38px",
}

const section: CSSProperties = {
  padding: "0 0 30px",
  marginBottom: 30,
  borderBottom: "1px solid rgba(5,0,2,0.08)",
}

const h2: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 28,
  lineHeight: 1.05,
  letterSpacing: "-0.045em",
  fontWeight: 950,
}

const p: CSSProperties = {
  margin: "12px 0 0",
  color: "rgba(5,0,2,0.68)",
  fontSize: 16,
  lineHeight: 1.75,
}

const contactCard: CSSProperties = {
  marginTop: 18,
  padding: 20,
  borderRadius: 22,
  background: "rgba(242,168,169,0.18)",
  border: "1px solid rgba(195,121,134,0.18)",
  display: "grid",
  gap: 8,
  color: "rgba(5,0,2,0.72)",
  fontSize: 15,
}
