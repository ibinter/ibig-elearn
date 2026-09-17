export type UserRole = 'apprenant' | 'formateur' | 'coordinateur' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  phone?: string
  country: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  short_description: string
  thumbnail_url?: string
  preview_video_url?: string
  instructor_id: string
  instructor?: Profile
  category_id: string
  category?: Category
  price_xof: number
  price_eur?: number
  price_usd?: number
  level: 'debutant' | 'intermediaire' | 'avance'
  duration_hours: number
  language: string
  is_published: boolean
  is_featured: boolean
  enrollment_count: number
  rating_average: number
  rating_count: number
  tags: string[]
  objectives: string[]
  requirements: string[]
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  position: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  type: 'video' | 'document' | 'quiz' | 'assignment'
  video_url?: string
  video_duration_seconds?: number
  content?: string
  position: number
  is_free_preview: boolean
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  course?: Course
  status: 'active' | 'completed' | 'suspended'
  progress_percent: number
  paid_amount: number
  paid_currency: string
  payment_method: string
  payment_reference?: string
  enrolled_at: string
  completed_at?: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  is_completed: boolean
  watch_time_seconds: number
  last_position_seconds: number
  completed_at?: string
}

export interface QuizQuestion {
  id: string
  lesson_id: string
  question: string
  options: string[]
  correct_option: number
  explanation?: string
  position: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  lesson_id: string
  answers: number[]
  score: number
  passed: boolean
  attempted_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  user?: Profile
  course?: Course
  verification_code: string
  issued_at: string
  pdf_url?: string
}

export interface Payment {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  method: 'mobile_money' | 'card' | 'bank_transfer'
  provider: string
  provider_reference?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  invoice_url?: string
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  course_id: string
  user?: Profile
  rating: number
  comment?: string
  created_at: string
}
