import Image from "next/image"

interface HanaLogoProps {
  className?: string
  size?: number
}

export function HanaLogo({ className = "", size = 32 }: HanaLogoProps) {
  return <Image src="/hana-logo.png" alt="Hana Logo" width={size} height={size} className={className} />
}
