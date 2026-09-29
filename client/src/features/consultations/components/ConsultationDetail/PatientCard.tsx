import { User, Cake, Phone, Mail, Calendar, MapPin } from 'lucide-react'
import { formatDate } from '@/utils/format'
import styles from '../../pages/ConsultationsListPage.module.scss'

export interface PatientCardData {
  name: string
  cnp: string | null
  age: number | null
  gender: string | null
  phone?: string | null
  email?: string | null
  date: string
}

export const PatientCard = ({ name, cnp, age, gender, phone, email, date }: PatientCardData) => (
  <section className={styles.patientCard}>
    <div className={styles.patientAvatar}>
      <User size={22} />
    </div>
    <div className={styles.patientDetails}>
      <h3 className={styles.patientName}>{name}</h3>
      <div className={styles.patientMeta}>
        <span className={styles.patientMetaItem}>
          <span className={styles.metaIcon}><MapPin size={13} /></span>
          CNP: {cnp ?? '—'}
        </span>
        <span className={styles.patientMetaItem}>
          <span className={styles.metaIcon}><Cake size={13} /></span>
          {age !== null ? `${age} ani` : '—'}
        </span>
        <span className={styles.patientMetaItem}>
          <span className={styles.metaIcon}><User size={13} /></span>
          {gender ?? '—'}
        </span>
        {phone !== undefined && (
          <span className={styles.patientMetaItem}>
            <span className={styles.metaIcon}><Phone size={13} /></span>
            {phone ?? '—'}
          </span>
        )}
        {email !== undefined && (
          <span className={styles.patientMetaItem}>
            <span className={styles.metaIcon}><Mail size={13} /></span>
            {email ?? '—'}
          </span>
        )}
        <span className={styles.patientMetaItem}>
          <span className={styles.metaIcon}><Calendar size={13} /></span>
          {formatDate(date)}
        </span>
      </div>
    </div>
  </section>
)
