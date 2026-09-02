export type TerminologyLanguage = 'pl' | 'en' | 'la'

export type BrainViewId = 'lateral' | 'medial' | 'sagittal' | 'coronal'
export type AtlasMode = 'structures' | 'circuits' | 'networks'
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
