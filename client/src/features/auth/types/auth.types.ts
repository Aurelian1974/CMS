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
  clinicId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
