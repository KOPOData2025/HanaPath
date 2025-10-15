import type React from "react"
import { MarketingHeader } from "@/components/marketing-header"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-grow">{children}</main>
    </div>
  )
}
