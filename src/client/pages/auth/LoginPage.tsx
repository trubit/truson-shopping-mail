import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { loginSchema, type LoginInput } from '../../../shared/validators/auth.validators.js'

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (_data: LoginInput) => {
    // wired in Phase 2 (Auth module)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Sign In</h2>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        Welcome back! Please enter your details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ width: '100%' }}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" style={{ fontWeight: 'var(--font-semibold)' }}>Sign Up</Link>
      </p>
    </div>
  )
}
