import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Materials } from './Materials'
import { useSession } from '../../store/session'

// 다운로드 버튼이 가리키는 대상은 실제 문서가 아니라 참고 이미지(PNG)라서, 폴더 목록에 보이는
// 표시용 파일명("...docs")을 그대로 download 속성에 쓰면 확장자가 실제 내용물과 달라 받은
// 파일이 안 열리는 버그가 있었다(QA 지적, 이 세션에서 실제로 재현/수정함) — 회귀 방지용 테스트.

beforeEach(() => {
  useSession.getState().resetSession()
})

function renderMaterials() {
  return render(
    <MemoryRouter>
      <Materials />
    </MemoryRouter>,
  )
}

describe('Materials 다운로드', () => {
  it('처음 열려 있는 시방서 양식 파일에 대해 .png 확장자로 다운로드 링크를 보여준다', () => {
    renderMaterials()

    const link = screen.getByRole('link', { name: '시방서 양식.png 다운로드' })
    expect(link).toHaveAttribute('download', '시방서 양식.png')
    expect(link.getAttribute('download')).not.toMatch(/\.docs$/)
    expect(link).toHaveAttribute('href', expect.stringContaining('spec-form-reference'))
  })

  it('양식 폴더에서 다른 파일을 열면 다운로드 대상도 그 파일로 바뀐다', async () => {
    const user = userEvent.setup()
    renderMaterials()

    await user.click(screen.getByRole('button', { name: '한도 견본 판정표.docs' }))

    expect(screen.getByText('한도 견본 판정표 파일')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: '한도 견본 판정표.png 다운로드' })
    expect(link).toHaveAttribute('download', '한도 견본 판정표.png')
    expect(link).toHaveAttribute('href', expect.stringContaining('limit-sample-reference'))
    expect(screen.queryByRole('link', { name: '시방서 양식.png 다운로드' })).not.toBeInTheDocument()
  })

  it('다운로드 아이콘이 지정된 hover/pressed 색 클래스를 갖는다 (기본 400, hover 500, pressed 700)', () => {
    renderMaterials()

    const link = screen.getByRole('link', { name: '시방서 양식.png 다운로드' })
    expect(link.className).toContain('text-neutral-400')
    expect(link.className).toContain('hover:text-neutral-500')
    expect(link.className).toContain('active:text-neutral-700')
  })
})
