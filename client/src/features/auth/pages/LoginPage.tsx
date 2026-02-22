import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schema';
import type { LoginFormData } from '../schemas/auth.schema';
import type { SubmitHandler } from 'react-hook-form';
import { useLogin } from '../hooks/useLogin';
import styles from './LoginPage.module.scss';

// ===== SVG-uri interne — doar pentru pagina de login =====

// Crucea Roșie medicală — înlocuiește inima ca simbol al asistenței medicale
const RedCrossIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="2" width="6" height="20" fill="#CC2936" rx="1.2" />
    <rect x="2" y="9" width="20" height="6" fill="#CC2936" rx="1.2" />
  </svg>
);

const PulseIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#5B8DB8"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const EkgLine = () => (
  <svg
    viewBox="0 0 600 80"
    className={styles.ekgSvg}
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <polyline
      points="0,40 60,40 80,40 90,10 100,70 110,20 120,55 140,40 200,40 220,40 230,5 240,75 250,15 260,50 280,40 600,40"
      fill="none"
      stroke="rgba(91,141,184,0.5)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

// ===== Statistici afișate pe panoul stâng =====
const STATS = [
  { value: '98%', label: 'Uptime' },
  { value: 'GDPR', label: 'Compliant' },
  { value: 'CNAS', label: 'Integrat' },
] as const;

// ===== Funcționalități afișate pe panoul stâng =====
const FEATURES = [
  'Management pacienți & istoric medical complet',
  'Calendar programări cu notificări',
  'Rețete & documente medicale digitale',
  'Facturare & raportare CNAS/SIUI',
] as const;

// ===================================================
// Componenta principală
// ===================================================
export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    login({ email: data.email, password: data.password });
  };

  return (
    <div className={styles.wrap}>

      {/* ===== PANEL STÂNG ===== */}
      <div className={styles.left}>
        <div className={styles.dotGrid} aria-hidden="true" />

        {/* Secțiunea superioară */}
        <div className={styles.leftTop}>

          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <RedCrossIcon size={16} />
            </div>
            <span className={styles.brandName}>
              Valyan<span>Clinic</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className={styles.headline}>
            Medicina modernă<br />
            <em>bine organizată.</em>
          </h1>
          <p className={styles.sub}>
            Sistem integrat de management pentru cabinete medicale.
            Programări, consultații, rețete și facturare într-un singur loc.
          </p>

          {/* Statistici */}
          <div className={styles.stats}>
            {STATS.map(({ value, label }) => (
              <div key={label} className={styles.stat}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Linia EKG */}
          <div className={styles.ekgWrap}>
            <div className={styles.ekgLabel}>
              <PulseIcon />
              sistem activ
            </div>
            <EkgLine />
          </div>
        </div>

        {/* Secțiunea inferioară — funcționalități */}
        <div className={styles.leftBottom}>
          <div className={styles.features}>
            {FEATURES.map((text) => (
              <div key={text} className={styles.feature}>
                <div className={styles.featureDot} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PANEL DREPT — Formular ===== */}
      <div className={styles.right}>
        <div className={styles.formBox}>
          <div className={styles.card}>

            {/* Eyebrow badge */}
            <div className={styles.eyebrow}>
              <RedCrossIcon size={14} />
              Portal medical
            </div>

            {/* Titlu */}
            <h2 className={styles.formTitle}>Bine ai venit</h2>
            <p className={styles.formSub}>Autentifică-te pentru a continua</p>

            {/* Eroare server (credențiale incorecte etc.) */}
            {error && (
              <div className="alert alert-danger py-2 mb-3 small" role="alert">
                {error.message || 'Autentificarea a eșuat. Verificați datele introduse.'}
              </div>
            )}

            {/* Formular */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className={styles.fields}>

                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="email">
                    Adresă email
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="doctor@clinica.ro"
                      className={
                        errors.email
                          ? `${styles.input} ${styles.inputError}`
                          : styles.input
                      }
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <span className={styles.fieldError} role="alert">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Parolă */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="password">
                    Parolă
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={
                        errors.password
                          ? `${styles.input} ${styles.inputPassword} ${styles.inputError}`
                          : `${styles.input} ${styles.inputPassword}`
                      }
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ascunde parola' : 'Afișează parola'}
                      tabIndex={-1}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && (
                    <span className={styles.fieldError} role="alert">
                      {errors.password.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Opțiuni */}
              <div className={styles.opts}>
                <label className={styles.rememberWrap}>
                  <input type="checkbox" {...register('rememberMe')} />
                  <span className={styles.rememberLabel}>Ține-mă autentificat</span>
                </label>
                <a href="#" className={styles.forgotLink}>
                  Parolă uitată?
                </a>
              </div>

              {/* Buton submit */}
              <button type="submit" className={styles.submitBtn} disabled={isPending}>
                {isPending ? (
                  <>
                    <span className={styles.spinner} />
                    Se autentifică...
                  </>
                ) : (
                  'Autentificare'
                )}
              </button>
            </form>

            {/* Footer card */}
            <div className={styles.cardFooter}>
              <span className={styles.copyright}>© 2025 ValyanClinic</span>
              <span className={styles.version}>v1.0.0</span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;

