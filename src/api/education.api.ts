import api from './axios'
import type { Course, Article, GlossaryTerm } from '../types'

export const educationApi = {
  courses: () =>
    api.get<Course[]>('/education/courses').then((r) => r.data),

  articles: () =>
    api.get<Article[]>('/education/articles').then((r) => r.data),

  glossary: () =>
    api.get<GlossaryTerm[]>('/education/glossary').then((r) => r.data),
}
