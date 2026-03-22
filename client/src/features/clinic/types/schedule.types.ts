// ── Clinic schedule ──────────────────────────────────────────────────────────

export interface ClinicScheduleDto {
  id: string
  clinicId: string
  dayOfWeek: number   // 1=Luni ... 7=Duminică
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
}

// ── Doctor schedule ──────────────────────────────────────────────────────────

export interface DoctorScheduleDto {
  id: string | null
  clinicId: string
  doctorId: string
  doctorName: string
  specialtyName: string | null
  dayOfWeek: number | null
  startTime: string | null
  endTime: string | null
}

export interface DoctorDayDto {
  id: string
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

// ── Payloads ─────────────────────────────────────────────────────────────────

export interface UpsertClinicDayPayload {
  dayOfWeek: number
  isOpen: boolean
  openTime: string | null
  closeTime: string | null
}

export interface UpsertDoctorDayPayload {
  dayOfWeek: number
  startTime: string
  endTime: string
}
