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
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  element.style.display = 'block'
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
  }
}
