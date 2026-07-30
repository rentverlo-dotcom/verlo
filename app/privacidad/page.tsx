import type { CSSProperties } from "react"
import VerloBrand from "@/components/VerloBrand"

export const dynamic = "force-dynamic"

const lastUpdated = "30 de julio de 2026"

export default function PrivacidadPage() {
  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <a href="/" style={brandLink} aria-label="Volver a Verlo">
            <VerloBrand width={126} />
          </a>

          <nav style={topLinks} aria-label="Navegación legal">
            <a href="/terminos" style={topLink}>
              Términos
            </a>
            <a href="/" style={topCta}>
              Volver a Verlo
            </a>
          </nav>
        </header>

        <section style={hero}>
          <p style={eyebrow}>Privacidad y datos personales</p>
          <h1 style={title}>Política de Privacidad</h1>
          <p style={intro}>
            Esta política explica qué datos trata Verlo, para qué los utiliza, cómo los protege,
            con quién puede compartirlos y qué derechos tienen las personas usuarias sobre su
            información.
          </p>
          <p style={updated}>Última actualización: {lastUpdated}</p>
        </section>

        <section style={notice}>
          <strong>Resumen claro:</strong> usamos tus datos para registrar tu solicitud, contactarte,
          crear o confirmar tu cuenta, medir campañas, prevenir fraude, ordenar oportunidades y
          habilitar funciones de Verlo. No vendemos tus datos personales.
        </section>

        <div style={layout}>
          <aside style={aside}>
            <p style={asideTitle}>Contenido</p>
            <a style={asideLink} href="#responsable">1. Responsable</a>
            <a style={asideLink} href="#alcance">2. Alcance</a>
            <a style={asideLink} href="#datos">3. Datos tratados</a>
            <a style={asideLink} href="#fuentes">4. Fuentes</a>
            <a style={asideLink} href="#finalidades">5. Finalidades</a>
            <a style={asideLink} href="#base">6. Base legal</a>
            <a style={asideLink} href="#auth">7. Cuenta y magic link</a>
            <a style={asideLink} href="#crm">8. CRM y contacto</a>
            <a style={asideLink} href="#medicion">9. Medición</a>
            <a style={asideLink} href="#verificacion">10. Identidad</a>
            <a style={asideLink} href="#proveedores">11. Proveedores</a>
            <a style={asideLink} href="#conservacion">12. Conservación</a>
            <a style={asideLink} href="#seguridad">13. Seguridad</a>
            <a style={asideLink} href="#derechos">14. Derechos</a>
            <a style={asideLink} href="#menores">15. Menores</a>
            <a style={asideLink} href="#cookies">16. Cookies</a>
            <a style={asideLink} href="#cambios">17. Cambios</a>
            <a style={asideLink} href="#contacto">18. Contacto</a>
          </aside>

          <article style={content}>
            <section id="responsable" style={section}>
              <h2 style={h2}>1. Responsable del tratamiento</h2>
              <p style={p}>
                El responsable del tratamiento de los datos personales recolectados a través de Verlo
                es Verlo, proyecto digital orientado a facilitar procesos vinculados con alquileres,
                búsquedas de propiedades y renovaciones contractuales.
              </p>
              <div style={contactCard}>
                <strong>Verlo</strong>
                <span>Contacto: rentverlo@gmail.com</span>
                <span>Sitio web: verlo.lat</span>
                <span>País: Argentina</span>
              </div>
            </section>

            <section id="alcance" style={section}>
              <h2 style={h2}>2. Alcance de esta política</h2>
              <p style={p}>
                Esta Política de Privacidad aplica al uso del sitio web, formularios, cuentas,
                enlaces mágicos, comunicaciones, integraciones, herramientas de medición,
                funcionalidades de contacto y cualquier otro servicio digital provisto por Verlo.
              </p>
              <p style={p}>
                También aplica a datos ingresados durante pruebas privadas, campañas publicitarias,
                formularios de interés, procesos de renovación, búsquedas de alquiler y carga de
                información vinculada con propiedades.
              </p>
            </section>

            <section id="datos" style={section}>
              <h2 style={h2}>3. Qué datos podemos tratar</h2>
              <p style={p}>Según la funcionalidad utilizada, Verlo puede tratar los siguientes datos:</p>

              <div style={grid}>
                <div style={miniCard}>
                  <h3 style={h3}>Datos de identificación</h3>
                  <p style={miniP}>
                    Nombre, apellido, email, teléfono, rol declarado, datos de cuenta y estado de
                    confirmación.
                  </p>
                </div>

                <div style={miniCard}>
                  <h3 style={h3}>Datos de alquiler</h3>
                  <p style={miniP}>
                    Zona, tipo de propiedad, disponibilidad, presupuesto, precio aproximado, fechas,
                    intención de búsqueda o renovación.
                  </p>
                </div>

                <div style={miniCard}>
                  <h3 style={h3}>Datos operativos</h3>
                  <p style={miniP}>
                    Estado del lead, tags, origen de campaña, metadatos del formulario, eventos y
                    trazabilidad básica.
                  </p>
                </div>

                <div style={miniCard}>
                  <h3 style={h3}>Datos técnicos</h3>
                  <p style={miniP}>
                    IP, navegador, dispositivo, URL de origen, cookies, identificadores publicitarios
                    y eventos de medición.
                  </p>
                </div>

                <div style={miniCard}>
                  <h3 style={h3}>Datos de verificación</h3>
                  <p style={miniP}>
                    Cuando corresponda: validación de identidad, resultado de controles,
                    confirmaciones y metadatos antifraude.
                  </p>
                </div>

                <div style={miniCard}>
                  <h3 style={h3}>Comunicaciones</h3>
                  <p style={miniP}>
                    Mensajes, respuestas, historial de contacto, preferencias y solicitudes realizadas
                    por canales habilitados.
                  </p>
                </div>
              </div>
            </section>

            <section id="fuentes" style={section}>
              <h2 style={h2}>4. De dónde obtenemos los datos</h2>
              <p style={p}>
                Los datos pueden ser proporcionados directamente por el usuario al completar
                formularios, confirmar una cuenta, responder mensajes, enviar consultas o utilizar
                funcionalidades de Verlo.
              </p>
              <p style={p}>
                También podemos recibir datos técnicos generados automáticamente por el uso del sitio
                o datos derivados de integraciones con proveedores tecnológicos, herramientas de CRM,
                autenticación, analítica, publicidad, seguridad o verificación.
              </p>
            </section>

            <section id="finalidades" style={section}>
              <h2 style={h2}>5. Para qué usamos los datos</h2>
              <p style={p}>Verlo puede utilizar datos personales para las siguientes finalidades:</p>

              <ul style={list}>
                <li>Registrar solicitudes de propietarios, inquilinos o personas interesadas.</li>
                <li>Clasificar leads por tipo de necesidad, zona, intención y estado.</li>
                <li>Contactar al usuario por email, WhatsApp u otros canales informados.</li>
                <li>Enviar enlaces mágicos para confirmar cuenta o acceso.</li>
                <li>Facilitar coincidencias entre búsquedas, propiedades o renovaciones.</li>
                <li>Gestionar oportunidades, seguimiento comercial y atención al usuario.</li>
                <li>Prevenir fraude, abuso, spam, suplantación de identidad o usos indebidos.</li>
                <li>Habilitar funciones de identidad, contrato digital, firma o documentación.</li>
                <li>Medir campañas publicitarias, conversiones y rendimiento del sitio.</li>
                <li>Mejorar producto, diseño, experiencia, seguridad y funcionamiento técnico.</li>
                <li>Cumplir obligaciones legales, regulatorias o requerimientos de autoridad competente.</li>
              </ul>
            </section>

            <section id="base" style={section}>
              <h2 style={h2}>6. Base legal y consentimiento</h2>
              <p style={p}>
                Al enviar información a Verlo, el usuario presta consentimiento para el tratamiento de
                sus datos conforme a esta Política de Privacidad y a los Términos y Condiciones.
              </p>
              <p style={p}>
                En determinados casos, el tratamiento también puede basarse en la ejecución de una
                relación contractual o precontractual, el cumplimiento de obligaciones legales, la
                prevención de fraude, la seguridad de usuarios o el interés legítimo de operar y
                mejorar la plataforma.
              </p>
            </section>

            <section id="auth" style={section}>
              <h2 style={h2}>7. Cuenta, autenticación y enlaces mágicos</h2>
              <p style={p}>
                Verlo puede utilizar autenticación por email mediante enlaces mágicos. Al solicitar
                la confirmación de cuenta, se envía un enlace a la dirección indicada por el usuario.
                Al abrir ese enlace, se confirma el acceso y puede crearse o actualizarse la cuenta.
              </p>
              <p style={p}>
                El usuario debe asegurarse de tener acceso a la casilla informada y de no compartir
                enlaces de acceso con terceros. Verlo puede registrar eventos asociados al alta,
                confirmación, inicio de sesión y estado de la cuenta.
              </p>
            </section>

            <section id="crm" style={section}>
              <h2 style={h2}>8. CRM, WhatsApp, email y seguimiento comercial</h2>
              <p style={p}>
                Cuando una persona completa un formulario, Verlo puede enviar esos datos a
                herramientas internas o externas de gestión comercial, automatización, mensajería y
                atención al usuario.
              </p>
              <p style={p}>
                Esto permite responder consultas, ordenar oportunidades, asignar tags, registrar
                estados, automatizar mensajes y realizar seguimiento del caso. El usuario puede
                solicitar dejar de recibir comunicaciones no esenciales.
              </p>
            </section>

            <section id="medicion" style={section}>
              <h2 style={h2}>9. Analítica, publicidad y eventos de conversión</h2>
              <p style={p}>
                Verlo puede utilizar herramientas de medición, píxeles, APIs de conversión, cookies o
                tecnologías similares para entender el rendimiento del sitio, medir campañas,
                atribuir conversiones, mejorar anuncios y optimizar la experiencia.
              </p>
              <p style={p}>
                Estos datos pueden incluir eventos como visitas, formularios enviados, acciones de
                confirmación, origen de campaña, navegador, IP, URL de origen e identificadores
                técnicos. Cuando corresponde, se aplican procesos de normalización o hashing antes de
                enviar ciertos datos a plataformas publicitarias.
              </p>
            </section>

            <section id="verificacion" style={section}>
              <h2 style={h2}>10. Verificación de identidad y prevención de fraude</h2>
              <p style={p}>
                Para habilitar determinadas funciones, Verlo puede solicitar validación de identidad,
                documentación, selfie, prueba de vida, confirmación de teléfono, revisión manual o
                controles antifraude.
              </p>
              <p style={p}>
                Cuando se utilicen proveedores externos de verificación, estos podrán actuar como
                encargados del tratamiento o responsables independientes según sus propios términos,
                políticas y el alcance del servicio contratado.
              </p>
              <p style={p}>
                Verlo podrá conservar el resultado de la verificación, estado, fecha, identificadores
                del proceso y metadatos necesarios para seguridad, trazabilidad y prevención de abuso.
              </p>
            </section>

            <section id="proveedores" style={section}>
              <h2 style={h2}>11. Proveedores y terceros</h2>
              <p style={p}>
                Verlo puede compartir datos con proveedores tecnológicos estrictamente necesarios
                para operar el servicio, incluyendo infraestructura, base de datos, autenticación,
                CRM, mensajería, email, analítica, publicidad, verificación de identidad, seguridad y
                soporte.
              </p>
              <p style={p}>
                Estos proveedores solo deben tratar los datos para prestar sus servicios a Verlo o
                cumplir finalidades compatibles. Verlo procura trabajar con herramientas que ofrecen
                estándares razonables de seguridad y confidencialidad.
              </p>
              <p style={p}>
                Verlo también podrá compartir información cuando exista obligación legal,
                requerimiento de autoridad competente, prevención de fraude, protección de derechos o
                necesidad de defender intereses legítimos.
              </p>
            </section>

            <section id="conservacion" style={section}>
              <h2 style={h2}>12. Conservación de los datos</h2>
              <p style={p}>
                Los datos se conservan durante el tiempo necesario para cumplir las finalidades
                descriptas, gestionar la relación con el usuario, mantener registros operativos,
                prevenir fraude, resolver reclamos, cumplir obligaciones legales o defender derechos.
              </p>
              <p style={p}>
                Cuando los datos ya no sean necesarios, Verlo podrá eliminarlos, anonimizarlos,
                agregarlos estadísticamente o bloquearlos cuando corresponda conservarlos por razones
                legales o legítimas.
              </p>
            </section>

            <section id="seguridad" style={section}>
              <h2 style={h2}>13. Seguridad de la información</h2>
              <p style={p}>
                Verlo aplica medidas razonables de seguridad técnica, organizativa y operativa para
                proteger los datos contra accesos no autorizados, pérdida, uso indebido, alteración o
                divulgación indebida.
              </p>
              <p style={p}>
                Ningún sistema es absolutamente invulnerable. Por eso, el usuario también debe
                proteger sus dispositivos, cuentas de email, enlaces mágicos y credenciales asociadas.
              </p>
            </section>

            <section id="derechos" style={section}>
              <h2 style={h2}>14. Derechos del titular de los datos</h2>
              <p style={p}>
                El usuario puede solicitar acceso, rectificación, actualización, supresión o
                confidencialidad de sus datos personales cuando corresponda conforme a la normativa
                aplicable.
              </p>
              <p style={p}>
                Para ejercer estos derechos, puede escribir a rentverlo@gmail.com indicando nombre,
                email utilizado en Verlo y detalle de la solicitud. Verlo podrá requerir información
                adicional para verificar la identidad del solicitante.
              </p>
              <p style={p}>
                La supresión puede no proceder cuando exista obligación legal de conservación,
                necesidad de preservar derechos de terceros, prevención de fraude, cumplimiento de
                reclamos pendientes o defensa de intereses legítimos.
              </p>
            </section>

            <section id="menores" style={section}>
              <h2 style={h2}>15. Menores de edad</h2>
              <p style={p}>
                Verlo no está dirigido a menores de edad. Para utilizar funcionalidades vinculadas
                con alquileres, contratos, validación de identidad o contacto entre partes, el usuario
                debe contar con capacidad legal suficiente o autorización válida de quien corresponda.
              </p>
            </section>

            <section id="cookies" style={section}>
              <h2 style={h2}>16. Cookies y tecnologías similares</h2>
              <p style={p}>
                Verlo puede utilizar cookies, almacenamiento local, píxeles, identificadores,
                parámetros UTM y tecnologías similares para recordar preferencias, mantener sesiones,
                medir conversiones, prevenir abuso y mejorar el funcionamiento del sitio.
              </p>
              <p style={p}>
                El usuario puede gestionar cookies desde la configuración de su navegador. Bloquear
                ciertas tecnologías puede afectar el funcionamiento de algunas partes del servicio.
              </p>
            </section>

            <section id="cambios" style={section}>
              <h2 style={h2}>17. Cambios en esta política</h2>
              <p style={p}>
                Verlo puede actualizar esta Política de Privacidad para reflejar cambios legales,
                técnicos, comerciales, operativos o de producto. La versión vigente será la publicada
                en esta página.
              </p>
            </section>

            <section id="contacto" style={section}>
              <h2 style={h2}>18. Contacto por privacidad</h2>
              <p style={p}>
                Para consultas, reclamos o solicitudes vinculadas con privacidad y datos personales,
                podés escribir a:
              </p>
              <div style={contactCard}>
                <strong>Verlo</strong>
                <span>Email: rentverlo@gmail.com</span>
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
  padding: "24px 0 64px",
}

