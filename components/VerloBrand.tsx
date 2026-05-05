import Link from "next/link"

type VerloBrandProps = {
  href?: string
  className?: string
  width?: number
  showText?: boolean
}

export default function VerloBrand({
  href = "/",
  className = "brand",
  width = 34,
  showText = true,
}: VerloBrandProps) {
  return (
    <Link href={href} className={className} aria-label="Verlo">
      <img
        src="/logo-verlo.png"
        alt=""
        aria-hidden="true"
        style={{
          width,
          height: "auto",
          display: "block",
        }}
      />

      {showText && <span className="brand-text">verlo</span>}
    </Link>
  )
}

