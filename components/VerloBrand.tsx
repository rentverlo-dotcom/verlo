import Link from "next/link"

type VerloBrandProps = {
  href?: string
  className?: string
  width?: number
}

export default function VerloBrand({
  href = "/",
  className = "brand",
  width = 112,
}: VerloBrandProps) {
  return (
    <Link href={href} className={className} aria-label="Verlo">
      <img
        src="/logo-verlo.png"
        alt="Verlo"
        style={{
          width,
          height: "auto",
          display: "block",
        }}
      />
    </Link>
  )
}
