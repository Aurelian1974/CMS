import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import type { Path, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema, type PatientFormData } from '../../schemas/patient.schema'
import type { PatientFullDetailDto } from '../../types/patient.types'
import type { NomenclatureItem } from '@/types/common.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import { AppModal } from '@/components/ui/AppModal'
import type { ModalTab } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormPhoneInput } from '@/components/forms/FormPhoneInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
import { AddressFields } from '@/components/forms/AddressFields'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { parseCnp } from '@/utils/cnp'
import styles from './PatientFormModal.module.scss'

// ── Icoane inline ─────────────────────────────────────────────────────────────
const IconPlus   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>

type FormTab = 'personal' | 'contact' | 'medical' | 'doctors' | 'notes'

/** Maps every form field name to the tab where it is rendered. */
const FIELD_TAB: Partial<Record<keyof PatientFormData, FormTab>> = {
  firstName: 'personal', lastName: 'personal', cnp: 'personal',
  birthDate: 'personal', genderId: 'personal', bloodTypeId: 'personal',
  phoneNumber: 'contact', secondaryPhone: 'contact', email: 'contact',
  address: 'contact', city: 'contact', county: 'contact', postalCode: 'contact',
  familyDoctorName: 'medical', chronicDiseases: 'medical',
  insuranceNumber: 'medical', insuranceExpiry: 'medical', isInsured: 'medical', allergies: 'medical',
  doctors: 'doctors', emergencyContacts: 'doctors',
  notes: 'notes', isActive: 'notes',
}

const TAB_ORDER: FormTab[] = ['personal', 'contact', 'medical', 'doctors', 'notes']

const TABS: ModalTab[] = [
  { key: 'personal', label: 'Date personale' },
  { key: 'contact',  label: 'Contact & Adresă' },
  { key: 'medical',  label: 'Medical & Asigurare' },
  { key: 'doctors',  label: 'Medici & Contacte' },
  { key: 'notes',    label: 'Note' },
]

/// Valorile de pornire pentru un pacient nou.
const EMPTY_FORM: PatientFormData = {
  firstName: '', lastName: '', cnp: '',
  birthDate: '', genderId: '', bloodTypeId: '',
  phoneNumber: '', secondaryPhone: '', email: '', address: '',
  city: '', county: '', postalCode: '',
  insuranceNumber: '', insuranceExpiry: '',
  isInsured: false, chronicDiseases: '', familyDoctorName: '',
  notes: '',
  isActive: true,
  allergies: [],
  doctors: [],
  emergencyContacts: [],
}

interface PatientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PatientFormData) => void
  isLoading: boolean
  /**
   * Datele COMPLETE ale pacientului la editare (pacient + alergii + medici + contacte).
   * Backend-ul sincronizează integral sub-colecțiile, deci formularul trebuie populat
   * din răspunsul `GET /Patients/{id}` — altfel salvarea ar șterge datele necompletate.
   */
  editData: PatientFullDetailDto | null
  /** `true` cât timp detaliile pacientului se încarcă — formularul e blocat. */
  isLoadingData?: boolean
  genders: NomenclatureItem[]
  bloodTypes: NomenclatureItem[]
  allergyTypes: NomenclatureItem[]
  allergySeverities: NomenclatureItem[]
  doctorLookup: DoctorLookupDto[]
  serverError?: string | null
}

