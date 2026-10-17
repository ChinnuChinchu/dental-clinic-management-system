import { useAuth } from '../auth/AuthContext'
import { card } from '../components/ui'

export default function ComingSoon({ title }) {
  const { user } = useAuth()
  return (
    <div className={`${card} mx-auto max-w-lg text-center`}>
      <p className="text-4xl">🚧</p>
      <h1 className="mt-2 text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-lagoon/60">
        Welcome, {user.full_name}. Your dashboard is being built and will appear here.
      </p>
    </div>
  )
}