// Subset dari tipe `ruang` (MIT) yang dipakai scene 3D: kantor ini memetakan tim
// engine 9router ke bentuk OfficeStation yang sama, jadi scene tidak perlu diubah.
export type Availability = 'available' | 'unavailable'
export interface Source<T> { availability: Availability; data: T; error?: { code: string; message: string } }

export type OfficeState = 'Idle' | 'Working' | 'Reviewing' | 'Collaborating' | 'Offline' | 'Unknown'
export type OfficeRoom = 'Workspace' | 'Lounge'

export interface OfficeStation {
  /** Slug tim engine, mis. `it` atau `keuangan`. */
  id: string
  privacy?: 'locked' | 'unlocked'
  name: string
  role: string
  room: OfficeRoom
  roomPosition: string
  state: OfficeState
  currentTask: string
  recentActivity: string
  activity: string
  seat: number
  /** Tugas terakhir tim ini di run terakhir — kunci untuk menampilkan instruksi kerjanya. */
  taskId?: string | null
  provenance?: string
  freshness?: string
}
