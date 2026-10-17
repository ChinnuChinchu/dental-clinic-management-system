export const homePath = (role) =>
  ({
    patient: '/dashboard',
    admin: '/admin/doctors',
    doctor: '/doctor',
    staff: '/reception',
  })[role] || '/'