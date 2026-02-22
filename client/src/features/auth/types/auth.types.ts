// Tipuri TypeScript pentru modulul de autentificare

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'ClinicManager';
  clinicId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
