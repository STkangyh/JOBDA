import { useSession } from '../store/session'
import { useSession1 } from '../store/session1'
import { track } from './analytics'

// 계정별 체험 진행 기록 (2026-11-02 결정, 테이블: supabase/migrations/20261102000000_user_progress.sql).
// - 진행이 바뀌면 잠시 뒤 계정에 저장한다(이메일 계정으로 로그인했을 때만).
// - 로그아웃하면 마지막으로 저장한 뒤 이 브라우저의 진행을 지운다 — 공용 노트북에서 다음 사람이 이어받지 않게.
// - 다시 로그인하면 계정 기록을 불러온다. 브라우저와 계정 둘 다 기록이 있으면 계정 기록이 우선이고,
//   계정에 기록이 없을 때만 이 브라우저의 진행을 계정으로 올린다.
// 저장 형식은 브라우저 저장(zustand persist)과 같아서, 불러올 때도 같은 병합·보정(merge)을 거친다.
// 메신저 대화 원문도 함께 저장된다 — 계속 둘지는 UT 후에 결정.

const AUTH_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
const STORAGE_KEY = 'coad-hackerton-session'
const TABLE = 'user_progress'
const SAVE_DELAY_MS = 1500

let saveTimer: ReturnType<typeof setTimeout> | undefined
// 로그아웃 중에는 지우는 동작이 다시 저장되지 않게 멈춘다
let paused = false

async function client() {
  const { getSupabase } = await import('./supabaseClient')
  return getSupabase()
}

async function accountUserId(): Promise<string | null> {
  try {
    const { data } = await (await client()).auth.getSession()
    const user = data.session?.user
    return user && !user.is_anonymous ? user.id : null
  } catch {
    return null
  }
}

function snapshot(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 지금 진행을 계정에 저장한다. 이메일 계정이 아니거나 저장할 게 없으면 false. */
export async function saveProgress(): Promise<boolean> {
  if (!AUTH_CONFIGURED) return false
  clearTimeout(saveTimer)
  const userId = await accountUserId()
  const data = snapshot()
  if (!userId || !data) return false
  const { error } = await (await client()).from(TABLE).upsert({ user_id: userId, session2: data, updated_at: new Date().toISOString() })
  if (error) {
    console.warn('[progress] save failed', error.message)
    return false
  }
  return true
}

/** 로그인 직후: 계정 기록이 있으면 불러오고, 없으면 이 브라우저의 진행을 계정으로 올린다. */
export async function restoreProgress(): Promise<'restored' | 'uploaded' | 'skipped'> {
  if (!AUTH_CONFIGURED) return 'skipped'
  const userId = await accountUserId()
  if (!userId) return 'skipped'
  const { data, error } = await (await client()).from(TABLE).select('session2').eq('user_id', userId).maybeSingle()
  if (error) {
    console.warn('[progress] load failed', error.message)
    return 'skipped'
  }
  if (data?.session2) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session2))
    } catch {
      return 'skipped'
    }
    await useSession.persist.rehydrate()
    track('progress_restore', { result: 'restored', stage: useSession.getState().currentStage })
    return 'restored'
  }
  const uploaded = await saveProgress()
  track('progress_restore', { result: uploaded ? 'uploaded' : 'empty' })
  return uploaded ? 'uploaded' : 'skipped'
}

/** 이 브라우저의 진행과 처음 방문 안내 표시를 지운다(다음 사람이 처음부터 보게). */
export function clearLocalProgress() {
  useSession.getState().resetSession()
  useSession1.getState().resetSession()
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('jobda-coach-') || key === 'jobda-work-tasks') localStorage.removeItem(key)
    }
  } catch {
    // 저장소가 막혀도 진행 초기화는 이미 끝났다
  }
}

/** 로그아웃 직전: 마지막으로 저장하고 브라우저 진행을 지운다. */
export async function saveAndClearForLogout() {
  paused = true
  try {
    await saveProgress()
    clearLocalProgress()
  } finally {
    clearTimeout(saveTimer)
    paused = false
  }
}

/** 앱 시작 시 한 번: 진행이 바뀔 때마다(잠시 모아서) 계정에 저장한다. 탭을 떠날 때도 저장한다. */
export function startProgressSync() {
  if (!AUTH_CONFIGURED) return
  useSession.subscribe(() => {
    if (paused) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void saveProgress(), SAVE_DELAY_MS)
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && saveTimer !== undefined && !paused) void saveProgress()
  })
}
