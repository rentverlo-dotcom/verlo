"use client"

import { useEffect, useState, type ChangeEvent } from "react"

type Preview = { id: string; url: string; name: string; type: string }

export default function TemporaryMediaPicker() {
  const [items, setItems] = useState<Preview[]>([])

  function onSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    const next = files.filter(file => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .slice(0, 12).map(file => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
      }))
    setItems(previous => {
      for (const item of previous) URL.revokeObjectURL(item.url)
      return next
    })
  }
  useEffect(() => () => {
    items.forEach(item => URL.revokeObjectURL(item.url))
  }, [items])

  return <div style={{ display: "grid", gap: 12 }}>
    <label style={{ display: "grid", gap: 8, fontWeight: 850, fontSize: 14 }}>
      Fotos y videos de la propiedad
      <input type="file" multiple accept="image/*,video/*" onChange={onSelect}
        style={{ border: "1px dashed rgba(5,0,2,.3)", borderRadius: 14, padding: 18, background: "white" }} />
    </label>
    <p style={{ margin: 0, fontSize: 13 }}>
      Vista previa local: todavía NO se suben archivos a R2 ni se guardan en Supabase.
      La integración existente de R2 se conectará después de aislar el entorno de prueba.
    </p>
    {items.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 12 }}>
      {items.map(item => <div key={item.id} style={{ borderRadius: 14, overflow: "hidden", background: "white", border: "1px solid #ded4d8" }}>
        {item.type.startsWith("video/") ?
          <video src={item.url} controls style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} /> :
          <img src={item.url} alt={item.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />}
        <div style={{ padding: 8, fontSize: 12, overflowWrap: "anywhere" }}>{item.name}</div>
      </div>)}
    </div>}
  </div>
}
