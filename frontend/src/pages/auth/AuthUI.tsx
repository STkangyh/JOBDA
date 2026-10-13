import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import designerArtwork from '../../assets/illustrations/welcome-designer.png'
import accountIcon from '../../assets/auth/account.svg'
import passwordIcon from '../../assets/auth/password.svg'
import eyeOffIcon from '../../assets/auth/eye-off.svg'
import checkboxIcon from '../../assets/auth/checkbox.svg'
import alertIcon from '../../assets/auth/circle-alert.svg'
import backIcon from '../../assets/auth/back.svg'
import fieldBadgeIcon from '../../assets/auth/badge-field.svg'
import durationBadgeIcon from '../../assets/auth/badge-duration.svg'
import { Sidebar } from '../../components/Sidebar'
import type { AuthFailure } from '../../lib/auth'
import { LOGIN_INTRO, type Intro } from './intros'

// 로그인 · 회원가입 · 비밀번호 찾기 · 비밀번호 재설정 화면이 함께 쓰는 틀과 입력 요소.
// Figma: 로그인 2217:9633, 로그인 오류 2220:35215, 회원가입 2217:9897, 비밀번호 찾기 2217:9847, 비밀번호 재설정 2223:36129 (2026-10-13)
// 화면마다 왼쪽 소개 문구와 오른쪽 카드만 다르다.

export function AuthLayout({ intro = LOGIN_INTRO, children }: { intro?: Intro; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-svh gap-[clamp(24px,3.1vw,54px)] overflow-hidden bg-neutral-950 pt-[clamp(24px,5svh,56px)] pr-[clamp(32px,4.7vw,82px)] pb-[clamp(16px,3svh,32px)] pl-[clamp(32px,3.7vw,64px)]">
      <Sidebar active="home" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-[clamp(12px,3svh,48px)]">
        <div className="flex h-16 items-center">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="h-16 w-56 rounded-[32px] border-2 border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] px-6 text-title-lg font-bold text-neutral-900 shadow-gnb backdrop-blur-gnb focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            직무 둘러보기
          </button>
        </div>

        <div className="flex min-h-0 items-end gap-[clamp(32px,6vw,104px)] py-[clamp(0px,3svh,48px)] pl-[clamp(0px,1.6vw,28px)]">
          <section className="flex max-w-[740px] min-w-0 flex-1 flex-col gap-8" aria-label="체험 소개">
            <div className="flex flex-col gap-5">
              <p className="text-headline-lg font-medium text-green-400">
                {intro.title[0]}
                <br />
                {intro.title[1]}
              </p>
              <p className="text-body-lg text-neutral-500">
                {intro.body[0]}
                <br />
                {intro.body[1]}
              </p>
            </div>
            <FeaturedExperience />
          </section>
          <main className="max-h-full w-[560px] max-w-full shrink-0 overflow-y-auto rounded-xl bg-[#262626] p-[clamp(24px,3.6svh,40px)]">{children}</main>
        </div>
      </div>
    </div>
  )
}

function FeaturedExperience() {
  return (
    <div className="overflow-clip rounded-xl bg-neutral-900">
      <img src={designerArtwork} alt="" width={1200} height={675} className="aspect-[740/400] max-h-[34svh] w-full object-cover" />
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <p className="text-title-lg whitespace-nowrap text-green-50">생활 가전 제품 디자이너</p>
        <div className="flex gap-2 rounded-[32px] bg-[rgba(207,245,170,0.07)] px-3 py-2">
          <Badge icon={fieldBadgeIcon}>문화 · 예술</Badge>
          <Badge icon={durationBadgeIcon}>2주일 · 매일 2시간</Badge>
        </div>
      </div>
    </div>
  )
}

function Badge({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-[15px] bg-green-500 px-2 py-1 text-body-lg whitespace-nowrap text-green-900">
      <img src={icon} alt="" width={18} height={18} className="size-[18px]" />
      {children}
    </span>
  )
}

export function CardHeading({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-headline-lg font-medium text-green-50">{title}</h1>
      <p className="text-body-lg text-neutral-500">{body}</p>
    </div>
  )
}

export function ErrorNotice({ error }: { error: AuthFailure | { title: string; detail: string } }) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-lg bg-[rgba(238,105,93,0.07)] px-3.5 py-3">
      <img src={alertIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-lg font-medium text-error-100">{error.title}</p>
        <p className="text-body-md text-neutral-500">{error.detail}</p>
      </div>
    </div>
  )
}

