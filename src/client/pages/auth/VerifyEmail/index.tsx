import { useSearchParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import AuthFormCard from '../../../../client/components/auth/AuthFormCard/index.js'
import LoadingSpinner from '../../../../client/components/ui/LoadingSpinner.js'
import { useVerifyEmail } from '../../../hooks/useAuth.js'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { isLoading, isSuccess, isError, error } = useVerifyEmail(token)
  const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message

  if (!token) {
    return (
      <AuthFormCard title="Missing Token">
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <div className="auth-verify-icon auth-verify-error" style={{ margin: '0 auto var(--space-4)' }}>
            <FiXCircle size={36} color="var(--color-danger)" />
          </div>
          <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
            This verification link is invalid. Please check your email or request a new link.
          </p>
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>
      </AuthFormCard>
    )
  }

  return (
    <AuthFormCard title="Email Verification">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}
      >
        {isLoading && (
          <>
            <div className="auth-verify-icon auth-verify-loading" style={{ margin: '0 auto var(--space-4)' }}>
              <LoadingSpinner size="md" />
            </div>
            <p style={{ color: 'var(--color-neutral-600)' }}>Verifying your email address...</p>
          </>
        )}

        {isSuccess && (
          <>
            <div className="auth-verify-icon auth-verify-success" style={{ margin: '0 auto var(--space-4)' }}>
              <FiCheckCircle size={36} color="var(--color-success)" />
            </div>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Email Verified!</h3>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
              Your email has been verified successfully. You can now sign in to your account.
            </p>
            <Link to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: 42, background: 'var(--color-brand-accent)',
                color: 'var(--color-brand-text)', fontWeight: 600, borderRadius: 'var(--radius-md)',
                textDecoration: 'none', fontSize: 'var(--text-sm)',
              }}>
              Sign In to Your Account
            </Link>
          </>
        )}

        {isError && (
          <>
            <div className="auth-verify-icon auth-verify-error" style={{ margin: '0 auto var(--space-4)' }}>
              <FiXCircle size={36} color="var(--color-danger)" />
            </div>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Verification Failed</h3>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
              {errorMsg ?? 'This link is invalid or has expired.'}
            </p>
            <Link to="/login" className="auth-link">Back to Sign In</Link>
          </>
        )}
      </motion.div>
    </AuthFormCard>
  )
}
