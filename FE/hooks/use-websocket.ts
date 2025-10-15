import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface StockDetailData {
  ticker: string
  price: number
  volume: number
  askPrices: number[]  // 매도호가 10단
  bidPrices: number[]  // 매수호가 10단
  askVolumes: number[] // 매도잔량 10단
  bidVolumes: number[] // 매수잔량 10단
  timestamp: number
}

interface TradeExecutionData {
  ticker: string
  price: number
  volume: number
  tradeType: string
  time: string
  timestamp: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  stockData: StockDetailData | null
  executions: TradeExecutionData[]
  subscribeToStock: (ticker: string) => void
  unsubscribeFromStock: () => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [stockData, setStockData] = useState<StockDetailData | null>(null)
  const [executions, setExecutions] = useState<TradeExecutionData[]>([])
  const clientRef = useRef<Client | null>(null)
  const currentSubscriptionRef = useRef<string | null>(null)
  const detailSubscriptionRef = useRef<any>(null)
  const executionSubscriptionRef = useRef<any>(null)
  

  // 호가 업데이트 함수 (모든 데이터 업데이트)
  const updateStockData = useCallback((data: StockDetailData) => {
    setStockData(data)
    console.log(`📈 호가 데이터 업데이트: ${data.ticker}`, {
      현재가: data.price,
      거래량: data.volume,
      매도1호가: data.askPrices[0],
      매수1호가: data.bidPrices[0]
    })
  }, [])

