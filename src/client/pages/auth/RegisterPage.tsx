import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterInput } from '../../../shared/validators/auth.validators.js'

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (_data: RegisterInput) => {
    // wired in Phase 2 (Auth module)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Create Account</h2>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        Join TrusonShopp Mall today.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {[
          { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', key: 'name' as const },
          { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', key: 'email' as const },
          { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', key: 'password' as const },
        ].map(({ id, label, type, placeholder, key }) => (
          <div key={id} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label" htmlFor={id}>{label}</label>
            <input
              id={id}
              type={type}
              className={`form-control ${errors[key] ? 'is-invalid' : ''}`}
              placeholder={placeholder}
              {...register(key)}
            />
            {errors[key] && <span className="form-error">{errors[key]?.message}</span>}
          </div>
        ))}

        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <label className="form-label" htmlFor="role">Account Type</label>
          <select id="role" className="form-control" {...register('role')}>
            <option value="buyer">Buyer — Shop products</option>
            <option value="seller">Seller — Sell products</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ width: '100%' }}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 'var(--font-semibold)' }}>Sign In</Link>
      </p>
    </div>
  )
}
