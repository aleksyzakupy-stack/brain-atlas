export type TerminologyLanguage = 'pl' | 'en' | 'la'

export type BrainViewId = 'lateral' | 'medial' | 'deep' | 'sagittal' | 'coronal'
export type AtlasMode = 'learning' | 'structures' | 'circuits' | 'networks'
export type PanelState = 'collapsed' | 'medium' | 'expanded'

export type OverlayLayerId =
  | 'deep-anatomy'
  | 'circuits'
  | 'networks'
  | 'brodmann'
  | 'neurotransmitters'

export type FunctionalCategoryId =
  | 'cognition-control'
  | 'emotion-salience'
  | 'memory-stress'
  | 'reward-motivation'
  | 'neuromodulation'
  | 'integration'

export type Terminology = {
  pl: string
  en: string
  la?: string
  abbreviation?: string
}

export type Reference = {
  id: string
  title?: string
  authors?: string
  year?: number
  journal?: string
  doi?: string
  pmid?: string
  url?: string
  status: 'placeholder' | 'verified'
  kind?: 'study' | 'review' | 'textbook' | 'atlas' | 'framework'
}

export type BrainStructure = {
  id: string
  slug: string
  names: Terminology
  aliases: string[]
  categoryId: FunctionalCategoryId
  parentId?: string
  childrenIds: string[]
  depth: number
  displayAtBaseLevel: boolean
  shortRole: string
  functions: string[]
  localization: string
  inputs: string[]
  outputs: string[]
  relatedStructureIds: string[]
  relatedCircuitIds: string[]
  relatedNetworkIds: string[]
  neurotransmitters: string[]
  brodmannAreas: string[]
  preferredViews: BrainViewId[]
  availableViews: BrainViewId[]
  psychiatrySummary?: string
  interpretationNote?: string
  references: Reference[]
}

export type BrainCircuit = {
  id: string
  names: Terminology
  structureIds: string[]
  connectionIds: string[]
}

export type BrainNetwork = {
  id: string
  names: Terminology
  hubStructureIds: string[]
}

export type NeurotransmitterSystem = {
  id: string
  names: Terminology
  sourceStructureIds: string[]
  targetStructureIds: string[]
}

export type PsychiatricSymptom = {
  id: string
  names: Terminology
  relatedStructureIds: string[]
}

export type PsychiatricDisorder = {
  id: string
  names: Terminology
  symptomIds: string[]
  relatedCircuitIds: string[]
}

export type TreatmentMechanism = {
  id: string
  names: Terminology
  targetIds: string[]
}

export type PrimarySelection =
  | { type: 'structure'; id: string }
  | { type: 'circuit'; id: string }
  | { type: 'network'; id: string }
  | null

export type ViewportState = {
  zoom: number
  pan: { x: number; y: number }
}

export type AtlasView = 'lateral' | 'medial' | 'deep'

export type Connection = {
  id: string
  title: string
  sourceId: string
  targetId: string
  kind: 'anatomical' | 'functional'
  directed: boolean
  description: string
  referenceIds: string[]
}

export type LearningStep = {
  id: string
  title: string
  stage: string
  lead: string
  paragraphs: string[]
  detail: { title: string; text: string }
  takeaway: string
  view: AtlasView
  structureIds: string[]
  connectionIds: string[]
  referenceIds: string[]
  scene: 'anatomy' | 'connections'
}

export type LearningPath = {
  slug: string
  title: string
  subtitle: string
  description: string
  categoryId: FunctionalCategoryId
  minutes: number
  steps: LearningStep[]
}

export type LearningProgress = {
  version: 1
  lastStep: { pathSlug: string; stepId: string } | null
  completed: Record<string, string[]>
}
