import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'

export default function SocialLogin() {
  return (
    <div>
      <div className="auth-divider">or continue with</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <button
          type="button"
          className="auth-btn auth-btn-secondary auth-btn-social"
          onClick={() => alert('Google OAuth — coming soon')}
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>
        <button
          type="button"
          className="auth-btn auth-btn-secondary auth-btn-social"
          onClick={() => alert('Facebook OAuth — coming soon')}
        >
          <FaFacebook size={20} color="#1877f2" />
          Continue with Facebook
        </button>
      </div>
    </div>
  )
}
