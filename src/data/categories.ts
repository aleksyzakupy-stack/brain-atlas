import type { FunctionalCategoryId } from '../types/atlas'

export type FunctionalCategory = {
  id: FunctionalCategoryId
  label: string
  description: string
  color: string
}

export const functionalCategories: FunctionalCategory[] = [
  {
    id: 'cognition-control',
    label: 'Poznanie i kontrola',
    description: 'Planowanie, kontrola wykonawcza i monitorowanie działania',
    color: '#858bff',
  },
  {
    id: 'emotion-salience',
    label: 'Emocje i istotność',
    description: 'Ocena znaczenia bodźców i integracja stanu organizmu',
    color: '#ff8179',
  },
  {
    id: 'memory-stress',
    label: 'Pamięć i stres',
    description: 'Pamięć kontekstowa, uczenie i odpowiedź na stres',
    color: '#f0b45d',
  },
  {
    id: 'reward-motivation',
    label: 'Nagroda i motywacja',
    description: 'Wzmocnienie, uczenie nagradzające i inicjowanie działania',
    color: '#4bd2c2',
  },
  {
    id: 'neuromodulation',
    label: 'Neuromodulacja',
    description: 'Rozległa regulacja pobudzenia i przetwarzania informacji',
    color: '#dec267',
  },
  {
    id: 'integration',
    label: 'Integracja',
    description: 'Integracja sensoryczna, ruchowa i homeostatyczna',
    color: '#8fb3d9',
  },
]

export const categoryById = Object.fromEntries(
  functionalCategories.map((category) => [category.id, category]),
) as Record<FunctionalCategoryId, FunctionalCategory>
