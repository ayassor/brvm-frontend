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
  has_access?: boolean
  has_password?: boolean
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

const UNLOCK_KEY = 'afrivesting_unlocked_courses'

function getUnlocked(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}') } catch { return {} }
}

export function isCourseUnlocked(courseId: number): boolean {
  return !!getUnlocked()[String(courseId)]
}

export function lockCourse(courseId: number): void {
  const u = getUnlocked()
  delete u[String(courseId)]
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(u))
}

export const educationApi = {
  courses: (): Promise<CourseFromAPI[]> =>
    api.get('/education/courses').then(r => r.data),

  articles: (): Promise<Article[]> =>
    api.get('/education/articles').then(r => r.data),

  glossary: (): Promise<GlossaryTerm[]> =>
    api.get('/education/glossary').then(r => r.data),

  unlockCourse: (courseId: number, password: string): Promise<{ success: boolean; token?: string }> =>
    api.post(`/education/courses/${courseId}/unlock`, { password }).then(r => {
      if (r.data.success) {
        const u = getUnlocked()
        u[String(courseId)] = r.data.token || '1'
        localStorage.setItem(UNLOCK_KEY, JSON.stringify(u))
      }
      return r.data
    }),

  setCoursePassword: (courseId: number, password: string | null): Promise<any> =>
    api.put(`/education/admin/courses/${courseId}/password`, { password }).then(r => r.data),
}
