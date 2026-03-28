import api from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/common.types';
import type { LoginPayload, LoginResponse } from '@/features/auth/types/auth.types';

// Axios interceptor returnează response.data = ApiResponse<T>
// Pentru login extragem .data din wrapper-ul ApiResponse
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>('/api/v1/Auth/login', payload);
    return response.data!;
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await api.post<unknown, ApiResponse<LoginResponse>>('/api/v1/Auth/refresh');
    return response.data!;
  },

  logout: (): Promise<void> =>
    api.post('/api/v1/Auth/logout'),
};
