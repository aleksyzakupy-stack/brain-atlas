import type { Reference } from '../types/atlas'

const ref = (id: string, title: string, authors: string, year: number, url: string, kind: Reference['kind']): Reference =>
  ({ id, title, authors, year, url, kind, status: 'verified' })

export const references: Reference[] = [
  ref('anatomy', 'The Organization of the Nervous System', 'Purves D. i wsp., Neuroscience, wyd. 2', 2001, 'https://www.ncbi.nlm.nih.gov/books/NBK10915/', 'textbook'),
  ref('brain', 'Physiology, Brain', 'StatPearls, NCBI Bookshelf', 2023, 'https://www.ncbi.nlm.nih.gov/books/NBK551718/', 'textbook'),
  ref('basal', 'Modulation of Movement by the Basal Ganglia', 'Purves D. i wsp., Neuroscience, wyd. 2', 2001, 'https://www.ncbi.nlm.nih.gov/books/NBK10868/', 'textbook'),
  ref('cerebellum', 'Modulation of Movement by the Cerebellum', 'Purves D. i wsp., Neuroscience, wyd. 2', 2001, 'https://www.ncbi.nlm.nih.gov/books/NBK11024/', 'textbook'),
  ref('visceral', 'Central Control of the Visceral Motor Functions', 'Purves D. i wsp., Neuroscience, wyd. 2', 2001, 'https://www.ncbi.nlm.nih.gov/books/NBK10930/', 'textbook'),
  ref('neurochemistry', 'Basic Neurochemistry: Molecular, Cellular and Medical Aspects, wyd. 6', 'Siegel G.J. i wsp.', 1999, 'https://www.ncbi.nlm.nih.gov/books/NBK20385/', 'textbook'),
  ref('hm', 'Loss of recent memory after bilateral hippocampal lesions', 'Scoville W.B., Milner B.', 1957, 'https://pubmed.ncbi.nlm.nih.gov/13406589/', 'study'),
  ref('memory-systems', 'Two cortical systems for memory-guided behaviour', 'Ranganath C., Ritchey M.', 2012, 'https://pubmed.ncbi.nlm.nih.gov/22992647/', 'review'),
  ref('episodic', 'The Evolution of Episodic Memory', 'In the Light of Evolution, NCBI Bookshelf', 2014, 'https://www.ncbi.nlm.nih.gov/books/NBK231621/', 'review'),
  ref('encoding', 'Cognitive neuroscience of episodic memory encoding', 'Buckner R.L., Logan J., Donaldson D.I., Wheeler M.E.', 2000, 'https://pubmed.ncbi.nlm.nih.gov/11194408/', 'review'),
  ref('emotional-memory', 'Cognitive and neural mechanisms of emotional memory', 'Hamann S.', 2001, 'https://pubmed.ncbi.nlm.nih.gov/11520704/', 'review'),
  ref('fear', 'Extinction learning in humans: role of the amygdala and vmPFC', 'Phelps E.A. i wsp.', 2004, 'https://pubmed.ncbi.nlm.nih.gov/15363399/', 'study'),
  ref('regulation', 'Neural circuitry underlying the regulation of conditioned fear and its relation to extinction', 'Delgado M.R. i wsp.', 2008, 'https://pubmed.ncbi.nlm.nih.gov/18786365/', 'study'),
  ref('salience', 'Dissociable intrinsic connectivity networks for salience processing and executive control', 'Seeley W.W. i wsp.', 2007, 'https://pubmed.ncbi.nlm.nih.gov/17329432/', 'study'),
  ref('control', 'Distinct brain networks for adaptive and stable task control in humans', 'Dosenbach N.U.F. i wsp.', 2007, 'https://pubmed.ncbi.nlm.nih.gov/17576922/', 'study'),
  ref('working-memory', 'Cellular basis of working memory', 'Goldman-Rakic P.S.', 1995, 'https://pubmed.ncbi.nlm.nih.gov/7695894/', 'review'),
  ref('dk', 'An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest', 'Desikan R.S. i wsp.', 2006, 'https://doi.org/10.1016/j.neuroimage.2006.01.021', 'atlas'),
  ref('aseg', 'Whole brain segmentation: automated labeling of neuroanatomical structures in the human brain', 'Fischl B. i wsp.', 2002, 'https://doi.org/10.1016/S0896-6273(02)00569-X', 'atlas'),
]

export const referenceById = Object.fromEntries(references.map(item => [item.id, item])) as Record<string, Reference>
export const resolveReferences = (ids: string[]) => [...new Set(ids)].map(id => referenceById[id]).filter(Boolean)
