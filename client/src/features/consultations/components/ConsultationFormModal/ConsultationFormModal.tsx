import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { consultationSchema, type ConsultationFormData } from '../../schemas/consultation.schema'
import type { ConsultationListDto, CreateConsultationPayload, UpdateConsultationPayload } from '../../types/consultation.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
import { toLocalDateISO } from '@/utils/format'
import styles from './ConsultationFormModal.module.scss'

interface PatientLookupDto {
  id: string
  fullName: string
  cnp: string
  phoneNumber: string | null
}

const CONSULTATION_STATUS_OPTIONS = [
  { value: 'c2000000-0000-0000-0000-000000000001', label: 'În lucru' },
  { value: 'c2000000-0000-0000-0000-000000000002', label: 'Finalizată' },
  { value: 'c2000000-0000-0000-0000-000000000003', label: 'Blocată' },
]

const DEFAULT_STATUS_ID = 'c2000000-0000-0000-0000-000000000001'

interface ConsultationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateConsultationPayload | UpdateConsultationPayload) => void
  isLoading: boolean
  editData: ConsultationListDto | null
  patientLookup: PatientLookupDto[]
  doctorLookup: DoctorLookupDto[]
  serverError?: string | null
}

export const ConsultationFormModal = ({
  isOpen, onClose, onSubmit, isLoading, editData,
  patientLookup, doctorLookup, serverError,
}: ConsultationFormModalProps) => {
  const isEdit = !!editData

  const { handleSubmit, reset, control } = useForm<ConsultationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(consultationSchema) as any,
    defaultValues: {
      patientId: '', doctorId: '', appointmentId: '',
      date: '', motiv: '', examenClinic: '',
      diagnostic: '', diagnosticCodes: '',
      recomandari: '', observatii: '', statusId: DEFAULT_STATUS_ID,
    },
  })

  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      reset({
        patientId: editData.patientId,
        doctorId: editData.doctorId,
        appointmentId: '',
        date: editData.date?.slice(0, 10) ?? '',
        motiv: '',
        examenClinic: '',
        diagnostic: editData.diagnostic ?? '',
        diagnosticCodes: editData.diagnosticCodes ?? '',
        recomandari: '',
        observatii: '',
        statusId: editData.statusId ?? '',
      })
    } else {
      reset({
        patientId: '', doctorId: '', appointmentId: '',
        date: toLocalDateISO(new Date()),
        motiv: '', examenClinic: '',
        diagnostic: '', diagnosticCodes: '',
        recomandari: '', observatii: '',
        statusId: DEFAULT_STATUS_ID,
      })
    }
  }, [isOpen, editData, reset])

  const handleFormSubmit = (data: ConsultationFormData) => {
    const payload: CreateConsultationPayload = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId || null,
      date: `${data.date}T00:00:00`,
      motiv: data.motiv || null,
      examenClinic: data.examenClinic || null,
      diagnostic: data.diagnostic || null,
      diagnosticCodes: data.diagnosticCodes || null,
      recomandari: data.recomandari || null,
      observatii: data.observatii || null,
      statusId: data.statusId || null,
    }
    onSubmit(isEdit ? { ...payload, id: editData!.id } : payload)
  }

  if (!isOpen) return null

  const footerContent = (
    <>
      <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
        Anulează
      </AppButton>
      <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
        {isEdit ? 'Salvează' : 'Adaugă'}
      </AppButton>
    </>
  )

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={700}
      title={isEdit ? 'Editează Consultație' : 'Consultație Nouă'}
      as="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      footer={footerContent}
      bodyClassName={styles.modalBody}
    >
      {serverError && (
        <div className="alert alert-danger py-2 mb-0" role="alert">{serverError}</div>
      )}

      {/* Pacient */}
      <div className="row g-3">
        <div className="col-md-6">
          <FormSelect<ConsultationFormData>
            name="patientId"
            control={control}
            label="Pacient"
            required
            options={patientLookup.map(p => ({
              value: p.id,
              label: `${p.fullName}${p.cnp ? ` (${p.cnp})` : ''}`,
            }))}
            allowFiltering
            showClearButton
            placeholder="Selectează pacient..."
          />
        </div>
        <div className="col-md-6">
          <FormSelect<ConsultationFormData>
            name="doctorId"
            control={control}
            label="Medic"
            required
            options={doctorLookup.map(d => ({
              value: d.id,
              label: `${d.fullName}${d.specialtyName ? ` (${d.specialtyName})` : ''}`,
            }))}
            allowFiltering
            showClearButton
            placeholder="Selectează medic..."
          />
        </div>
      </div>

      {/* Data + Status */}
      <div className="row g-3">
        <div className="col-md-6">
          <FormDatePicker<ConsultationFormData>
            name="date"
            control={control}
            label="Data consultației"
            required
          />
        </div>
        <div className="col-md-6">
          <FormSelect<ConsultationFormData>
            name="statusId"
            control={control}
            label="Status"
            options={CONSULTATION_STATUS_OPTIONS}
            showClearButton
          />
        </div>
      </div>

      {/* Motiv */}
      <div className="row g-3">
        <div className="col-12">
          <FormInput<ConsultationFormData>
            name="motiv"
            control={control}
            label="Motiv prezentare"
            placeholder="Descrieți motivul prezentării..."
            multiline
            rows={3}
          />
        </div>
      </div>

      {/* Examen clinic */}
      <div className="row g-3">
        <div className="col-12">
          <FormInput<ConsultationFormData>
            name="examenClinic"
            control={control}
            label="Examen clinic"
            placeholder="Examen obiectiv și subiectiv..."
            multiline
            rows={3}
          />
        </div>
      </div>

      {/* Diagnostic + coduri ICD-10 */}
      <div className="row g-3">
        <div className="col-md-6">
          <FormInput<ConsultationFormData>
            name="diagnostic"
            control={control}
            label="Diagnostic"
            placeholder="Diagnostic textual..."
            multiline
            rows={2}
          />
        </div>
        <div className="col-md-6">
          <FormInput<ConsultationFormData>
            name="diagnosticCodes"
            control={control}
            label="Coduri ICD-10"
            placeholder="ex: J18.9, J45.0..."
            multiline
            rows={2}
          />
        </div>
      </div>

      {/* Recomandări */}
      <div className="row g-3">
        <div className="col-12">
          <FormInput<ConsultationFormData>
            name="recomandari"
            control={control}
            label="Recomandări și tratament"
            placeholder="Tratament, medicație, recomandări..."
            multiline
            rows={3}
          />
        </div>
      </div>

      {/* Observații */}
      <div className="row g-3">
        <div className="col-12">
          <FormInput<ConsultationFormData>
            name="observatii"
            control={control}
            label="Observații suplimentare"
            placeholder="Observații (opțional)..."
            multiline
            rows={2}
          />
        </div>
      </div>
    </AppModal>
  )
}
