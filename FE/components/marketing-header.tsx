"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HanaLogo } from "@/components/hana-logo"

export function MarketingHeader() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <HanaLogo size={28} />
          <span className="text-xl font-bold text-[#004E42]">HanaPath</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button className="bg-[#009178] hover:bg-[#004E42]" asChild>
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
