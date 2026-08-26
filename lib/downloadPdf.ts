'use client'

// PDF 다운로드를 여러 화면(PaidResult, 마이페이지)에서 각자 구현하다가
// display:none → block 전환 직후 바로 캡처를 시작해버려서 브라우저가
// 레이아웃/페인트를 끝내기 전 상태(빈 화면 또는 일부만 그려진 상태)가
// 찍히는 문제가 있었다. 이 함수 하나로 통일해서 그 문제가 다시 생기지
// 않게 한다 — 새로 PDF 다운로드 버튼을 추가할 일이 있으면 반드시 이
// 함수를 재사용할 것 (복붙해서 새로 만들지 말 것).
export async function downloadElementAsPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  // html2pdf.js CDN 로드 (이미 로드돼 있으면 스킵)
  if (!(window as any).html2pdf) {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    document.head.appendChild(script)
    await new Promise(resolve => { script.onload = resolve })
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    // scrollX/scrollY를 명시적으로 0으로 고정 — 안 그러면 html2canvas가
    // 캡처 시점의 window 스크롤 위치를 기준으로 좌표를 잡아서, 페이지를
    // 스크롤한 상태(예: 마이페이지에서 히스토리를 한참 내려가서 카드를
    // 펼친 뒤 다운로드)에서는 캡처 결과 맨 위에 스크롤한 만큼 빈 여백이
    // 찍히고 그만큼 아래 내용이 밀려 페이지 수도 늘어난다.
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  const originalScrollX = window.scrollX
  const originalScrollY = window.scrollY

  element.style.display = 'block'
  // 위 scrollX/scrollY 옵션과 짝을 맞춰 실제 window 스크롤도 맨 위로
  // 옮겨둔다 (옵션만으로는 일부 html2canvas 버전에서 완전히 상쇄되지
  // 않는 경우가 있어 이중으로 방어).
  window.scrollTo(0, 0)
  // 강제 리플로우 + 이중 requestAnimationFrame으로 실제 페인트가 끝날
  // 때까지 기다린 다음 캡처한다 (곧바로 캡처하면 레이아웃이 안 끝난
  // 상태가 찍힐 수 있음).
  void element.offsetHeight
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  try {
    await (window as any).html2pdf().set(opt).from(element).save()
  } finally {
    element.style.display = 'none'
    window.scrollTo(originalScrollX, originalScrollY)
  }
}
