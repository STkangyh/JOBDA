import { useCallback, useEffect, useRef } from 'react'
import { openView } from './analytics'
import type { CloseHow, ViewKind, ViewName } from './views'

interface Options {
  kind: ViewKind
  name: ViewName
  open?: boolean
}

// 탭·패널: name이 바뀌면 이전 것을 'switch'로 닫고 새로 연다. 모달: open이 false가 되면 닫힌다.
// 닫힌 방식을 알고 있으면(ESC, 바깥 클릭 등) 닫기 직전에 반환된 markClose(how)를 부른다.
export function useTrackView({ kind, name, open = true }: Options) {
  const mounted = useRef(true)
  const pendingHow = useRef<CloseHow | null>(null)

  // 언마운트 때는 이 정리 함수가 아래 effect의 정리보다 먼저 실행된다(선언 순서) — 그래서
  // 아래에서 "탭 전환"과 "화면을 떠남"을 구분할 수 있다.
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const close = openView(kind, name)
    return () => {
      // 화면에 남아 있는 채로 정리되면: 탭·패널은 다른 값으로 바뀐 것(switch), 모달·드로어는 닫힌 것(button).
      const how = pendingHow.current ?? (!mounted.current ? 'unmount' : kind === 'tab' || kind === 'panel' ? 'switch' : 'button')
      pendingHow.current = null
      close(how)
    }
  }, [kind, name, open])

  return useCallback((how: CloseHow) => {
    pendingHow.current = how
  }, [])
}