const header: CSSProperties = {
  minHeight: 92,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  padding: "14px 18px",
  borderRadius: 32,
  background: "rgba(255,255,255,0.62)",
  border: "1px solid rgba(5,0,2,0.08)",
  boxShadow: "0 18px 55px rgba(5,0,2,0.06)",
  backdropFilter: "blur(18px)",
}

const brandLink: CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
}

const topLinks: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "flex-end",
}

const topLink: CSSProperties = {
  color: "rgba(5,0,2,0.64)",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
  padding: "11px 15px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.54)",
  border: "1px solid rgba(5,0,2,0.06)",
}

const topCta: CSSProperties = {
  color: "#fff",
  background: "#050002",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 14,
  padding: "12px 18px",
  borderRadius: 999,
  boxShadow: "0 14px 34px rgba(5,0,2,0.16)",
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

const h3: CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.1,
  letterSpacing: "-0.025em",
  fontWeight: 950,
}

const p: CSSProperties = {
  margin: "12px 0 0",
  color: "rgba(5,0,2,0.68)",
  fontSize: 16,
  lineHeight: 1.75,
}

const list: CSSProperties = {
  margin: "16px 0 0",
  paddingLeft: 22,
  color: "rgba(5,0,2,0.68)",
  fontSize: 16,
  lineHeight: 1.8,
}

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
  marginTop: 18,
}

const miniCard: CSSProperties = {
  padding: 18,
  borderRadius: 22,
  background: "rgba(255,255,255,0.68)",
  border: "1px solid rgba(5,0,2,0.08)",
}

const miniP: CSSProperties = {
  margin: "10px 0 0",
  color: "rgba(5,0,2,0.64)",
  fontSize: 14,
  lineHeight: 1.55,
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
