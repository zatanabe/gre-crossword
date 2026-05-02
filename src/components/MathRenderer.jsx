import { useRef, useEffect } from 'react'
import katex from 'katex'

export default function MathRenderer({ tex, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !tex) return
    try {
      katex.render(tex, ref.current, {
        throwOnError: false,
        displayMode: true,
        trust: true,
      })
    } catch {
      ref.current.textContent = tex
    }
  }, [tex])

  return <span ref={ref} className={className} />
}

const INLINE_RE = /\$(.+?)\$/g

export function MathText({ text, className = '' }) {
  if (!text) return null
  if (!text.includes('$')) return <span className={className}>{text}</span>

  const parts = []
  let last = 0
  let match
  const re = new RegExp(INLINE_RE)
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) })
    }
    parts.push({ type: 'math', value: match[1] })
    last = re.lastIndex
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.type === 'text' ? (
          <span key={i}>{p.value}</span>
        ) : (
          <InlineMath key={i} tex={p.value} />
        )
      )}
    </span>
  )
}

function InlineMath({ tex }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      ref.current.textContent = tex
    }
  }, [tex])
  return <span ref={ref} />
}
