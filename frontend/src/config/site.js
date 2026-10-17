export const clinic = {
  name: 'Bright Smile Dental',             // CHANGE to the clinic's real name
  tagline: 'Healthy, confident smiles for the whole family',
  phone: '+91 98765 43210',
  email: 'hello@brightsmile.example',
  address: 'Main Road, Thrissur, Kerala 680001',
  mapsUrl: 'https://maps.google.com',
  hours: [
    ['Monday – Saturday', '10:00 AM – 7:00 PM'],
    ['Sunday', 'Closed'],
  ],
}

// To use your own photos: put files in frontend/public/images/ and
// change a value to '/images/hero.jpg' etc.
export const images = {
//   hero: 'https://picsum.photos/seed/bsd-hero/900/1000',
  hero: '/images/hero.jpg',
  cta: 'https://picsum.photos/seed/bsd-cta/1200/600',
  doctors: [
    'https://picsum.photos/seed/bsd-doc1/500/600',
    'https://picsum.photos/seed/bsd-doc2/500/600',
    'https://picsum.photos/seed/bsd-doc3/500/600',
  ],
  results: [
    {
      label: 'Teeth whitening',
      before: 'https://picsum.photos/seed/bsd-before1/900/675',
      after: 'https://picsum.photos/seed/bsd-after1/900/675',
    },
    {
      label: 'Braces',
      before: 'https://picsum.photos/seed/bsd-before2/900/675',
      after: 'https://picsum.photos/seed/bsd-after2/900/675',
    },
    {
      label: 'Smile makeover',
      before: 'https://picsum.photos/seed/bsd-before3/900/675',
      after: 'https://picsum.photos/seed/bsd-after3/900/675',
    },
  ],
}

export const services = [
  { icon: '🪥', title: 'Cleaning & Scaling', desc: 'Remove plaque and stains for fresher breath and healthier gums.' },
  { icon: '✨', title: 'Teeth Whitening', desc: 'Safe, quick whitening for a visibly brighter smile.' },
  { icon: '😁', title: 'Braces & Aligners', desc: 'Straighter teeth with traditional braces or clear aligners.' },
  { icon: '🦷', title: 'Root Canal Treatment', desc: 'Gentle, pain-managed treatment that saves your natural tooth.' },
  { icon: '🔩', title: 'Dental Implants', desc: 'Permanent, natural-looking replacement for missing teeth.' },
  { icon: '🧒', title: 'Kids Dentistry', desc: 'A friendly, fear-free first visit for your little ones.' },
]

// DEMO numbers. Replace with the clinic's real figures before showing a client.
export const stats = [
  { value: 5000, suffix: '+', decimals: 0, label: 'Happy patients' },
  { value: 15, suffix: '+', decimals: 0, label: 'Years of experience' },
  { value: 4.9, suffix: '/5', decimals: 1, label: 'Patient rating' },
  { value: 8, suffix: '', decimals: 0, label: 'Specialists' },
]

export const reasons = [
  { icon: '🏥', title: 'Modern equipment', desc: 'Digital X-rays and sterilised instruments for every visit.' },
  { icon: '👩‍⚕️', title: 'Experienced doctors', desc: 'Specialists in orthodontics, endodontics and more.' },
  { icon: '💬', title: 'Clear treatment plans', desc: 'You know the steps and the cost before we begin.' },
  { icon: '📅', title: 'Easy online booking', desc: 'Pick your doctor and time in under a minute.' },
]

// DEMO reviews. Use real ones (with permission) for a real clinic.
export const testimonials = [
  { name: 'Anjali R.', text: 'I was nervous about my root canal, but the doctor explained everything and I felt no pain at all.', rating: 5 },
  { name: 'Mohammed S.', text: 'Booking online was so easy, and the reminder message meant I never missed my checkup.', rating: 5 },
  { name: 'Priya K.', text: 'My daughter actually enjoys going to the dentist now. The staff are so kind with children.', rating: 5 },
]

export const faqs = [
  { q: 'How do I book an appointment?', a: 'Click “Book appointment”, choose a doctor, pick a date and an available time, and confirm. You can also call the clinic.' },
  { q: 'Can I cancel or reschedule?', a: 'Yes, from “My appointments”, up to 2 hours before your visit. For last-minute changes please call us.' },
  { q: 'What payment methods do you accept?', a: 'We accept cash and UPI at the clinic.' },
  { q: 'Do you treat children?', a: 'Yes. We offer gentle, child-friendly dental care.' },
  { q: 'What should I do in a dental emergency?', a: 'Call the clinic right away. For severe swelling, heavy bleeding or trauma, visit the nearest hospital.' },
]