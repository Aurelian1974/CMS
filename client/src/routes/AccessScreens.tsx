import { useNavigate } from 'react-router-dom';
import { ShieldOff, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/endpoints/auth.api';
import type { ModuleCode } from '@/hooks/useHasAccess';
import styles from './AccessScreens.module.scss';

/**
 * Afișat când utilizatorul deschide direct o rută pentru care nu are permisiuni.
 *
 * Până acum pagina se randa oricum, iar backend-ul refuza fiecare apel în parte:
 * utilizatorul vedea un ecran pe jumătate gol plus un șir de erori, fără să înțeleagă
 * că problema e de drepturi. Mesajul explicit, cu codurile modulelor lipsă, e ce
 * duce de fapt la administrator.
 */
export const AccessDeniedScreen = ({ modules }: { modules: readonly ModuleCode[] }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.screen} role="alert">
      <div className={styles.card}>
        <span className={styles.icon}><ShieldOff strokeWidth={1.5} /></span>
        <h2 className={styles.title}>Nu ai acces la acest ecran</h2>
        <p className={styles.desc}>
          Contul tău nu are drepturi de vizualizare pentru modulele de mai jos.
          Cere-i unui administrator să ți le acorde.
        </p>
        <div className={styles.modules}>
          {modules.map((m) => (
            <span key={m} className={styles.moduleChip}>{m}</span>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> Înapoi
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Afișat când niciun ecran nu e accesibil — rolul nu are niciun modul, sau toate
 * sunt pe „Fără acces". Fără el, `index` și `*` ar redirecționa la nesfârșit către
 * un dashboard pe care utilizatorul nu-l poate deschide.
 */
export const NoModulesScreen = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorăm erori la logout — oricum curățăm sesiunea local
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={styles.screen} role="alert">
      <div className={styles.card}>
        <span className={styles.icon}><ShieldOff strokeWidth={1.5} /></span>
        <h2 className={styles.title}>Contul nu are niciun modul alocat</h2>
        <p className={styles.desc}>
          Autentificarea a reușit, dar rolul tău nu are acces la niciun ecran din
          aplicație. Contactează un administrator pentru configurarea permisiunilor.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={handleLogout}>
            <LogOut size={14} /> Deconectare
          </button>
        </div>
      </div>
    </div>
  );
};
