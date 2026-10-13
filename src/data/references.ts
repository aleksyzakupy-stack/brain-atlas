import type { Reference } from '../types/atlas'

const ref = (id: string, title: string, authors: string, year: number, url: string, kind: Reference['kind']): Reference =>
  ({ id, title, authors, year, url, kind, status: 'verified' })

export const references: Reference[] = [
  ref('brodmann-nomenclature', 'Brodmann Areas — historyczne nazwy i numery', 'Yale University · Language in the Human Brain', 0, 'https://brain-language.yale.edu/brodmann-areas', 'atlas'),
  ref('haines', 'Neuroanatomy in Clinical Context, wyd. 9', 'Haines D.E. · ISBN 978-1-4511-8625-3', 2015, 'https://search.worldcat.org/isbn/9781451186253', 'atlas'),
  ref('dopamine-modern', 'Dopamine and glutamate in schizophrenia: biology, symptoms and treatment', 'McCutcheon R.A., Krystal J.H., Howes O.D.', 2020, 'https://pubmed.ncbi.nlm.nih.gov/31922684/', 'review'),
  ref('prediction-error', 'The prediction-error hypothesis of schizophrenia: new data point to circuit-specific changes in dopamine activity', 'Przegląd badań dopaminowych', 2021, 'https://pubmed.ncbi.nlm.nih.gov/34588607/', 'review'),
  ref('addiction-circuits', 'Neurocircuitry of addiction', 'Koob G.F., Volkow N.D.', 2010, 'https://pubmed.ncbi.nlm.nih.gov/19710631/', 'review'),
  ref('lc', 'Locus coeruleus: From global projection system to adaptive regulation of behavior', 'Przegląd organizacji układu LC', 2016, 'https://pubmed.ncbi.nlm.nih.gov/26969408/', 'review'),
  ref('raphe', 'Ascending serotonin neuron diversity under two umbrellas', 'Przegląd układów DR i MR', 2016, 'https://pubmed.ncbi.nlm.nih.gov/26740230/', 'review'),
  ref('cholinergic', 'Organization of the basal forebrain cholinergic system in the human brain', 'Badania anatomii ludzkiego mózgu', 2025, 'https://pubmed.ncbi.nlm.nih.gov/40340056/', 'review'),
  ref('sleep', 'Control of sleep and wakefulness', 'Brown R.E. i wsp.', 2012, 'https://pubmed.ncbi.nlm.nih.gov/22811426/', 'review'),
  ref('cstc', 'Harmonizing the Neurobiology and Treatment of Obsessive-Compulsive Disorder', 'Przegląd obwodów OCD', 2021, 'https://pubmed.ncbi.nlm.nih.gov/33384007/', 'review'),
  ref('basal-pathways', 'Functions of direct, indirect and hyperdirect pathways', 'Nambu A.', 2009, 'https://pubmed.ncbi.nlm.nih.gov/19378805/', 'review'),
  ref('hpa', 'Regulation of the Hypothalamic-Pituitary-Adrenocortical Stress Response', 'Herman J.P. i wsp.', 2016, 'https://pubmed.ncbi.nlm.nih.gov/27065163/', 'review'),
  ref('habenula', 'Dysregulation of the Lateral Habenula in Major Depressive Disorder', 'Przegląd badań nad uzdeczką', 2018, 'https://pubmed.ncbi.nlm.nih.gov/30581384/', 'review'),
  ref('nicotine', 'The habenulo-interpeduncular pathway in nicotine aversion and withdrawal', 'Przegląd badań uzależnienia od nikotyny', 2014, 'https://pubmed.ncbi.nlm.nih.gov/25476971/', 'review'),
  ref('papez', 'The anterior thalamus provides a subcortical circuit supporting memory and spatial navigation', 'Przegląd obwodu hipokampowo-wzgórzowego', 2013, 'https://pubmed.ncbi.nlm.nih.gov/24009563/', 'review'),
  ref('ei', 'Prefrontal cortical alterations of glutamate and GABA neurotransmission in schizophrenia: Insights for rational biomarker development', 'Przegląd danych korowych', 2020, 'https://pubmed.ncbi.nlm.nih.gov/32656540/', 'review'),
  ref('pfc-architecture', 'Lateral prefrontal cortex: architectonic and functional organization', 'Petrides M.', 2005, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1569489/', 'review'),
  ref('cingulate-architecture', 'Human Pregenual Anterior Cingulate Cortex: Structural, Functional, and Connectional Heterogeneity', 'Badania cytoarchitektury i metaanaliza funkcjonalna', 2018, 'https://pubmed.ncbi.nlm.nih.gov/29850806/', 'study'),
  ref('entorhinal', 'Anatomy and Function of the Primate Entorhinal Cortex', 'Przegląd anatomii i fizjologii naczelnych', 2020, 'https://pubmed.ncbi.nlm.nih.gov/32580662/', 'review'),
  ref('perirhinal', 'Shared Functions of Perirhinal and Parahippocampal Cortices: Implications for Cognitive Aging', 'Przegląd kory przyhipokampowej', 2018, 'https://pubmed.ncbi.nlm.nih.gov/29555181/', 'review'),
  ref('retrosplenial', 'Rethinking retrosplenial cortex: Perspectives and predictions', 'Przegląd przetwarzania przestrzennego', 2022, 'https://pubmed.ncbi.nlm.nih.gov/36460006/', 'review'),
  ref('angular', 'The angular gyrus: multiple functions and multiple subdivisions', 'Seghier M.L.', 2013, 'https://pubmed.ncbi.nlm.nih.gov/22547530/', 'review'),
  ref('language-modern', 'The Wernicke area: Modern evidence and a reinterpretation', 'Binder J.R.', 2015, 'https://pubmed.ncbi.nlm.nih.gov/26567270/', 'review'),
  ref('taste', 'Basic taste processing recruits bilateral anteroventral and middle dorsal insulae: An activation likelihood estimation meta-analysis of fMRI studies', 'Yeung A.W.K., Goto T.K., Leung W.K.', 2017, 'https://pubmed.ncbi.nlm.nih.gov/28413706/', 'study'),
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
