import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Office3D from './pages/Office3D.tsx'
import PromptInspector from './PromptInspector.tsx'
import type { OfficeStation } from './types.ts'

// Kantor AI 3D: scene dari `ruang` (MIT, lihat LICENSE-ruang) digerakkan data
// engine 9router lewat /api/office3d. Tidak ada state agen yang dikarang di sini —
// setiap status berasal dari event run (task.start / artifact.ready / review.ready).

interface RunInfo {
  id: string
  goal: string
  status: string
  active: boolean
  createdAt: string
  finishedAt?: string
  durationMs?: number
  artifacts: number
  provider?: string
  model?: string
  mocked?: boolean
  qa: { pass: boolean; degraded: boolean; blocking: number } | null
}
interface LogLine { seq: number; time: string; team: string; text: string }
interface Snapshot {
  provider: string
  model: string
  mocked: boolean
  run: RunInfo | null
  stations: OfficeStation[]
  log: LogLine[]
  summary: { teams: number; working: number; idle: number; artifacts: number }
  runs: number
  fetchedAt: string
}

const POLL_MS = 2500
const STATUS_TEXT: Record<string, string> = {
  running: 'Berjalan',
  done: 'Selesai — QA lulus',
  needs_attention: 'Selesai — QA perlu perbaikan',
  error: 'Gagal',
  cancelled: 'Dibatalkan',
}

