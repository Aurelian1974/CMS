import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/store/authStore';
import type { LoginPayload } from '../types/auth.types';

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.permissions ?? []);
      navigate('/', { replace: true });
    },
  });
};
