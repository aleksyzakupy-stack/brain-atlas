import type { AnatomyHierarchyNode } from '../types/anatomy'

export const anatomyHierarchy: AnatomyHierarchyNode[] = [
  {
    id: 'brain',
    names: { pl: 'Mózg', en: 'Brain', la: 'Encephalon' },
    childrenIds: [
      'cerebral-cortex',
      'limbic-system',
      'basal-ganglia',
      'diencephalon',
      'brainstem-system',
    ],
    depth: 0,
  },
  {
    id: 'cerebral-cortex',
    names: { pl: 'Kora mózgowa', en: 'Cerebral cortex', la: 'Cortex cerebri' },
    parentId: 'brain',
    childrenIds: [
      'prefrontal-cortex',
      'acc',
      'pcc',
      'insula',
      'precuneus',
      'motor-cortex',
      'somatosensory-cortex',
      'visual-cortex',
      'auditory-cortex',
    ],
    depth: 1,
  },
  {
    id: 'limbic-system',
    names: { pl: 'Układ limbiczny', en: 'Limbic system', la: 'Systema limbicum' },
    parentId: 'brain',
    childrenIds: ['amygdala', 'hippocampus', 'parahippocampal-gyrus'],
    depth: 1,
  },
  {
    id: 'basal-ganglia',
    names: { pl: 'Jądra podstawy', en: 'Basal ganglia', la: 'Nuclei basales' },
    parentId: 'brain',
    childrenIds: ['striatum', 'globus-pallidus', 'substantia-nigra'],
    depth: 1,
  },
  {
    id: 'diencephalon',
    names: { pl: 'Międzymózgowie', en: 'Diencephalon', la: 'Diencephalon' },
    parentId: 'brain',
    childrenIds: ['thalamus', 'hypothalamus'],
    depth: 1,
  },
  {
    id: 'brainstem-system',
    names: { pl: 'Pień mózgu i móżdżek', en: 'Brainstem and cerebellum', la: 'Truncus encephali et cerebellum' },
    parentId: 'brain',
    childrenIds: ['vta', 'locus-coeruleus', 'raphe-nuclei', 'pag', 'cerebellum'],
    depth: 1,
  },
]

export const hierarchyNodeById = Object.fromEntries(
  anatomyHierarchy.map((node) => [node.id, node]),
) as Record<string, AnatomyHierarchyNode>
