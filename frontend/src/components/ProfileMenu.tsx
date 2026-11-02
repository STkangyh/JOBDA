import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import profileIcon from '../assets/gnb/profile.svg'
import { accountEmailHint, signOut } from '../lib/auth'

// 공통 GNB의 프로필 버튼 — 누르면 로그인한 이메일(일부 가림)과 로그아웃을 보여준다(2026-11-02 결정).
// 메뉴 디자인이 없어 디자인 시스템의 말풍선 카드(코치 마크와 같은 Neutral 카드)로 만든 초안이다.
// 로그인하지 않은 사람에게는 로그인 화면으로 가는 버튼을 보여준다.
export function ProfileMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    void accountEmailHint().then((hint) => alive && setEmail(hint))
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      alive = false
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const logout = async () => {
    setBusy(true)
    await signOut()
    setBusy(false)
    setOpen(false)
    navigate('/login')
  }

  const action =
    'h-12 w-full rounded-b-2xl bg-neutral-50 text-body-lg font-medium text-neutral-600 hover:text-neutral-900 disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="내 계정"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-[54px] items-center justify-center rounded-full bg-green-400 backdrop-blur-panel transition-colors hover:bg-green-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
      >
        <img src={profileIcon} alt="" width={20} height={20} className="size-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="내 계정"
          className="absolute top-0 left-[calc(100%+20px)] z-40 w-[260px] rounded-2xl bg-neutral-100 shadow-[0_0_16px_rgba(0,0,0,0.12)]"
        >
          <div className="flex flex-col gap-1 px-6 pt-5 pb-4">
            <p className="text-caption-lg text-neutral-500">{email ? '로그인한 계정' : '계정'}</p>
            <p className="truncate text-title-md font-semibold text-neutral-900">{email === undefined ? '확인하는 중…' : (email ?? '로그인하지 않았어요')}</p>
          </div>
          {email ? (
            <button type="button" onClick={logout} disabled={busy} className={action}>
              {busy ? '로그아웃하는 중…' : '로그아웃'}
            </button>
          ) : (
            email === null && (
              <button type="button" onClick={() => navigate('/login')} className={action}>
                로그인
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
