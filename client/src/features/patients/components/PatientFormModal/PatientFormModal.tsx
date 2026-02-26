import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema, type PatientFormData } from '../../schemas/patient.schema'
import type { PatientDto } from '../../types/patient.types'
import type { NomenclatureItem } from '@/types/common.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import styles from './PatientFormModal.module.scss'

// ── Icoane inline ─────────────────────────────────────────────────────────────
const IconPlus   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>

interface PatientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PatientFormData) => void
  isLoading: boolean
  editData: PatientDto | null
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
  genders,
  bloodTypes,
  allergyTypes,
  allergySeverities,
  doctorLookup,
  serverError,
}: PatientFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
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
    },
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

    if (editData) {
      reset({
        firstName:          editData.firstName,
        lastName:           editData.lastName,
        cnp:                editData.cnp,
        birthDate:          editData.birthDate?.slice(0, 10) ?? '',
        genderId:           editData.genderId ?? '',
        bloodTypeId:        editData.bloodTypeId ?? '',
        phoneNumber:        editData.phoneNumber ?? '',
        secondaryPhone:     '',
        email:              editData.email ?? '',
        address:            editData.address ?? '',
        city:               '',
        county:             '',
        postalCode:         '',
        insuranceNumber:    editData.insuranceNumber ?? '',
        insuranceExpiry:    editData.insuranceExpiry?.slice(0, 10) ?? '',
        isInsured:          false,
        chronicDiseases:    '',
        familyDoctorName:   '',
        notes:              '',
        isActive:           editData.isActive,
        allergies:          [],
        doctors:            [],
        emergencyContacts:  [],
      })
    } else {
      reset({
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
      })
    }
  }, [isOpen, editData, reset])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Pacient' : 'Pacient Nou'}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>

            {/* Eroare server */}
            {serverError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">{serverError}</div>
            )}

            {/* ═══════════ SECȚIUNEA 1: Date personale ═══════════ */}
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Date personale</h6>

              {/* Nume + Prenume */}
              <div className="row g-3">
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nume <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      className={`form-control${errors.lastName ? ' is-invalid' : ''}`}
                      placeholder="ex: Popescu"
                      {...register('lastName')}
                    />
                    {errors.lastName && <span className={styles.error}>{errors.lastName.message}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Prenume <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      className={`form-control${errors.firstName ? ' is-invalid' : ''}`}
                      placeholder="ex: Ion"
                      {...register('firstName')}
                    />
                    {errors.firstName && <span className={styles.error}>{errors.firstName.message}</span>}
                  </div>
                </div>
              </div>

              {/* CNP + Data naștere + Gen */}
              <div className="row g-3">
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>CNP <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      className={`form-control${errors.cnp ? ' is-invalid' : ''}`}
                      placeholder="13 cifre"
                      maxLength={13}
                      {...register('cnp')}
                    />
                    {errors.cnp && <span className={styles.error}>{errors.cnp.message}</span>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Data nașterii</label>
                    <input
                      type="date"
                      className={`form-control${errors.birthDate ? ' is-invalid' : ''}`}
                      {...register('birthDate')}
                    />
                    {errors.birthDate && <span className={styles.error}>{errors.birthDate.message}</span>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Gen</label>
                    <select className="form-select" {...register('genderId')}>
                      <option value="">— Selectează —</option>
                      {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Grupă sanguină */}
              <div className="row g-3">
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Grupă sanguină</label>
                    <select className="form-select" {...register('bloodTypeId')}>
                      <option value="">— Selectează —</option>
                      {bloodTypes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════ SECȚIUNEA 2: Contact ═══════════ */}
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Contact</h6>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefon</label>
                    <input
                      type="text"
                      className={`form-control${errors.phoneNumber ? ' is-invalid' : ''}`}
                      placeholder="0721 234 567"
                      {...register('phoneNumber')}
                    />
                    {errors.phoneNumber && <span className={styles.error}>{errors.phoneNumber.message}</span>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Telefon secundar</label>
                    <input
                      type="text"
                      className={`form-control${errors.secondaryPhone ? ' is-invalid' : ''}`}
                      placeholder="0722 345 678"
                      {...register('secondaryPhone')}
                    />
                    {errors.secondaryPhone && <span className={styles.error}>{errors.secondaryPhone.message}</span>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                      type="email"
                      className={`form-control${errors.email ? ' is-invalid' : ''}`}
                      placeholder="pacient@email.ro"
                      {...register('email')}
                    />
                    {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Adresă</label>
                    <input
                      type="text"
                      className={`form-control${errors.address ? ' is-invalid' : ''}`}
                      placeholder="Str. Exemplu, Nr. 1"
                      {...register('address')}
                    />
                    {errors.address && <span className={styles.error}>{errors.address.message}</span>}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Oraș</label>
                    <input
                      type="text"
                      className={`form-control${errors.city ? ' is-invalid' : ''}`}
                      placeholder="București"
                      {...register('city')}
                    />
                    {errors.city && <span className={styles.error}>{errors.city.message}</span>}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Județ</label>
                    <input
                      type="text"
                      className={`form-control${errors.county ? ' is-invalid' : ''}`}
                      placeholder="Ilfov"
                      {...register('county')}
                    />
                    {errors.county && <span className={styles.error}>{errors.county.message}</span>}
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-3">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cod poștal</label>
                    <input
                      type="text"
                      className={`form-control${errors.postalCode ? ' is-invalid' : ''}`}
                      placeholder="010101"
                      {...register('postalCode')}
                    />
                    {errors.postalCode && <span className={styles.error}>{errors.postalCode.message}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════ SECȚIUNEA 2b: Asigurare ═══════════ */}
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Asigurare</h6>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nr. asigurare</label>
                    <input
                      type="text"
                      className={`form-control${errors.insuranceNumber ? ' is-invalid' : ''}`}
                      placeholder="Nr. asigurare"
                      {...register('insuranceNumber')}
                    />
                    {errors.insuranceNumber && <span className={styles.error}>{errors.insuranceNumber.message}</span>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Asigurare expiră</label>
                    <input
                      type="date"
                      className={`form-control${errors.insuranceExpiry ? ' is-invalid' : ''}`}
                      {...register('insuranceExpiry')}
                    />
                  </div>
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

            {/* ═══════════ SECȚIUNEA 2c: Date medicale ═══════════ */}
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Date medicale</h6>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Medic de familie</label>
                    <input
                      type="text"
                      className={`form-control${errors.familyDoctorName ? ' is-invalid' : ''}`}
                      placeholder="Dr. Popescu Ion"
                      {...register('familyDoctorName')}
                    />
                    {errors.familyDoctorName && <span className={styles.error}>{errors.familyDoctorName.message}</span>}
                  </div>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-md-12">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Boli cronice</label>
                    <textarea
                      className={`form-control${errors.chronicDiseases ? ' is-invalid' : ''}`}
                      rows={2}
                      placeholder="Diabet, hipertensiune arteriaă..."
                      {...register('chronicDiseases')}
                    />
                    {errors.chronicDiseases && <span className={styles.error}>{errors.chronicDiseases.message}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════ SECȚIUNEA 3: Alergii ═══════════ */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h6 className={styles.sectionTitle}>Alergii</h6>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => addAllergy({ allergyTypeId: '', allergySeverityId: '', allergenName: '', notes: '' })}
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
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removeAllergy(idx)}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* ═══════════ SECȚIUNEA 4: Medici asociați ═══════════ */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h6 className={styles.sectionTitle}>Medici asociați</h6>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => addDoctor({ doctorId: '', isPrimary: false })}
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
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removeDoctor(idx)}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* ═══════════ SECȚIUNEA 5: Contacte urgență ═══════════ */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h6 className={styles.sectionTitle}>Contacte urgență</h6>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => addContact({ fullName: '', relationship: '', phoneNumber: '', isDefault: false })}
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
                      <input
                        type="text"
                        className={`form-control form-control-sm${errors.emergencyContacts?.[idx]?.phoneNumber ? ' is-invalid' : ''}`}
                        placeholder="Telefon"
                        {...register(`emergencyContacts.${idx}.phoneNumber`)}
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
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removeContact(idx)}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Note</label>
              <textarea
                className={`form-control${errors.notes ? ' is-invalid' : ''}`}
                rows={2}
                placeholder="Observații generale (opțional)"
                {...register('notes')}
              />
              {errors.notes && <span className={styles.error}>{errors.notes.message}</span>}
            </div>

            {/* Status activ (doar la editare) */}
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
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
              Anulează
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Se salvează...' : isEdit ? 'Salvează' : 'Adaugă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
