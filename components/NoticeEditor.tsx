'use client'

import { useRef, useState, useEffect } from 'react'

const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32, 36]
const FONT_FAMILIES = [
  { label: '나눔고딕', value: "'Nanum Gothic', sans-serif" },
  { label: '나눔명조', value: "'Nanum Myeongjo', serif" },
  { label: '검은고딕', value: "'Black Han Sans', sans-serif" },
  { label: '도현체', value: "'Do Hyeon', sans-serif" },
  { label: '주아체', value: "'Jua', sans-serif" },
  { label: '개구체', value: "'Gaegu', sans-serif" },
]

interface NoticeEditorProps {
  value: string
  onChange: (html: string) => void
}

export default function NoticeEditor({ value, onChange }: NoticeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)

  // 최초 마운트 시에만 초기값 주입 (이후엔 onInput으로만 상태 동기화 — 그래야 커서가 안 튐)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  // 에디터 안의 현재 선택 영역을 저장 — 툴바 버튼 클릭 시 선택이 풀리는 걸 방지하기 위함
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange()
      }
    }
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
  }

  // 선택 영역을 지정한 스타일의 span으로 감싸는 범용 함수 (글자크기·글씨체에 사용)
  const wrapSelectionWithStyle = (styleProp: string, styleValue: string) => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    ;(span.style as any)[styleProp] = styleValue
    span.appendChild(range.extractContents())
    range.insertNode(span)

    // 삽입한 span 내용을 다시 선택 상태로 만들어서 연속 서식 적용이 가능하게 함
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(newRange)
    savedRangeRef.current = newRange.cloneRange()

    handleInput()
  }

  const handleBold = () => {
    restoreSelection()
    document.execCommand('bold')
    handleInput()
  }

  const handleUnderline = () => {
    restoreSelection()
    document.execCommand('underline')
    handleInput()
  }

  const handleInsertLink = () => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      alert('링크를 걸 텍스트를 먼저 선택해주세요.')
      return
    }
    const url = window.prompt('연결할 링크 주소를 입력해주세요 (https:// 포함)')
    if (!url) return

    const range = sel.getRangeAt(0)
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.style.color = '#e6a800'
    a.style.textDecoration = 'underline'
    a.appendChild(range.extractContents())
    range.insertNode(a)

    handleInput()
  }

  const preventFocusLoss = (e: React.MouseEvent) => {
    e.preventDefault()
    saveSelection()
  }

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nanum+Gothic&family=Nanum+Myeongjo&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&family=Gaegu&display=swap"
      />

      {/* 툴바 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', background: '#f7f6f3', border: '1.5px solid #e5e3dc', borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={handleBold}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={handleUnderline}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 14, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          U
        </button>

        {/* 글자크기 — 커스텀 버튼형 드롭다운 (select 아님) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => { setSizeMenuOpen(v => !v); setFontMenuOpen(false) }}
            style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            글자크기 ▾
          </button>
          {sizeMenuOpen && (
            <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e3dc', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, minWidth: 90, maxHeight: 220, overflowY: 'auto' }}>
              {FONT_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onMouseDown={preventFocusLoss}
                  onClick={() => { wrapSelectionWithStyle('fontSize', `${size}px`); setSizeMenuOpen(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f6f3')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 글씨체 — 커스텀 버튼형 드롭다운 (select 아님) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => { setFontMenuOpen(v => !v); setSizeMenuOpen(false) }}
            style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            글씨체 ▾
          </button>
          {fontMenuOpen && (
            <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e3dc', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, minWidth: 130 }}>
              {FONT_FAMILIES.map(f => (
                <button
                  key={f.label}
                  type="button"
                  onMouseDown={preventFocusLoss}
                  onClick={() => { wrapSelectionWithStyle('fontFamily', f.value); setFontMenuOpen(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: f.value, fontSize: 14 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f6f3')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={handleInsertLink}
          style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🔗 링크
        </button>
      </div>

      {/* 본문 입력 영역 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        suppressContentEditableWarning
        style={{
          minHeight: 240, padding: '16px 18px', border: '1.5px solid #e5e3dc', borderRadius: '0 0 12px 12px',
          fontSize: 15, lineHeight: 1.8, color: '#222', outline: 'none', background: '#fff',
        }}
      />
    </div>
  )
}
