import api from '@/api/axiosInstance';
import type { LoginPayload, LoginResponse } from '@/features/auth/types/auth.types';

// Axiosinstance returnează response.data direct prin interceptor
export const authApi = {
  login: (payload: LoginPayload): Promise<LoginResponse> =>
    api.post('/api/auth/login', payload),

  refresh: (): Promise<LoginResponse> =>
    api.post('/api/auth/refresh'),

  logout: (): Promise<void> =>
    api.post('/api/auth/logout'),
};
