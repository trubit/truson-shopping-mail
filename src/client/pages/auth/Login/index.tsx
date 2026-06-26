import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { FiMail, FiLock } from 'react-icons/fi'
import { motion } from 'framer-motion'
import AuthFormCard from '../../../../client/components/auth/AuthFormCard/index.js'
import AuthInput from '../../../../client/components/auth/AuthInput/index.js'
import AuthButton from '../../../../client/components/auth/AuthButton/index.js'
import SocialLogin from '../../../../client/components/auth/SocialLogin/index.js'
import { useLogin } from '../../../hooks/useAuth.js'
import { loginSchema, type LoginInput } from '../../../../shared/validators/auth.validators.js'

export default function LoginPage() {
  const [params] = useSearchParams()
  const registered = params.get('registered') === 'true'
  const reset = params.get('reset') === 'true'

  const { mutate: login, isPending, error, isError } = useLogin()
  const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginInput) => login(data)

  return (
    <AuthFormCard title="Sign In" subtitle="Welcome back to TrusonShopp Mall">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {registered && (
          <div className="auth-alert auth-alert-success">
            Account created! Please check your email to verify your account.
          </div>
        )}
        {reset && (
          <div className="auth-alert auth-alert-success">
            Password reset successfully. Please sign in.
          </div>
        )}
        {isError && errorMsg && (
          <div className="auth-alert auth-alert-error">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthInput
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={<FiMail />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={<FiLock />}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />

          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: 'var(--space-4)' }}>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: 'var(--text-xs)' }}>
              Forgot password?
            </Link>
          </div>

          <AuthButton type="submit" loading={isPending}>Sign In</AuthButton>
        </form>

        <SocialLogin />

        <p className="auth-terms">
          By signing in, you agree to TrusonShopp Mall&apos;s{' '}
          <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
        </p>

        <div className="auth-divider">New to TrusonShopp Mall?</div>

        <Link to="/register">
          <button type="button" className="auth-btn auth-btn-secondary">
            Create your account
          </button>
        </Link>
      </motion.div>
    </AuthFormCard>
  )
}
