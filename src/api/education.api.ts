import api from './axios'
import type { Article, GlossaryTerm } from '../types'

// Type pour un cours complet avec chapitres (structure backend)
export interface CourseFromAPI {
  id: number
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'coaching'
  is_paid: boolean
  price: number | null
  is_active: boolean
  chapters: {
    id: number
    title: string
    lessons: {
      id: string
      title: string
      videoId: string
      parts?: { label: string; videoId: string }[]
    }[]
  }[]
}

export const educationApi = {
  courses: (): Promise<CourseFromAPI[]> =>
    api.get('/education/courses').then(r => r.data),

  articles: (): Promise<Article[]> =>
    api.get('/education/articles').then(r => r.data),

  glossary: (): Promise<GlossaryTerm[]> =>
    api.get('/education/glossary').then(r => r.data),
}