function duration(ms: number | undefined) {
  if (!ms || ms < 0) return '—'
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`
}

function useTheme(): ['dark' | 'light', () => void] {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('kantor3d.theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  return [theme, () => setTheme((value) => {
    const next = value === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('kantor3d.theme', next) } catch { /* preferensi lokal saja */ }
    return next
  })]
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string>('')
  const [notice, setNotice] = useState<string>('')
  const [goal, setGoal] = useState('')
  const [project, setProject] = useState('')
  const [mock, setMock] = useState(false)
  const [starting, setStarting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, toggleTheme] = useTheme()
  const inflight = useRef(false)

  const refresh = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    try {
      const res = await fetch('/api/office3d', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSnapshot(await res.json() as Snapshot)
      setError('')
    } catch (e) {
      setError(`Tidak bisa membaca /api/office3d — ${String((e as Error).message || e)}`)
    } finally {
      inflight.current = false
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => { if (document.visibilityState !== 'hidden') void refresh() }, POLL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])

  const run = snapshot?.run ?? null
  const stations = snapshot?.stations ?? []
  const selected = useMemo(() => stations.find((station) => station.id === selectedId) ?? null, [stations, selectedId])

  async function startRun(event: React.FormEvent) {
    event.preventDefault()
    const text = goal.trim()
    if (text.length < 8) { setNotice('Tujuan minimal 8 karakter.'); return }
    setStarting(true); setNotice('')
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: text, project: project.trim() || undefined, mock }),
      })
      const body = await res.json() as { runId?: string; error?: string; code?: string }
      if (!res.ok) {
        setNotice(body.code === 'NO_CREDENTIALS'
          ? 'Belum ada kredensial model. Isi .env (ZR_API_KEY/ZR_API_BASE) lalu restart server, atau centang mock untuk uji alur.'
          : (body.error || `HTTP ${res.status}`))
        return
      }
      setNotice(`Run ${body.runId} dimulai.`)
      await refresh()
    } catch (e) {
      setNotice(String((e as Error).message || e))
    } finally {
      setStarting(false)
    }
  }

  async function cancelRun() {
    if (!run) return
    await fetch(`/api/runs/${run.id}/cancel`, { method: 'POST' }).catch(() => {})
    setNotice(`Pembatalan diminta untuk ${run.id}.`)
    void refresh()
  }

  const working = snapshot?.summary.working ?? 0

  return <div className="app">
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">▚</span>
        <div>
          <b>KANTOR AI</b>
          <small>ruang 3D · engine 9router</small>
        </div>
      </div>
      <div className="chips">
        <span className={`chip ${snapshot?.provider && snapshot.provider !== 'unset' ? 'on' : 'off'}`} title="Provider dari engine/config.cjs">
          {snapshot?.provider || 'memuat…'}
        </span>
        <span className="chip mono" title="Model yang dipakai run terakhir">{snapshot?.model || '—'}</span>
        <span className={`chip ${run?.active ? 'on' : 'off'}`}>{run?.active ? 'run aktif' : 'siaga'}</span>
      </div>
      <div className="header-actions">
        <a className="link" href="/live">Konsol live</a>
        <a className="link" href="/office.html">Arsip kantor lama</a>
        <button type="button" className="icon-button" onClick={toggleTheme} title="Ganti siang/malam">
          {theme === 'dark' ? '☾' : '☀'}
        </button>
      </div>
    </header>

    <form className="controls" onSubmit={startRun}>
      <input
        className="goal"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        placeholder="Tujuan untuk kantor, mis. “Susun rencana harga dan materi kampanye POS Kolaka”"
        aria-label="Tujuan run"
        maxLength={2000}
      />
      <input className="project" value={project} onChange={(event) => setProject(event.target.value)} placeholder="proyek (opsional)" aria-label="Nama proyek" maxLength={60}/>
      <label className="mock"><input type="checkbox" checked={mock} onChange={(event) => setMock(event.target.checked)}/> mock</label>
      {run?.active
        ? <button type="button" className="danger" onClick={cancelRun}>Batalkan</button>
        : <button type="submit" className="primary" disabled={starting}>{starting ? 'Mengirim…' : 'Jalankan'}</button>}
    </form>

    {(notice || error) && <div className={`banner ${error ? 'bad' : ''}`}>{error || notice}</div>}

    <main className="stage">
      <div className="canvas-wrap">
        {stations.length
          ? <Office3D stations={stations} onSelect={(station) => setSelectedId(station.id)}/>
          : <div className="loading">{snapshot ? 'Menyiapkan kantor…' : 'Menghubungkan ke engine…'}</div>}
      </div>

      <div className="hud">
        <div className="hud-run">
          <small>{run ? run.id : 'belum ada run'}</small>
          <b>{run ? run.goal : 'Kantor kosong — jalankan tujuan pertama.'}</b>
        </div>
        <div className="hud-stats">
          <span><i className="dot working"/>{working} bekerja</span>
          <span><i className="dot idle"/>{snapshot?.summary.idle ?? 0} siaga</span>
          <span>{snapshot?.summary.artifacts ?? 0} artefak</span>
          {run?.status && <span className={`state-${run.status}`}>{STATUS_TEXT[run.status] || run.status}</span>}
          {run?.mocked && <span className="qa-warn">mock — bukan hasil produksi</span>}
          {run?.qa && <span className={run.qa.pass ? 'qa-pass' : 'qa-warn'}>{run.qa.pass ? 'QA lulus' : `QA: ${run.qa.blocking} temuan`}</span>}
          {run && <span>{duration(run.durationMs)}</span>}
        </div>
      </div>

      <aside className="crew" aria-label="Kru kantor">
        <h2>Kru <span>{stations.length}</span></h2>
        <ul>
          {stations.map((station) => <li key={station.id}>
            <button type="button" className={station.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(station.id)}>
              <i className={`dot ${station.state === 'Working' ? 'working' : 'idle'}`}/>
              <span className="crew-name">{station.name}</span>
              <span className={`badge ${station.state === 'Working' ? 'good' : 'muted'}`}>{station.state === 'Working' ? 'bekerja' : 'siaga'}</span>
              <small>{station.activity || station.role}</small>
            </button>
          </li>)}
        </ul>
        <h2>Log <span>{snapshot?.log.length ?? 0}</span></h2>
        <ol className="log">
          {(snapshot?.log ?? []).slice(0, 12).map((line) => <li key={line.seq}>
            <small>{line.time}</small>
            <span><b>{line.team}</b> {line.text}</span>
          </li>)}
        </ol>
      </aside>

      {selected && <div className="detail" role="dialog" aria-label={`Detail ${selected.name}`}>
        <header>
          <div>
            <small>{selected.id} · kursi {selected.seat}</small>
            <h3>{selected.name}</h3>
            <p>{selected.role}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => setSelectedId(null)} aria-label="Tutup detail">✕</button>
        </header>
        <dl>
          <dt>Status</dt><dd>{selected.state}</dd>
          <dt>Ruang</dt><dd>{selected.room === 'Workspace' ? 'Meja kerja' : 'Lounge / area istirahat'}</dd>
          <dt>Tugas</dt><dd>{selected.currentTask || '—'}</dd>
          <dt>Aktivitas</dt><dd>{selected.activity || selected.recentActivity || '—'}</dd>
        </dl>
        <PromptInspector runId={run ? run.id : null} taskId={selected.taskId}/>
        {run && <p className="detail-run">{run.id} · {STATUS_TEXT[run.status] || run.status}</p>}
      </div>}
    </main>

    <footer className="foot">
      <span>Klik meja atau kru untuk melihat instruksi ke model · seret memutar · seret kanan menggeser · gulir zoom · Page Up/Down ganti lantai</span>
      <span>Scene: ruang (MIT) · Data: engine 9router</span>
    </footer>
  </div>
}
