import { useCallback, useEffect, useState } from 'react'
import { PROGRESS_KEY, readProgress, validLesson } from '../utils/learningProgress'
import { readStorage, writeStorage } from '../utils/storage'

export function useLearningProgress(pathSlug?: string, stepId?: string) {
  const [progress, setProgress] = useState(() => readProgress(readStorage(PROGRESS_KEY)))
  if (pathSlug && stepId && validLesson(pathSlug, stepId) &&
    (progress.lastStep?.pathSlug !== pathSlug || progress.lastStep.stepId !== stepId)) {
    setProgress({ ...progress, lastStep: { pathSlug, stepId } })
  }
  useEffect(() => { writeStorage(PROGRESS_KEY, JSON.stringify(progress)) }, [progress])
  const complete = useCallback((slug: string, id: string) => {
    if (!validLesson(slug, id)) return
    setProgress(previous => ({ ...previous, completed: { ...previous.completed, [slug]: [...new Set([...(previous.completed[slug] ?? []), id])] } }))
  }, [])
  return { progress, complete }
}
