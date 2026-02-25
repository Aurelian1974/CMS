import api from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/common.types';
import type { LoginPayload, LoginResponse } from '@/features/auth/types/auth.types';

// Axios interceptor returnează response.data = ApiResponse<T>
// Pentru login extragem .data din wrapper-ul ApiResponse
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>('/api/auth/login', payload);
    return response.data!;
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>('/api/auth/refresh');
    return response.data!;
  },

  logout: (): Promise<void> =>
    api.post('/api/auth/logout'),
};
