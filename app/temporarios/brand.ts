import type { CSSProperties } from "react"

export const shell: CSSProperties = { minHeight: "100vh", background: "#f2ebec", color: "#050002", fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
export const container: CSSProperties = { width: "min(1160px, calc(100% - 40px))", margin: "0 auto" }
export const nav: CSSProperties = { position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(18px)", background: "rgba(242, 235, 236, 0.82)", borderBottom: "1px solid rgba(5,0,2,.08)" }
export const navInner: CSSProperties = { ...container, minHeight: 116, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }
export const hero: CSSProperties = { padding: "70px 0 54px" }
export const eyebrow: CSSProperties = { color: "#050002", fontSize: 14, letterSpacing: ".03em", fontWeight: 900, textTransform: "uppercase" }
export const heading: CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', fontSize: "clamp(54px,7.4vw,104px)", fontWeight: 950, letterSpacing: "-.055em", lineHeight: .96, margin: "22px 0 0", color: "#050002" }
export const script: CSSProperties = { fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontWeight: 400, letterSpacing: "-.035em" }
export const subtitle: CSSProperties = { maxWidth: 650, margin: "30px 0 0", fontSize: 21, lineHeight: 1.45, color: "rgba(5,0,2,.68)" }
export const button: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 54, padding: "0 24px", background: "#050002", color: "white", border: "1px solid rgba(5,0,2,.12)", borderRadius: 999, fontSize: 16, fontWeight: 900, textDecoration: "none" }
export const outline: CSSProperties = { ...button, background: "white", color: "#050002" }
export const panel: CSSProperties = { background: "rgba(255,255,255,.72)", border: "1px solid rgba(5,0,2,.08)", borderRadius: 24, padding: "clamp(22px,4vw,44px)" }
export const field: CSSProperties = { width: "100%", minHeight: 49, border: "1px solid rgba(5,0,2,.16)", borderRadius: 12, padding: "11px 14px", fontSize: 16, background: "#fff", color: "#050002" }
export const fieldLabel: CSSProperties = { display: "grid", gap: 8, fontSize: 14, fontWeight: 850, color: "#050002" }
