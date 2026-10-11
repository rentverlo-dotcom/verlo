import type { CSSProperties } from "react"

export const shell: CSSProperties = {minHeight:"100vh",padding:"24px 20px 72px",background:"linear-gradient(160deg,#fff7fb 0%,#ffffff 55%,#fce7f3 100%)",color:"#050002"}
export const container: CSSProperties = {maxWidth:1000,margin:"0 auto"}
export const panel: CSSProperties = {background:"#fff",border:"1px solid #f5d7e5",borderRadius:24,padding:"clamp(20px,4vw,40px)",boxShadow:"0 16px 42px rgba(80,20,55,0.06)"}
export const eyebrow: CSSProperties = {color:"#be185d",fontSize:13,letterSpacing:"0.1em",fontWeight:800,textTransform:"uppercase"}
export const heading: CSSProperties = {fontFamily:"Inter,system-ui,sans-serif",fontSize:"clamp(36px,6vw,62px)",fontWeight:800,letterSpacing:"-0.05em",lineHeight:1.07,color:"#050002",margin:"12px 0 20px"}
export const subtitle: CSSProperties = {fontSize:"clamp(17px,2.3vw,20px)",lineHeight:1.65,maxWidth:720,color:"#475569"}
export const button: CSSProperties = {display:"inline-block",background:"#ec4899",color:"#050002",fontWeight:800,borderRadius:14,padding:"15px 23px",textDecoration:"none"}
export const outline: CSSProperties = {...button,background:"#fff",border:"1px solid #f0b5d3"}
export const field: CSSProperties = {width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:14,fontSize:16,background:"#f8fafc",color:"#64748b"}
export const fieldLabel: CSSProperties = {display:"grid",gap:8,fontSize:14,fontWeight:700,color:"#0f172a"}
