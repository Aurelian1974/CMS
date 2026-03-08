import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationFormModal } from '../components/LocationFormModal'
import { BankAccountFormModal } from '../components/BankAccountFormModal'
import { AddressFormModal } from '../components/AddressFormModal'
import { ContactFormModal } from '../components/ContactFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { IconPlus } from '@/components/ui/Icons'
import { FormInput } from '@/components/forms/FormInput'
import { CaenCodeMultiSelect } from '@/components/forms/CaenCodeMultiSelect'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { clinicSchema, type ClinicFormData } from '../schemas/clinic.schema'
import type { BankAccountFormData } from '../schemas/clinic.schema'
import type { AddressFormData } from '../schemas/clinic.schema'
import type { ContactFormData } from '../schemas/clinic.schema'
import type { ClinicLocationFormData } from '../schemas/clinic.schema'
import type {
  ClinicLocationDto,
  ClinicBankAccountDto,
  ClinicAddressDto,
  ClinicContactDto,
  UpdateClinicPayload,
} from '../types/clinic.types'
import {
  useCurrentClinic,
  useClinicLocations,
  useUpdateClinic,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '../hooks/useClinic'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import styles from './ClinicPage.module.scss'

// ===== Icoane SVG inline =====
const IconCompany = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const IconLocation = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconBank = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
)

const IconAddress = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconContact = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
)

const IconChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconDepartment = () => (
  <svg className={styles.deptIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
)

const IconStar = () => (
  <svg className={styles.starIcon} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconDoctor = () => (
  <svg className={styles.doctorSmIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

// ===== Helper badge principal =====
const MainBadge = () => (
  <span className={styles.badgeMain}>Principal</span>
)

// ===== Componenta principală =====
const ClinicPage = () => {
  // Date clinică (include bankAccounts, addresses, contacts)
  const { data: clinicResp, isLoading: loadingClinic } = useCurrentClinic()
  const { data: locationsResp, isLoading: loadingLocations } = useClinicLocations()

  // Mutații — general
  const updateClinic = useUpdateClinic()

  // Mutații — conturi bancare
  const createBankAccount = useCreateBankAccount()
  const updateBankAccount = useUpdateBankAccount()
  const deleteBankAccount = useDeleteBankAccount()

  // Mutații — adrese
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()

  // Mutații — contacte
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  // Mutații — locații
  const createLocation = useCreateClinicLocation()
  const updateLocation = useUpdateClinicLocation()
  const deleteLocation = useDeleteClinicLocation()

  // ===== State modals =====
  const [bankModal, setBankModal] = useState(false)
  const [editingBank, setEditingBank] = useState<ClinicBankAccountDto | null>(null)
  const [deleteBank, setDeleteBank] = useState<ClinicBankAccountDto | null>(null)

  const [addrModal, setAddrModal] = useState(false)
  const [editingAddr, setEditingAddr] = useState<ClinicAddressDto | null>(null)
  const [deleteAddr, setDeleteAddr] = useState<ClinicAddressDto | null>(null)

  const [contactModal, setContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState<ClinicContactDto | null>(null)
  const [deleteContact2, setDeleteContact2] = useState<ClinicContactDto | null>(null)

  const [locationModal, setLocationModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<ClinicLocationDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClinicLocationDto | null>(null)

  // Tab activ
  const [activeTab, setActiveTab] = useState<'general' | 'addresses' | 'bank' | 'contacts' | 'locations'>('general')

  // State expandare locații
  const [expandedLocs, setExpandedLocs] = useState<Set<string>>(new Set())

  // Mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Formular clinică
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
  })

  const clinic = clinicResp?.data ?? null

  useEffect(() => {
    if (clinic) {
      reset({
        name: clinic.name,
        fiscalCode: clinic.fiscalCode,
        tradeRegisterNumber: clinic.tradeRegisterNumber ?? '',
        caenCodes: (clinic.caenCodes ?? []).map((cc) => ({
          id: cc.caenCodeId,
          code: cc.code,
          name: cc.name,
          level: cc.level,
          isActive: true,
        })),
        legalRepresentative: clinic.legalRepresentative ?? '',
        contractCNAS: clinic.contractCNAS ?? '',
      })
    }
  }, [clinic, reset])

  const { data: departmentsResp } = useDepartments()
  const locations = locationsResp?.data ?? []
  const departments = departmentsResp?.data ?? []
  const isLoading = loadingClinic || loadingLocations

  const deptsByLocation = useMemo(() => {
    const map = new Map<string, typeof departments>()
    for (const dept of departments) {
      if (dept.locationId) {
        const list = map.get(dept.locationId) ?? []
        list.push(dept)
        map.set(dept.locationId, list)
      }
    }
    return map
  }, [departments])

  const toggleExpandLoc = (locId: string) => {
    setExpandedLocs((prev) => {
      const next = new Set(prev)
      if (next.has(locId)) next.delete(locId)
      else next.add(locId)
      return next
    })
  }

  const showSuccess = (msg: string) => {
    setErrorMsg(null); setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }
  const showError = (err: unknown) => {
    setSuccessMsg(null)
    setErrorMsg(err instanceof Error ? err.message : 'A apărut o eroare neașteptată.')
  }

  // ===== Handlers general =====
  const handleSaveClinic = (data: ClinicFormData) => {
    const payload: UpdateClinicPayload = {
      name: data.name,
      fiscalCode: data.fiscalCode,
      tradeRegisterNumber: data.tradeRegisterNumber ?? null,
      caenCodeIds: data.caenCodes.map((c) => c.id),
      legalRepresentative: data.legalRepresentative ?? null,
      contractCNAS: data.contractCNAS ?? null,
    }
    updateClinic.mutate(payload, {
      onSuccess: () => showSuccess('Datele clinicii au fost actualizate cu succes.'),
      onError: (err) => showError(err),
    })
  }

  // ===== Handlers conturi bancare =====
  const handleBankSubmit = (data: BankAccountFormData) => {
    const payload = { ...data, notes: data.notes ?? null }
    if (editingBank) {
      updateBankAccount.mutate({ id: editingBank.id, ...payload }, {
        onSuccess: () => { setBankModal(false); setEditingBank(null); showSuccess('Contul a fost actualizat.') },
        onError: showError,
      })
    } else {
      createBankAccount.mutate(payload, {
        onSuccess: () => { setBankModal(false); showSuccess('Contul a fost adăugat.') },
        onError: showError,
      })
    }
  }

  // ===== Handlers adrese =====
  const handleAddrSubmit = (data: AddressFormData) => {
    const payload = { ...data, postalCode: data.postalCode || null }
    if (editingAddr) {
      updateAddress.mutate({ id: editingAddr.id, ...payload }, {
        onSuccess: () => { setAddrModal(false); setEditingAddr(null); showSuccess('Adresa a fost actualizată.') },
        onError: showError,
      })
    } else {
      createAddress.mutate(payload, {
        onSuccess: () => { setAddrModal(false); showSuccess('Adresa a fost adăugată.') },
        onError: showError,
      })
    }
  }

  // ===== Handlers contacte =====
  const handleContactSubmit = (data: ContactFormData) => {
    const payload = { ...data, label: data.label ?? null }
    if (editingContact) {
      updateContact.mutate({ id: editingContact.id, ...payload }, {
        onSuccess: () => { setContactModal(false); setEditingContact(null); showSuccess('Contactul a fost actualizat.') },
        onError: showError,
      })
    } else {
      createContact.mutate(payload, {
        onSuccess: () => { setContactModal(false); showSuccess('Contactul a fost adăugat.') },
        onError: showError,
      })
    }
  }

  // ===== Handlers locații =====
  const handleLocationSubmit = (data: ClinicLocationFormData) => {
    if (editingLocation) {
      updateLocation.mutate({ id: editingLocation.id, ...data }, {
        onSuccess: () => { setLocationModal(false); setEditingLocation(null); showSuccess('Locația a fost actualizată.') },
        onError: showError,
      })
    } else {
      createLocation.mutate(data, {
        onSuccess: () => { setLocationModal(false); showSuccess('Locația a fost adăugată.') },
        onError: showError,
      })
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Clinica" subtitle="Date societate comercială" />
        <div className={styles.loadingWrap}><LoadingSpinner /></div>
      </div>
    )
  }

  const bankAccounts = clinic?.bankAccounts ?? []
  const addresses = clinic?.addresses ?? []
  const contacts = clinic?.contacts ?? []

  const tabs = [
    { key: 'general',   label: 'Date generale',     icon: <IconCompany /> },
    { key: 'addresses', label: 'Adrese',             icon: <IconAddress />, count: addresses.length },
    { key: 'bank',      label: 'Conturi bancare',    icon: <IconBank />,    count: bankAccounts.length },
    { key: 'contacts',  label: 'Date de contact',    icon: <IconContact />, count: contacts.length },
    { key: 'locations', label: 'Locații',            icon: <IconLocation />, count: locations.length },
  ] as const

  return (
    <div className={styles.page}>
      <PageHeader title="Clinica" subtitle="Date societate comercială" />

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-0" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show mb-0" role="alert">
          {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg(null)} />
        </div>
      )}

      {/* ======= TAB NAV ======= */}
      <div className={styles.tabsCard}>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {'count' in tab && tab.count > 0 && (
                <span className={styles.tabCount}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.tabContent}>

          {/* ======= TAB: Date generale ======= */}
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit(handleSaveClinic)} noValidate>
              <div className={styles.formGrid}>
                <FormInput name="name" control={control} label="Denumire societate" placeholder="ex: S.C. Clinica Medicală S.R.L." required />
                <FormInput name="fiscalCode" control={control} label="CUI / CIF" placeholder="ex: RO12345678" required />
                <FormInput name="tradeRegisterNumber" control={control} label="Nr. Registrul Comerțului" placeholder="ex: J40/1234/2020" />
                <div className={styles.fullWidth}>
                  <CaenCodeMultiSelect name="caenCodes" control={control} label="Coduri CAEN" />
                </div>
                <FormInput name="legalRepresentative" control={control} label="Reprezentant legal" placeholder="ex: Dr. Popescu Ion" />
                <FormInput name="contractCNAS" control={control} label="Nr. contract CNAS" placeholder="ex: 12345/2024" />
              </div>
              <div className={styles.formActions}>
                <AppButton type="submit" variant="primary" disabled={!isDirty} isLoading={updateClinic.isPending} loadingText="Se salvează...">
                  Salvează modificările
                </AppButton>
              </div>
            </form>
          )}

          {/* ======= TAB: Adrese ======= */}
          {activeTab === 'addresses' && (
            <>
              <div className={styles.tabToolbar}>
                <AppButton variant="primary" size="sm" onClick={() => { setEditingAddr(null); setAddrModal(true) }}>
                  <IconPlus /> Adaugă adresă
                </AppButton>
              </div>
              {addresses.length === 0 ? (
                <div className={styles.emptyState}>
                  <IconAddress />
                  <p>Nu există adrese definite. Adaugă prima adresă.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className={styles.subTable}>
                    <thead>
                      <tr>
                        <th>Tip</th>
                        <th>Stradă</th>
                        <th>Oraș</th>
                        <th>Județ</th>
                        <th>Cod poștal</th>
                        <th>Țară</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map((a) => (
                        <tr key={a.id}>
                          <td><span className={styles.typeBadge}>{a.addressType}</span></td>
                          <td>{a.street}</td>
                          <td>{a.city}</td>
                          <td>{a.county}</td>
                          <td>{a.postalCode ?? '—'}</td>
                          <td>{a.country}</td>
                          <td>{a.isMain && <MainBadge />}</td>
                          <td>
                            <ActionButtons
                              onEdit={() => { setEditingAddr(a); setAddrModal(true) }}
                              onDelete={() => setDeleteAddr(a)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ======= TAB: Conturi bancare ======= */}
          {activeTab === 'bank' && (
            <>
              <div className={styles.tabToolbar}>
                <AppButton variant="primary" size="sm" onClick={() => { setEditingBank(null); setBankModal(true) }}>
                  <IconPlus /> Adaugă cont
                </AppButton>
              </div>
              {bankAccounts.length === 0 ? (
                <div className={styles.emptyState}>
                  <IconBank />
                  <p>Nu există conturi bancare definite. Adaugă primul cont.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className={styles.subTable}>
                    <thead>
                      <tr>
                        <th>Bancă</th>
                        <th>IBAN</th>
                        <th>Monedă</th>
                        <th>Observații</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map((b) => (
                        <tr key={b.id}>
                          <td>{b.bankName}</td>
                          <td><span className={styles.ibanCode}>{b.iban}</span></td>
                          <td>{b.currency}</td>
                          <td>{b.notes ?? '—'}</td>
                          <td>{b.isMain && <MainBadge />}</td>
                          <td>
                            <ActionButtons
                              onEdit={() => { setEditingBank(b); setBankModal(true) }}
                              onDelete={() => setDeleteBank(b)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ======= TAB: Date de contact ======= */}
          {activeTab === 'contacts' && (
            <>
              <div className={styles.tabToolbar}>
                <AppButton variant="primary" size="sm" onClick={() => { setEditingContact(null); setContactModal(true) }}>
                  <IconPlus /> Adaugă contact
                </AppButton>
              </div>
              {contacts.length === 0 ? (
                <div className={styles.emptyState}>
                  <IconContact />
                  <p>Nu există date de contact definite. Adaugă primul contact.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className={styles.subTable}>
                    <thead>
                      <tr>
                        <th>Tip</th>
                        <th>Valoare</th>
                        <th>Etichetă</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id}>
                          <td><span className={styles.typeBadge}>{c.contactType}</span></td>
                          <td>{c.value}</td>
                          <td>{c.label ?? '—'}</td>
                          <td>{c.isMain && <MainBadge />}</td>
                          <td>
                            <ActionButtons
                              onEdit={() => { setEditingContact(c); setContactModal(true) }}
                              onDelete={() => setDeleteContact2(c)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ======= TAB: Locații ======= */}
          {activeTab === 'locations' && (
            <>
              <div className={styles.tabToolbar}>
                <AppButton variant="primary" size="sm" onClick={() => { setEditingLocation(null); setLocationModal(true) }}>
                  <IconPlus /> Adaugă locație
                </AppButton>
              </div>
              {locations.length === 0 ? (
                <div className={styles.emptyState}>
                  <IconLocation />
                  <p>Nu există locații definite. Adaugă prima locație.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className={styles.locationsTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}></th>
                        <th>Denumire</th>
                        <th>Adresă</th>
                        <th>Oraș</th>
                        <th>Telefon</th>
                        <th>Tip</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc) => {
                        const isExpanded = expandedLocs.has(loc.id)
                        const locDepts = deptsByLocation.get(loc.id) ?? []
                        return (
                          <>
                            <tr key={loc.id} className={isExpanded ? styles.rowExpanded : ''}>
                              <td className={styles.expandCell}>
                                {locDepts.length > 0 && (
                                  <button className={styles.expandBtn} onClick={() => toggleExpandLoc(loc.id)} aria-label={isExpanded ? 'Restrânge' : 'Expandează'}>
                                    <IconChevron expanded={isExpanded} />
                                  </button>
                                )}
                              </td>
                              <td>
                                <span className={locDepts.length > 0 ? styles.clickableName : ''} onClick={() => locDepts.length > 0 && toggleExpandLoc(loc.id)}>
                                  {loc.name}
                                </span>
                              </td>
                              <td>{loc.address}</td>
                              <td>{loc.city}, {loc.county}</td>
                              <td>{loc.phoneNumber ?? '—'}</td>
                              <td>{loc.isPrimary && <span className={styles.badgePrimary}>Sediu principal</span>}</td>
                              <td>
                                <span className={loc.isActive ? styles.badgeActive : styles.badgeInactive}>
                                  {loc.isActive ? 'Activă' : 'Inactivă'}
                                </span>
                              </td>
                              <td>
                                <ActionButtons
                                  onEdit={() => { setEditingLocation(loc); setLocationModal(true) }}
                                  onDelete={() => setDeleteTarget(loc)}
                                />
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${loc.id}-detail`} className={styles.detailRow}>
                                <td colSpan={8} className={styles.detailCell}>
                                  <div className={styles.detailContent}>
                                    <div className={styles.detailHeader}>
                                      <IconDepartment />
                                      <span>Departamente în <strong>{loc.name}</strong></span>
                                    </div>
                                    {locDepts.length === 0 ? (
                                      <p className={styles.detailEmpty}>Niciun departament asignat.</p>
                                    ) : (
                                      <div className={styles.deptList}>
                                        {locDepts.map((dept) => (
                                          <div key={dept.id} className={styles.deptCard}>
                                            <div className={styles.deptCardHeader}>
                                              <span className={styles.deptName}>{dept.name}</span>
                                              <span className={styles.deptCode}>{dept.code}</span>
                                            </div>
                                            {dept.headDoctorName && (
                                              <div className={styles.deptMeta}><IconStar /><span>Șef: {dept.headDoctorName}</span></div>
                                            )}
                                            <div className={styles.deptMeta}><IconDoctor /><span>{dept.doctorCount} {dept.doctorCount === 1 ? 'medic' : 'medici'}</span></div>
                                            <div className={styles.deptMeta}><IconDoctor /><span>{dept.medicalStaffCount} personal medical</span></div>
                                            <span className={dept.isActive ? styles.badgeActive : styles.badgeInactive}>{dept.isActive ? 'Activ' : 'Inactiv'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ===== Modals ===== */}
      <BankAccountFormModal
        isOpen={bankModal}
        onClose={() => { setBankModal(false); setEditingBank(null) }}
        onSubmit={handleBankSubmit}
        isLoading={createBankAccount.isPending || updateBankAccount.isPending}
        editData={editingBank}
      />

      <AddressFormModal
        isOpen={addrModal}
        onClose={() => { setAddrModal(false); setEditingAddr(null) }}
        onSubmit={handleAddrSubmit}
        isLoading={createAddress.isPending || updateAddress.isPending}
        editData={editingAddr}
      />

      <ContactFormModal
        isOpen={contactModal}
        onClose={() => { setContactModal(false); setEditingContact(null) }}
        onSubmit={handleContactSubmit}
        isLoading={createContact.isPending || updateContact.isPending}
        editData={editingContact}
      />

      <LocationFormModal
        isOpen={locationModal}
        onClose={() => { setLocationModal(false); setEditingLocation(null) }}
        onSubmit={handleLocationSubmit}
        isLoading={createLocation.isPending || updateLocation.isPending}
        editData={editingLocation}
      />

      {/* ===== Confirm delete — adresă ===== */}
      {deleteAddr && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteAddr(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>Ștergi adresa <strong>{deleteAddr.addressType} — {deleteAddr.street}</strong>?</p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" onClick={() => setDeleteAddr(null)} disabled={deleteAddress.isPending}>Anulează</AppButton>
              <AppButton variant="danger" isLoading={deleteAddress.isPending} loadingText="Se șterge..."
                onClick={() => deleteAddress.mutate(deleteAddr.id, { onSuccess: () => { setDeleteAddr(null); showSuccess('Adresa a fost ștearsă.') }, onError: (e) => { setDeleteAddr(null); showError(e) } })}>
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm delete — cont bancar ===== */}
      {deleteBank && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteBank(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>Ștergi contul <strong>{deleteBank.bankName} — {deleteBank.iban}</strong>?</p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" onClick={() => setDeleteBank(null)} disabled={deleteBankAccount.isPending}>Anulează</AppButton>
              <AppButton variant="danger" isLoading={deleteBankAccount.isPending} loadingText="Se șterge..."
                onClick={() => deleteBankAccount.mutate(deleteBank.id, { onSuccess: () => { setDeleteBank(null); showSuccess('Contul a fost sters.') }, onError: (e) => { setDeleteBank(null); showError(e) } })}>
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm delete — contact ===== */}
      {deleteContact2 && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteContact2(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>Ștergi contactul <strong>{deleteContact2.contactType} — {deleteContact2.value}</strong>?</p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" onClick={() => setDeleteContact2(null)} disabled={deleteContact.isPending}>Anulează</AppButton>
              <AppButton variant="danger" isLoading={deleteContact.isPending} loadingText="Se șterge..."
                onClick={() => deleteContact.mutate(deleteContact2.id, { onSuccess: () => { setDeleteContact2(null); showSuccess('Contactul a fost sters.') }, onError: (e) => { setDeleteContact2(null); showError(e) } })}>
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm delete — locație ===== */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>Ești sigur că vrei să ștergi locația <strong>{deleteTarget.name}</strong>?</p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLocation.isPending}>Anulează</AppButton>
              <AppButton variant="danger" isLoading={deleteLocation.isPending} loadingText="Se șterge..."
                onClick={() => deleteLocation.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); showSuccess('Locația a fost ștearsă.') }, onError: (e) => { setDeleteTarget(null); showError(e) } })}>
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicPage
