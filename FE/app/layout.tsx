import type React from "react"
import type { Metadata } from "next"
// import { Inter } from "next/font/google"
import "./globals.css"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth-provider"
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider"
import { SecuritySearchIcon } from "@/components/security-search"

// const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        /> */}
      </head>
      <body style={{ fontFamily: "'Hana2', 'Noto Sans KR', sans-serif" }}>
        <AuthProvider>
          <ChatbotProvider>
            <div className="min-h-screen flex flex-col bg-white">
              <MainNav />
              {/* 네비게이션 바 높이(h-16)만큼 main 컨텐츠에 상단 패딩을 주어 겹치지 않게 함 */}
              <main className="flex-grow pt-16">{children}</main>
              <Footer />
            </div>
            <SecuritySearchIcon />
          </ChatbotProvider>
        </AuthProvider>
        <Toaster
            position="top-center"
            offset={80}
            richColors
            closeButton
            expand={true}
            visibleToasts={1}
            toastOptions={{
              className: "rounded-2xl shadow-2xl border-0 backdrop-blur-md bg-white/95 px-6 py-4 font-medium",
              style: {
                fontFamily: "'Hana2', 'Noto Sans KR', sans-serif",
                fontSize: "15px",
                color: "#1f2937",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(16px)",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              },
              duration: 4000,
            }}
        />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "HanaPath - 청소년 금융 플랫폼",
  description: "청소년을 위한 스마트한 금융 학습 및 투자 플랫폼",
  manifest: "/manifest.json",
  icons: {
    icon: "/hana-logo.png",
    shortcut: "/hana-logo.png",
    apple: "/hana-logo.png",
  },
};
