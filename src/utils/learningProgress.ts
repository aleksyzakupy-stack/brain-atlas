import { learningPaths } from '../data/learningPaths'
import { circuitById } from '../data/circuits'
import type { LearningProgress } from '../types/atlas'

export const PROGRESS_KEY = 'brainAtlas.learning.v1'
export const emptyProgress = (): LearningProgress => ({ version: 1, lastStep: null, completed: {} })
export const lessonUrl = (pathSlug: string, stepId: string) => `/nauka/${pathSlug}/${stepId}`

export function validLesson(pathSlug: string, stepId: string) {
  return learningPaths.find(path => path.slug === pathSlug)?.steps.some(step => step.id === stepId) ?? false
}

export function readProgress(raw: string | null): LearningProgress {
  try {
    const parsed = JSON.parse(raw ?? 'null')
    if (!parsed || parsed.version !== 1) return emptyProgress()
    const result = emptyProgress()
    if (parsed.lastStep && validLesson(parsed.lastStep.pathSlug, parsed.lastStep.stepId)) result.lastStep = parsed.lastStep
    for (const path of learningPaths) {
      const completed = parsed.completed?.[path.slug]
      if (Array.isArray(completed)) result.completed[path.slug] = [...new Set(completed.filter((id): id is string => typeof id === 'string' && path.steps.some(step => step.id === id)))]
    }
    return result
  } catch { return emptyProgress() }
}

export function validReturnPath(value: string | null): string | undefined {
  if (!value) return undefined
  const circuitMatch = /^\/szlaki\/([a-z-]+)$/.exec(value)
  if (circuitMatch) return circuitById[circuitMatch[1]] ? value : undefined
  const match = /^\/nauka\/([a-z-]+)\/([a-z-]+)$/.exec(value)
  return match && validLesson(match[1], match[2]) ? value : undefined
}
