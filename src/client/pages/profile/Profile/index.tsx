import { FiMapPin } from 'react-icons/fi'
import { useProfile } from '../../../hooks/useProfile.js'
import ProfileCard from '../../../components/profile/ProfileCard/index.js'

export default function ProfilePage() {
  const { data: user, isLoading, error } = useProfile()

  if (isLoading) return (
    <div>
      <div className="profile-skeleton mb-3" style={{ height: 180, borderRadius: 12 }} />
      <div className="profile-skeleton" style={{ height: 120, borderRadius: 12 }} />
    </div>
  )

  if (error || !user) return (
    <div className="profile-alert profile-alert--error">
      Failed to load profile. Please refresh the page.
    </div>
  )

  return (
    <>
      <ProfileCard user={user} />

      {/* Address preview */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h2 className="profile-section-title"><FiMapPin /> Delivery Address</h2>
        </div>
        {user.address?.street ? (
          <div className="address-display">
            {user.address.street}<br />
            {user.address.city}{user.address.state ? `, ${user.address.state}` : ''}<br />
            {user.address.country} {user.address.postalCode}
          </div>
        ) : (
          <div className="address-empty">
            No address saved yet.{' '}
            <a href="/profile/address" style={{ color: '#FF9900' }}>Add one →</a>
          </div>
        )}
      </div>
    </>
  )
}
