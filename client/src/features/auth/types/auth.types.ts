// Tipuri TypeScript pentru modulul de autentificare

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Codurile de rol, identice cu valorile din coloana Roles.Code din backend.
 * Sunt lowercase: claim-ul de rol din JWT poartă codul, nu numele afișat.
 */
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'clinic_manager';

/**
 * Utilizatorul autentificat. Definiție unică — authStore o importă de aici.
 * Anterior exista o a doua copie în store/authStore.ts: structural identice, deci
 * TypeScript le accepta reciproc, dar un câmp adăugat doar într-una se pierdea
 * tăcut din tipuri (exact ce s-a întâmplat cu mustChangePassword).
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleId: string;
  clinicId: string;
  doctorId: string | null;
  /** Setat după un reset administrativ — clientul forțează schimbarea parolei. */
  mustChangePassword?: boolean;
}

/// Permisiune pe modul primită de la backend la login/refresh.
export interface ModulePermission {
  module: string;
  level: number;
  isOverridden: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  permissions: ModulePermission[];
}