export const PatientFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  isLoadingData = false,
  genders,
  bloodTypes,
  allergyTypes,
  allergySeverities,
  doctorLookup,
  serverError,
}: PatientFormModalProps) => {
  const isEdit = !!editData || isLoadingData
  const [activeTab, setActiveTab] = useState<FormTab>('personal')

  /** When validation fails, navigate to the first tab that contains an error. */
  const handleInvalidSubmit = (errors: FieldErrors<PatientFormData>) => {
    const errorKeys = Object.keys(errors) as (keyof PatientFormData)[]
    for (const tab of TAB_ORDER) {
      if (errorKeys.some(k => FIELD_TAB[k] === tab)) {
        setActiveTab(tab)
        break
      }
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PatientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patientSchema) as any,
    defaultValues: EMPTY_FORM,
  })

  // Field arrays
  const { fields: allergyFields, append: addAllergy, remove: removeAllergy } = useFieldArray({
    control, name: 'allergies',
  })

  const { fields: doctorFields, append: addDoctor, remove: removeDoctor } = useFieldArray({
    control, name: 'doctors',
  })

  const { fields: contactFields, append: addContact, remove: removeContact } = useFieldArray({
    control, name: 'emergencyContacts',
  })

  // Populare la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return
    setActiveTab('personal')

    if (!editData) {
      reset(EMPTY_FORM)
      return
    }

    const p = editData.patient
    reset({
      firstName:          p.firstName,
      lastName:           p.lastName,
      cnp:                p.cnp,
      birthDate:          p.birthDate?.slice(0, 10) ?? '',
      genderId:           p.genderId ?? '',
      bloodTypeId:        p.bloodTypeId ?? '',
      phoneNumber:        p.phoneNumber ?? '',
      secondaryPhone:     p.secondaryPhone ?? '',
      email:              p.email ?? '',
      address:            p.address ?? '',
      city:               p.city ?? '',
      county:             p.county ?? '',
      postalCode:         p.postalCode ?? '',
      insuranceNumber:    p.insuranceNumber ?? '',
      insuranceExpiry:    p.insuranceExpiry?.slice(0, 10) ?? '',
      isInsured:          p.isInsured,
      chronicDiseases:    p.chronicDiseases ?? '',
      familyDoctorName:   p.familyDoctorName ?? '',
      notes:              p.notes ?? '',
      isActive:           p.isActive,
      // Sub-colecțiile sunt sincronizate integral la salvare — trebuie populate
      // cu valorile existente, altfel salvarea le-ar dezactiva în baza de date.
      allergies: editData.allergies.map(a => ({
        allergyTypeId:     a.allergyTypeId,
        allergySeverityId: a.allergySeverityId,
        allergenName:      a.allergenName,
        reaction:          a.reaction ?? '',
        onsetDate:         a.onsetDate?.slice(0, 10) ?? '',
        notes:             a.notes ?? '',
      })),
      doctors: editData.doctors.map(d => ({
        doctorId:  d.doctorId,
        isPrimary: d.isPrimary,
        notes:     d.notes ?? '',
      })),
      emergencyContacts: editData.emergencyContacts.map(ec => ({
        fullName:     ec.fullName,
        relationship: ec.relationship ?? '',
        phoneNumber:  ec.phoneNumber ?? '',
        isDefault:    ec.isDefault,
        notes:        ec.notes ?? '',
      })),
    })
  }, [isOpen, editData, reset])

  // ── Auto-completare din CNP ────────────────────────────────────────────────
  // CNP-ul codifică data nașterii și genul; le completăm doar dacă sunt încă goale,
  // ca să nu suprascriem o corecție manuală.
  const cnpValue = useWatch({ control, name: 'cnp' })

  useEffect(() => {
    const { birthDate, genderCode } = parseCnp(cnpValue)

    if (birthDate && !getValues('birthDate')) {
      setValue('birthDate', birthDate, { shouldDirty: true })
    }

    if (genderCode && !getValues('genderId')) {
      const gender = genders.find(g => g.code === genderCode)
      if (gender) setValue('genderId', gender.id, { shouldDirty: true })
    }
  }, [cnpValue, genders, getValues, setValue])

  if (!isOpen) return null

  const footerContent = (
    <>
      <AppButton
        variant="outline-secondary"
        onClick={onClose}
        disabled={isLoading}
      >
        Anulează
      </AppButton>
      <AppButton
        type="submit"
        variant="primary"
        isLoading={isLoading}
        loadingText="Se salvează..."
        disabled={isLoadingData}
      >
        {isEdit ? 'Salvează' : 'Adaugă'}
      </AppButton>
    </>
  )

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={1000}
      title={isEdit ? 'Editează Pacient' : 'Pacient Nou'}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(key) => setActiveTab(key as FormTab)}
      as="form"
      onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
      footer={footerContent}
      containerQuery
      bodyClassName={styles.modalBody}
    >

            {/* Eroare server */}
            {serverError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">{serverError}</div>
            )}

            {/* Datele complete ale pacientului încă se încarcă — nu permitem editarea
                unui formular incomplet, fiindcă salvarea sincronizează sub-colecțiile. */}
            {isLoadingData && (
              <div className="d-flex flex-column align-items-center justify-content-center gap-2" style={{ minHeight: 260 }}>
                <LoadingSpinner />
                <span className={styles.emptyHint}>Se încarcă datele pacientului...</span>
              </div>
            )}

            {/* ═══════════ TAB 1: Date personale ═══════════ */}
            {!isLoadingData && activeTab === 'personal' && (
              <>
                <div className="row g-3">
                  <div className="col-md-6">
                    <FormInput<PatientFormData>
                      name="lastName"
                      control={control}
                      label="Nume"
                      placeholder="ex: Popescu"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <FormInput<PatientFormData>
                      name="firstName"
                      control={control}
                      label="Prenume"
                      placeholder="ex: Ion"
                      required
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <FormInput<PatientFormData>
                      name="cnp"
                      control={control}
                      label="CNP"
                      placeholder="13 cifre"
                      maxLength={13}
                      required
                    />
                    {!errors.cnp && (
                      <span className={styles.fieldHint}>
                        Data nașterii și genul se completează automat.
                      </span>
                    )}
                  </div>
                  <div className="col-md-4">
                    <FormDatePicker<PatientFormData>
                      name="birthDate"
                      control={control}
                      label="Data nașterii"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormSelect<PatientFormData>
                      name="genderId"
                      control={control}
                      label="Gen"
                      options={genders.map(g => ({ value: g.id, label: g.name }))}
                      showClearButton
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <FormSelect<PatientFormData>
                      name="bloodTypeId"
                      control={control}
                      label="Grupă sanguină"
                      options={bloodTypes.map(b => ({ value: b.id, label: b.name }))}
                      showClearButton
                    />
                  </div>
                </div>
              </>
            )}

            {/* ═══════════ TAB 2: Contact & Adresă ═══════════ */}
            {!isLoadingData && activeTab === 'contact' && (
              <>
                <div className="row g-3">
                  <div className="col-md-4">
                    <FormPhoneInput<PatientFormData>
                      name="phoneNumber"
                      control={control}
                      label="Telefon"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormPhoneInput<PatientFormData>
                      name="secondaryPhone"
                      control={control}
                      label="Telefon secundar"
                    />
                  </div>
                  <div className="col-md-4">
                    <FormInput<PatientFormData>
                      name="email"
                      control={control}
                      label="Email"
                      type="email"
                      placeholder="pacient@email.ro"
                    />
                  </div>
                </div>

                <AddressFields<PatientFormData>
                  control={control}
                  setValue={setValue}
                />
              </>
            )}

            {/* ═══════════ TAB 3: Medical & Asigurare ═══════════ */}
            {!isLoadingData && activeTab === 'medical' && (
              <>
                {/* Date medicale */}
                <div className={styles.section}>
                  <h6 className={styles.sectionTitle}>Date medicale</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <FormInput<PatientFormData>
                        name="familyDoctorName"
                        control={control}
                        label="Medic de familie"
                        placeholder="Dr. Popescu Ion"
                      />
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <FormInput<PatientFormData>
                        name="chronicDiseases"
                        control={control}
                        label="Boli cronice"
                        placeholder="Diabet, hipertensiune arterială..."
                        multiline
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Asigurare */}
                <div className={styles.section}>
                  <h6 className={styles.sectionTitle}>Asigurare</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <FormInput<PatientFormData>
                        name="insuranceNumber"
                        control={control}
                        label="Nr. asigurare"
                        placeholder="Nr. asigurare"
                      />
                    </div>
                    <div className="col-md-4">
                      <FormDatePicker<PatientFormData>
                        name="insuranceExpiry"
                        control={control}
                        label="Asigurare expiră"
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className={styles.formGroup}>
                        <div className="form-check form-switch">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isInsured"
                            {...register('isInsured')}
                          />
                          <label className="form-check-label" htmlFor="isInsured">Asigurat CNAS</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alergii */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>Alergii</h6>
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => addAllergy({ allergyTypeId: '', allergySeverityId: '', allergenName: '', reaction: '', onsetDate: '', notes: '' })}
                    >
                      <IconPlus /> Adaugă alergie
                    </button>
                  </div>

                  {allergyFields.length === 0 && (
                    <p className={styles.emptyHint}>Nicio alergie înregistrată.</p>
                  )}

                  {allergyFields.map((field, idx) => (
                    <div key={field.id} className={styles.arrayRow}>
                      <div className="row g-2 flex-grow-1">
                        <div className="col-md-3">
                          <select
                            className={`form-select form-select-sm${errors.allergies?.[idx]?.allergyTypeId ? ' is-invalid' : ''}`}
                            {...register(`allergies.${idx}.allergyTypeId`)}
                          >
                            <option value="">Tip alergie</option>
                            {allergyTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          {errors.allergies?.[idx]?.allergyTypeId && (
                            <span className={styles.error}>{errors.allergies[idx].allergyTypeId?.message}</span>
                          )}
                        </div>
                        <div className="col-md-3">
                          <select
                            className={`form-select form-select-sm${errors.allergies?.[idx]?.allergySeverityId ? ' is-invalid' : ''}`}
                            {...register(`allergies.${idx}.allergySeverityId`)}
                          >
                            <option value="">Severitate</option>
                            {allergySeverities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          {errors.allergies?.[idx]?.allergySeverityId && (
                            <span className={styles.error}>{errors.allergies[idx].allergySeverityId?.message}</span>
                          )}
                        </div>
                        <div className="col-md-3">
                          <input
                            type="text"
                            className={`form-control form-control-sm${errors.allergies?.[idx]?.allergenName ? ' is-invalid' : ''}`}
                            placeholder="Alergen"
                            {...register(`allergies.${idx}.allergenName`)}
                          />
                        </div>
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Note (opțional)"
                            {...register(`allergies.${idx}.notes`)}
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Reacție (opțional)"
                            {...register(`allergies.${idx}.reaction`)}
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            placeholder="Data debut (opțional)"
                            {...register(`allergies.${idx}.onsetDate`)}
                          />
                        </div>
                      </div>
                      <button type="button" className={styles.removeBtn} onClick={() => removeAllergy(idx)}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ═══════════ TAB 4: Medici & Contacte ═══════════ */}
            {!isLoadingData && activeTab === 'doctors' && (
              <>
                {/* Medici asociați */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>Medici asociați</h6>
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => addDoctor({ doctorId: '', isPrimary: false, notes: '' })}
                    >
                      <IconPlus /> Adaugă medic
                    </button>
                  </div>

                  {doctorFields.length === 0 && (
                    <p className={styles.emptyHint}>Niciun medic asociat.</p>
                  )}

                  {doctorFields.map((field, idx) => (
                    <div key={field.id} className={styles.arrayRow}>
                      <div className="row g-2 flex-grow-1">
                        <div className="col-md-7">
                          <select
                            className={`form-select form-select-sm${errors.doctors?.[idx]?.doctorId ? ' is-invalid' : ''}`}
                            {...register(`doctors.${idx}.doctorId`)}
                          >
                            <option value="">— Selectează medic —</option>
                            {doctorLookup.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.fullName}{d.specialtyName ? ` (${d.specialtyName})` : ''}
                              </option>
                            ))}
                          </select>
                          {errors.doctors?.[idx]?.doctorId && (
                            <span className={styles.error}>{errors.doctors[idx].doctorId?.message}</span>
                          )}
                        </div>
                        <div className="col-md-5 d-flex align-items-center">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`doctor-primary-${idx}`}
                              {...register(`doctors.${idx}.isPrimary`)}
                            />
                            <label className="form-check-label" htmlFor={`doctor-primary-${idx}`}
                              style={{ fontSize: '0.8rem', color: '#6E8090' }}
                            >
                              Medic primar
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Note (opțional)"
                            {...register(`doctors.${idx}.notes`)}
                          />
                        </div>
                      </div>
                      <button type="button" className={styles.removeBtn} onClick={() => removeDoctor(idx)}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Contacte urgență */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>Contacte urgență</h6>
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => addContact({ fullName: '', relationship: '', phoneNumber: '', isDefault: false, notes: '' })}
                    >
                      <IconPlus /> Adaugă contact
                    </button>
                  </div>

                  {contactFields.length === 0 && (
                    <p className={styles.emptyHint}>Niciun contact de urgență.</p>
                  )}

                  {contactFields.map((field, idx) => (
                    <div key={field.id} className={styles.arrayRow}>
                      <div className="row g-2 flex-grow-1">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className={`form-control form-control-sm${errors.emergencyContacts?.[idx]?.fullName ? ' is-invalid' : ''}`}
                            placeholder="Nume complet"
                            {...register(`emergencyContacts.${idx}.fullName`)}
                          />
                        </div>
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Relație (ex: soț)"
                            {...register(`emergencyContacts.${idx}.relationship`)}
                          />
                        </div>
                        <div className="col-md-3">
                          <FormPhoneInput<PatientFormData>
                            name={`emergencyContacts.${idx}.phoneNumber` as Path<PatientFormData>}
                            control={control}
                          />
                        </div>
                        <div className="col-md-2 d-flex align-items-center">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`contact-default-${idx}`}
                              {...register(`emergencyContacts.${idx}.isDefault`)}
                            />
                            <label className="form-check-label" htmlFor={`contact-default-${idx}`}
                              style={{ fontSize: '0.75rem', color: '#6E8090' }}
                            >
                              Principal
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Note (opțional)"
                            {...register(`emergencyContacts.${idx}.notes`)}
                          />
                        </div>
                      </div>
                      <button type="button" className={styles.removeBtn} onClick={() => removeContact(idx)}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ═══════════ TAB 5: Note & Status ═══════════ */}
            {!isLoadingData && activeTab === 'notes' && (
              <>
                <FormInput<PatientFormData>
                  name="notes"
                  control={control}
                  label="Note"
                  placeholder="Observații generale (opțional)"
                  multiline
                  rows={4}
                />

                {isEdit && (
                  <div className={styles.formGroup}>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="patientIsActive"
                        {...register('isActive')}
                      />
                      <label className="form-check-label" htmlFor="patientIsActive">Pacient activ</label>
                    </div>
                  </div>
                )}
              </>
            )}

    </AppModal>
  )
}
