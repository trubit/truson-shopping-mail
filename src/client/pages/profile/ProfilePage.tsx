import { useAuthStore } from '../../store/authStore.js'

export default function ProfilePage() {
  const { user } = useAuthStore()
  return (
    <div className="container section">
      <h2 className="section-title">My Profile</h2>
      {user && (
        <div className="card" style={{ maxWidth: 480, marginTop: 'var(--space-6)' }}>
          <div className="card-body">
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="badge badge-primary">{user.role}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}