// "메일이 도착하지 않았나요?" · "안전한 비밀번호를 위한 안내" 상자
export function InfoBox({ title, lines, role }: { title: string; lines: string[]; role?: 'status' }) {
  return (
    <div role={role} className="flex flex-col gap-2 rounded-lg bg-[#202020] p-5">
      <p className="text-body-lg font-medium text-neutral-300">{title}</p>
      <p className="text-body-md text-neutral-500">
        {lines.map((line, i) => (
          <span key={line} className="block">
            {line}
            {i < lines.length - 1 && ' '}
          </span>
        ))}
      </p>
    </div>
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string
  kind: 'email' | 'password'
  invalid?: boolean
}

export function AuthField({ label, kind, invalid = false, ...input }: FieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = kind === 'password'
  return (
    <div className="flex flex-col gap-[clamp(6px,1.1svh,12px)]">
      <label htmlFor={id} className="w-fit text-body-lg text-neutral-300">
        {label}
      </label>
      <div
        className={`flex h-[clamp(48px,5.7svh,64px)] items-center gap-3 rounded-lg border bg-[#202020] px-[18px] transition-colors focus-within:border-neutral-500 ${
          invalid ? 'border-error-200 focus-within:border-error-200' : 'border-[#454545]'
        }`}
      >
        <img src={isPassword ? passwordIcon : accountIcon} alt="" width={24} height={24} className="size-6 shrink-0" />
        <input
          id={id}
          type={isPassword ? (visible ? 'text' : 'password') : 'email'}
          aria-invalid={invalid || undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body-lg text-neutral-300 outline-none placeholder:text-neutral-600"
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={visible}
            className="flex size-6 shrink-0 items-center justify-center rounded text-[#969696] focus-visible:outline-2 focus-visible:outline-green-700"
          >
            {/* 숨김 상태 아이콘은 Figma eye-off 원본. 보이는 상태 아이콘은 디자인에 없어 같은 선 굵기로 그렸다. */}
            {visible ? <EyeIcon /> : <img src={eyeOffIcon} alt="" width={20} height={20} className="size-5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M1.718 10.29a.83.83 0 0 1 0-.58C3.08 6.41 6.3 4.17 10 4.17s6.92 2.24 8.282 5.54a.83.83 0 0 1 0 .58C16.92 13.59 13.7 15.83 10 15.83s-6.92-2.24-8.282-5.54Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function RememberCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-body-lg text-neutral-500">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      {/* 체크 해제 상태는 Figma 원본 아이콘, 체크 상태는 디자인에 없어 같은 자리·크기의 연두색 상자로 표시 */}
      <span className="flex size-6 items-center justify-center rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-green-700">
        {checked ? (
          <span className="flex size-[18px] items-center justify-center rounded-[2px] bg-green-400" aria-hidden>
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5l3.5 3.5L11 1.5" stroke="#2c2c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <img src={checkboxIcon} alt="" width={24} height={24} className="size-6" />
        )}
      </span>
      로그인 상태 유지
    </label>
  )
}

export function SubmitButton({ busy, children, outlined = false }: { busy: boolean; children: ReactNode; outlined?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy || undefined}
      className={`flex h-[clamp(56px,6.4svh,72px)] w-full items-center justify-center rounded-xl bg-green-500 px-6 text-headline-md font-semibold text-neutral-900 transition-colors hover:bg-green-400 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
        outlined ? 'border-2 border-[rgba(225,225,225,0.5)]' : ''
      }`}
    >
      {busy ? '처리하고 있어요…' : children}
    </button>
  )
}

export function BackToLogin() {
  return (
    <Link to="/login" className="mx-auto flex w-fit items-center gap-2 rounded text-body-lg text-green-400 focus-visible:outline-2 focus-visible:outline-green-700">
      <img src={backIcon} alt="" width={24} height={24} className="size-6" />
      로그인으로 돌아가기
    </Link>
  )
}

export function SwitchPrompt({ question, to, label }: { question: string; to: string; label: string }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-3 text-body-lg">
      <span className="text-neutral-500">{question}</span>
      <Link to={to} className="rounded text-green-400 focus-visible:outline-2 focus-visible:outline-green-700">
        {label}
      </Link>
    </p>
  )
}
