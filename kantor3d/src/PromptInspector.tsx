import { useEffect, useState } from 'react'

// Instruksi yang benar-benar dikirim engine ke model, untuk tugas yang sedang dipilih.
// Sumbernya `kantor/runs/<id>/prompts.ndjson` lewat GET /api/runs/:id/prompts —
// jadi yang ditampilkan adalah isi prompt asli, bukan rekonstruksi dari UI.

export interface PromptMessage { role: string; content: string }
export interface PromptEntry {
  at: string
  label: string
  taskId: string | null
  team: string | null
  role: string | null
  model: string | null
  title?: string
  reason?: string
  stage?: string
  taskIds?: string[]
  issues?: string[]
  blocking?: string[]
  notes?: string[]
  messages: PromptMessage[]
}

const LABEL: Record<string, string> = {
  plan: 'Rencana (CEO + Manager)',
  kerja: 'Kerja — spesialis',
  'revisi-qa': 'Revisi — gerbang QA',
  'revisi-review': 'Revisi — temuan reviewer',
  review: 'Review — reviewer independen',
}

/* Cache per run: isi instruksi tidak berubah lagi setelah run selesai. */
const cache = new Map<string, PromptEntry[]>()
const inflight = new Map<string, Promise<PromptEntry[]>>()

function loadPrompts(runId: string): Promise<PromptEntry[]> {
  const cached = cache.get(runId)
  if (cached) return Promise.resolve(cached)
  const pending = inflight.get(runId)
  if (pending) return pending
  const request = fetch(`/api/runs/${runId}/prompts`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((body: { prompts?: PromptEntry[] }) => {
      const prompts = body.prompts || []
      cache.set(runId, prompts)
      return prompts
    })
    .finally(() => { inflight.delete(runId) })
  inflight.set(runId, request)
  return request
}

function Attempt({ entry, latest }: { entry: PromptEntry; latest: boolean }) {
  const [open, setOpen] = useState(latest)
  const chars = entry.messages.reduce((sum, message) => sum + message.content.length, 0)
  const copy = () => {
    const text = entry.messages.map((message) => `[${message.role}]\n${message.content}`).join('\n\n')
    void navigator.clipboard?.writeText(text)
  }
  return <details className="prompt-entry" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>
      <span className={`prompt-tag tag-${entry.label}`}>{LABEL[entry.label] || entry.label}</span>
      <small>{new Date(entry.at).toLocaleTimeString('id-ID', { hour12: false })}{entry.model ? ` · ${entry.model}` : ''}</small>
      <span className="prompt-chars">{chars.toLocaleString('id-ID')} char</span>
    </summary>
    <div className="prompt-body">
      {entry.issues?.length ? <p className="prompt-note">Permintaan perbaikan dari gerbang QA: {entry.issues.join('; ')}</p> : null}
      {entry.blocking?.length ? <p className="prompt-note">Temuan reviewer yang diminta diperbaiki: {entry.blocking.join('; ')}</p> : null}
      {entry.messages.map((message, position) => <div key={position} className="prompt-msg">
        <b>{message.role === 'system' ? 'system prompt' : 'pesan user'}</b>
        <pre tabIndex={0}>{message.content}</pre>
      </div>)}
      <button type="button" className="prompt-copy" onClick={copy}>⧉ Salin instruksi</button>
    </div>
  </details>
}

export default function PromptInspector({ runId, taskId }: { runId: string | null; taskId?: string | null }) {
  const [state, setState] = useState<{ runId: string; prompts: PromptEntry[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!runId) return
    let alive = true
    setError('')
    loadPrompts(runId)
      .then((prompts) => { if (alive) setState({ runId, prompts }) })
      .catch((e: Error) => { if (alive) setError(String(e.message || e)) })
    return () => { alive = false }
  }, [runId])

  const prompts = state && state.runId === runId ? state.prompts : null
  const forTask = prompts && taskId
    ? prompts.filter((entry) => entry.taskId === taskId || (entry.taskIds || []).includes(taskId))
    : []
  const plan = (prompts || []).filter((entry) => entry.label === 'plan')

  return <section className="prompt">
    <h4>Instruksi ke model {taskId ? <span>{taskId}</span> : null}</h4>
    {error && <p className="prompt-note bad">Tidak bisa memuat instruksi: {error}</p>}
    {!error && !prompts && <p className="prompt-note">Memuat instruksi…</p>}
    {prompts && !forTask.length && <p className="prompt-note">
      {prompts.length
        ? (plan.length
          ? 'Tim ini belum memegang tugas di run ini — instruksi perencana ditampilkan sebagai konteks.'
          : `Tidak ada instruksi tersimpan untuk ${taskId || 'tim ini'} di run ini.`)
        : 'Run ini dijalankan sebelum perekaman instruksi aktif, jadi prompt-nya tidak tersimpan.'}
    </p>}
    {forTask.map((entry, index) => <Attempt key={`${entry.label}-${entry.at}`} entry={entry} latest={index === forTask.length - 1}/>)}
    {!forTask.length && plan.map((entry, index) => <Attempt key={`plan-${entry.at}`} entry={entry} latest={index === plan.length - 1}/>)}
  </section>
}
