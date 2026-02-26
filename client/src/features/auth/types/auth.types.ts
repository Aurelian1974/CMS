// Tipuri TypeScript pentru modulul de autentificare

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'clinic_manager';
  roleId: string;
  clinicId: string;
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
