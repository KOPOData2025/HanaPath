"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit3, Save, X } from "lucide-react"
import { toast } from "sonner"

interface MemoEditModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  currentMemo?: string
  onMemoUpdate: (transactionId: number, newMemo: string) => void
}

export default function MemoEditModal({ 
  isOpen, 
  onClose, 
  transactionId, 
  currentMemo = "", 
  onMemoUpdate 
}: MemoEditModalProps) {
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때마다 currentMemo로 초기화
  useEffect(() => {
    if (isOpen) {
      setMemo(currentMemo)
    }
  }, [isOpen, currentMemo])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // 실제 API 호출
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('인증 토큰이 없습니다.')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/transactions/${transactionId}/memo`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memo }),
        }
      )

      if (!response.ok) {
        throw new Error('메모 업데이트에 실패했습니다.')
      }
      
      onMemoUpdate(transactionId, memo)
      
      toast.success("메모가 저장되었습니다!", {
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
      
      onClose()
      
    } catch (error) {
      console.error("메모 저장 실패:", error)
      toast.error("메모 저장에 실패했습니다.", {
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '15px',
          fontWeight: '600',
        },
        className: 'font-medium',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMemo("") // 초기화
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-teal-500" />
            메모 편집
          </DialogTitle>
          <DialogDescription>
            거래 내역에 메모를 추가하거나 수정할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">메모 내용</label>
            <Textarea
              placeholder="거래에 대한 메모를 입력하세요 (예: 생일선물, 용돈, 점심값 등)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={100}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>거래 내역에서 확인할 수 있습니다</span>
              <span>{memo.length}/100</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            취소
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 