import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService.js'
import { useAuthStore } from '../store/authStore.js'
import { queryClient } from '../services/queryClient.js'
import type { LoginInput, RegisterInput } from '../../shared/validators/auth.validators.js'

// ─── Login ────────────────────────────────────────────────────────────────────
export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (res) => {
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken)
        navigate('/')
      }
    },
  })
}

// ─── Register ─────────────────────────────────────────────────────────────────
export const useRegister = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
    onSuccess: () => {
      navigate('/login?registered=true')
    },
  })
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export const useLogout = () => {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })
}

// ─── Current User ─────────────────────────────────────────────────────────────
export const useMe = () => {
  const { isAuthenticated, setAuth, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authService.getMe()
      if (res.data?.user && accessToken) {
        setAuth(res.data.user, accessToken)
      }
      return res.data?.user
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  })

// ─── Reset Password ───────────────────────────────────────────────────────────
export const useResetPassword = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ token, password, confirmPassword }: { token: string; password: string; confirmPassword: string }) =>
      authService.resetPassword(token, password, confirmPassword),
    onSuccess: () => {
      navigate('/login?reset=true')
    },
  })
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const useVerifyEmail = (token: string) =>
  useQuery({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () => authService.verifyEmail(token),
    enabled: !!token,
    retry: false,
  })