  useEffect(() => {
    console.log('use-websocket.ts 초기화 시작...')
    
    // 기존 클라이언트 정리
    if (clientRef.current) {
      console.log('기존 클라이언트 정리 중...')
      clientRef.current.deactivate()
      clientRef.current = null
    }

    // WebSocket 연결 설정
    console.log('새 WebSocket 클라이언트 생성...')
    const client = new Client({
      webSocketFactory: () => {
        console.log('SockJS 연결 시도...')
        return new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`)
      },
      debug: (str) => {
        console.log('STOMP Debug:', str)
      },
      onConnect: (frame) => {
        console.log('WebSocket 연결 성공!', frame)
        setIsConnected(true)
      },
      onDisconnect: (frame) => {
        console.log('WebSocket 연결 종료', frame)
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP 오류:', frame)
        setIsConnected(false)
      },
      onWebSocketError: (event) => {
        console.error('WebSocket 오류:', event)
        setIsConnected(false)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    clientRef.current = client
    
    console.log('클라이언트 활성화...')
    client.activate()

    return () => {
      console.log('클라이언트 정리...')
      if (client) {
        client.deactivate()
      }
    }
  }, [])

  const subscribeToStock = (ticker: string) => {
    const client = clientRef.current
    console.log(`구독 시도: ${ticker}`, {
      client: !!client,
      connected: client?.connected,
      active: client?.active,
    })
    
    if (!client) {
      console.warn('클라이언트가 없음')
      return
    }
    
    if (!client.connected) {
      console.warn('WebSocket이 연결되지 않음, 연결 대기 중...')
      // 연결될 때까지 대기 후 다시 시도
      setTimeout(() => subscribeToStock(ticker), 1000)
      return
    }

    // 기존 구독 해제
    unsubscribeFromStock()
    
    // 새로운 종목 구독 시 체결 데이터 초기화
    setExecutions([])
    console.log(`이전 체결 데이터 초기화 완료`)

    // 백엔드에 구독 요청 (백엔드가 Python 클라이언트에 전달)
    console.log(`통합 구독 시스템: ${ticker} 구독 요청 시작`)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/subscription/${ticker}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      console.log(`백엔드 구독 응답: ${ticker} - 상태코드: ${response.status}`)
      if (response.ok) {
        console.log(`통합 구독 시스템: ${ticker} 구독 성공 (백엔드 → Python 클라이언트)`)
      } else {
        console.error(`통합 구독 시스템: ${ticker} 구독 실패`, response.status, response.statusText)
      }
    })
    .catch(error => {
      console.error(`통합 구독 시스템: ${ticker} 네트워크 오류`, error)
    })

    // 새로운 구독 설정
    console.log(`${ticker} 구독 시작`)
    console.log(`현재 시각: ${new Date().toLocaleTimeString()}`)
    
    // 상세 정보 (호가 포함) 구독
    console.log(`호가 구독 토픽: /topic/stock/${ticker}`)
    detailSubscriptionRef.current = client.subscribe(`/topic/stock/${ticker}`, (message) => {
      try {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`[${timestamp}] 호가 메시지 수신: ${ticker}`)
        console.log(`메시지 내용:`, message.body)
        const data: StockDetailData = JSON.parse(message.body)
        
        // 현재 구독 중인 종목과 일치하는 데이터만 처리
        if (data.ticker === ticker) {
          console.log(`[${timestamp}] 파싱된 호가 데이터: ${ticker}`, data)
          updateStockData(data)  // 해당 종목 데이터만 업데이트
          console.log(`[${timestamp}] 호가 데이터 처리 완료: ${ticker}`)
        } else {
          console.log(`[${timestamp}] 종목 불일치: 수신=${data.ticker}, 구독=${ticker}`)
        }
      } catch (error) {
        console.error('실시간 데이터 파싱 오류:', error)
        console.error('원시 데이터:', message.body)
      }
    })

    // 체결가 정보 구독 (KIS 실제 데이터 대기)
    console.log(`체결가 구독 토픽: /topic/stock/${ticker}/execution`)
    console.log(`KIS 실제 체결 데이터를 기다리는 중...`)
    executionSubscriptionRef.current = client.subscribe(`/topic/stock/${ticker}/execution`, (message) => {
      try {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`[${timestamp}] KIS 체결가 메시지 수신! ${ticker}`)
        console.log(`KIS 체결가 원시 데이터:`, message.body)
        
        const data: TradeExecutionData = JSON.parse(message.body)
        
        // 현재 구독 중인 종목과 일치하는 체결 데이터만 처리
        if (data.ticker === ticker) {
          console.log(`[${timestamp}] KIS 파싱된 체결가: ${ticker}`, {
            체결가: data.price,
            수량: data.volume,
            구분: data.tradeType,
            시간: data.time,
            티커: data.ticker
          })
          
          setExecutions(prev => {
            // 중복 제거: 동일 시점+동일 내용만 제외 (초 단위 timestamp 충돌 시 기존 항목이 사라지는 문제 방지)
            const combined = [data, ...prev.filter(e =>
              !(e.timestamp === data.timestamp && e.price === data.price && e.volume === data.volume && e.tradeType === data.tradeType)
            )]
                      
            // 최신순 정렬 (timestamp 내림차순)
            const sorted = combined.sort((a, b) => b.timestamp - a.timestamp)
          
            // 최대 20개까지만 유지
            return sorted.slice(0, 30)
          })
          
          console.log(`[${timestamp}] KIS 체결가 상태 업데이트 완료: ${ticker}`)
        } else {
          console.log(`[${timestamp}] 체결가 종목 불일치: 수신=${data.ticker}, 구독=${ticker}`)
        }
      } catch (error) {
        console.error('KIS 체결가 데이터 파싱 오류:', error)
        console.error('원시 데이터:', message.body)
      }
    })

    currentSubscriptionRef.current = ticker
    
    // KIS 체결 데이터 수신 대기 상태 표시
    console.log(`KIS 체결 데이터 수신 준비 완료`)
    console.log(`체결 데이터 토픽: /topic/stock/${ticker}/execution`)
  }

  const unsubscribeFromStock = () => {
    if (detailSubscriptionRef.current) {
      detailSubscriptionRef.current.unsubscribe()
      detailSubscriptionRef.current = null
    }
    if (executionSubscriptionRef.current) {
      executionSubscriptionRef.current.unsubscribe()
      executionSubscriptionRef.current = null
    }
    if (currentSubscriptionRef.current) {
      console.log(`${currentSubscriptionRef.current} 구독 해제`)
      
      // 백엔드에 구독 해제 요청 (백엔드가 Python 클라이언트에 전달)
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/subscription/${currentSubscriptionRef.current}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
        if (response.ok) {
          console.log(`통합 구독 시스템: ${currentSubscriptionRef.current} 구독 해제 성공`)
        } else {
          console.error(`통합 구독 시스템: ${currentSubscriptionRef.current} 구독 해제 실패`, response.status)
        }
      })
      .catch(error => {
        console.error(`통합 구독 시스템: ${currentSubscriptionRef.current} 구독 해제 오류`, error)
      })
      
      currentSubscriptionRef.current = null
    }
    setStockData(null)
    // 체결 데이터는 새로운 종목 구독 시에 초기화됨
  }

  // 체결 데이터 수신 상태 모니터링
  useEffect(() => {
    if (executions.length === 0) {
      console.log(`현재 체결 데이터 없음 - KIS 체결 데이터 대기 중`)
    } else {
      console.log(`현재 KIS 체결 데이터 개수: ${executions.length}`)
      console.log(`최근 KIS 체결:`, executions[executions.length - 1])
    }
  }, [executions])

  return {
    isConnected,
    stockData,
    executions,
    subscribeToStock,
    unsubscribeFromStock
  }
} 