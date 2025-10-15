import { HanaLogo } from "@/components/hana-logo"
import { Phone, Mail, Youtube, Instagram, Linkedin, Facebook } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-screen-2xl mx-auto">
        {/* Top Links Section */}
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Policy Links */}
            <div className="flex flex-wrap gap-6 lg:gap-8">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                개인정보처리방침
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                자주 묻는 질문
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                고객정보취급방침
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                건전한 소리
              </a>
            </div>

            {/* Social Media Icons with Brand Colors Always Visible */}
            <div className="flex gap-3">
              <a href="#" className="group" aria-label="YouTube">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
              </a>
              <a href="#" className="group" aria-label="Facebook">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
              </a>
              <a href="#" className="group" aria-label="Instagram">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
              </a>
              <a href="#" className="group" aria-label="LinkedIn">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            {/* Company Info - Left */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <HanaLogo size={32} />
                <span className="text-xl font-bold">HanaPath</span>
              </div>

              {/* Company Details */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">서울특별시 중구 을지로 66</p>
                <p className="text-sm text-gray-500">
                  Copyright © 2025 HANAPATH Co., Ltd. All rights Reserved.
                </p>
              </div>
            </div>

            {/* Contact Info - Right */}
            <div className="flex-shrink-0">
              <h4 className="text-sm font-medium text-gray-300 mb-4">CONTACT US</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">1599-1111</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">support@hanapath.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
