import { Outlet } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { useProfile } from '../../../hooks/useProfile.js'
import ProfileHeader from '../../../components/profile/ProfileHeader/index.js'
import '../../../styles/profile.css'

export default function ProfileLayout() {
  const { data: user, isLoading } = useProfile()

  return (
    <div className="profile-page">
      <Container>
        <div className="profile-layout">
          {/* Sidebar */}
          {isLoading || !user ? (
            <div className="profile-skeleton" style={{ height: 420, borderRadius: 12 }} />
          ) : (
            <ProfileHeader user={user} />
          )}

          {/* Main content */}
          <div className="profile-content">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  )
}
