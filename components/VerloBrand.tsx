import Link from "next/link"

type VerloBrandProps = {
  href?: string
  className?: string
  width?: number
  text?: string
  showText?: boolean
}

export default function VerloBrand({
  href = "/",
  className = "brand",
  width = 34,
  text = "verlo",
  showText = true,
}: VerloBrandProps) {
  return (
    <Link
      href={href}
      className={className}
      aria-label="Verlo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: "#050002",
        lineHeight: 1,
      }}
    >
      <img
        src="/logo-verlo.png"
        alt=""
        aria-hidden="true"
        style={{
          width,
          height: "auto",
          display: "block",
          flexShrink: 0,
        }}
      />

      {showText && (
        <span
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 32,
            fontWeight: 500,
            fontStyle: "italic",
            letterSpacing: "-0.06em",
            textTransform: "lowercase",
            color: "#050002",
          }}
        >
          {text}
        </span>
      )}
    </Link>
  )
}
