import type { BrainCircuit } from '../types/atlas'

export type SpatialPoint = [number, number, number]
export type SpatialAnchor = {
  region?: string
  point?: SpatialPoint
  offset?: SpatialPoint
  precision: 'region' | 'landmark' | 'microcircuit' | 'external'
  midline?: boolean
}
const region = (id: string): SpatialAnchor => ({ region: id, precision: 'region' })
const landmark = (point: SpatialPoint, midline = false): SpatialAnchor => ({ point, precision: 'landmark', midline })
// Source coordinates are surface-RAS, NOT MNI. Small nuclei are explicit
// teaching landmarks checked against the relative anatomy in Haines 9e.
// They are not segmented nuclei or measured stereotactic targets.
export const spatialAnchors: Record<string, SpatialAnchor> = {
  accumbens: region('Left-Accumbens-area'), amygdala: region('Left-Amygdala'),
  hippocampus: region('Left-Hippocampus'), caudate: region('Left-Caudate'), putamen: region('Left-Putamen'),
  thalamus: region('Left-Thalamus-Proper'), cerebellum: region('Left-Cerebellum-Cortex'),
  pfc: region('lh_G_front_sup'), dlpfc: region('lh_G_front_middle'), ofc: region('lh_G_orbital'),
  motor: region('lh_G_precentral'), pcc: region('lh_G_cingul-Post-dorsal'),
  parietal: region('lh_G_precuneus'), temporal: region('lh_G_temporal_middle'), entorhinal: region('lh_G_oc-temp_med-Parahip'),
  acc: region('lh_G_and_S_cingul-Ant'), vmpfc: landmark([-7, 35, -7]),
  vta: landmark([-5, -23, -17]), snc: landmark([-11, -22, -16]), snr: landmark([-12, -21, -19]),
  pag: landmark([0, -31, -12], true), lc: landmark([-5, -35, -28]),
  dorsalRaphe: landmark([0, -31, -20], true), medianRaphe: landmark([0, -31, -28], true),
  caudalRaphe: landmark([0, -35, -50], true), medulla: landmark([-5, -33, -55]),
  hypothalamus: landmark([-5, -7, -14]), arcuate: landmark([-3, -7, -19]),
  eminence: landmark([0, -2, -23], true), pituitary: { point: [0, 4, -32], precision: 'landmark', midline: true },
  mammillary: landmark([-4, -15, -21]), pvn: landmark([-4, -5, -11]), scn: landmark([-3, 0, -18]),
  tmn: landmark([-5, -16, -17]), lateralHypothalamus: landmark([-9, -9, -14]), vlpo: landmark([-5, 3, -11]),
  septum: landmark([-3, 10, -3]), nbm: landmark([-15, 0, -12]), ppn: landmark([-8, -32, -25]), ldt: landmark([-5, -31, -26]),
  stn: landmark([-11, -14, -9]), gpi: { region: 'Left-Pallidum', offset: [3, 0, 0], precision: 'landmark' },
  gpe: { region: 'Left-Pallidum', offset: [-3, 0, 0], precision: 'landmark' },
  ventralPallidum: landmark([-14, 2, -12]), anteriorThalamus: landmark([-8, -11, 9]),
  md: landmark([-7, -20, 8]), va: landmark([-14, -11, 5]), reticular: landmark([-23, -18, 5]),
  extendedAmygdala: landmark([-13, 0, -10]), bnst: landmark([-5, 5, 0]),
  lateralHabenula: landmark([-4, -28, 9]), medialHabenula: landmark([-2, -28, 10]),
  rmtg: landmark([-4, -29, -22]), ipn: landmark([0, -25, -23], true), rvm: landmark([0, -31, -48], true),
  pons: landmark([-5, -27, -37]), dentate: landmark([-15, -58, -35]),
  pineal: landmark([0, -34, 5], true), retina: { point: [-24, 55, -26], precision: 'landmark' },
  spinal: { point: [0, -38, -98], precision: 'external', midline: true },
  spinalDorsal: { point: [-4, -42, -98], precision: 'external' },
  adrenal: { point: [-55, 20, -100], precision: 'external', midline: true },
  tissues: { point: [-68, -24, -105], precision: 'external', midline: true },
  pyramidal: { region: 'lh_G_front_middle', precision: 'microcircuit' },
  interneuron: { region: 'lh_G_front_middle', offset: [-12, 5, 4], precision: 'microcircuit' },
}

export const spatialGroups: Record<string, { key: string; label: string }[]> = {
  pallidalOutput: [{key:'gpi',label:'GPi'}, {key:'snr',label:'SNr'}],
  dorsalStriatum: [{key:'caudate',label:'Jądro ogoniaste'}, {key:'putamen',label:'Skorupa'}],
  striatum: [{key:'caudate',label:'Jądro ogoniaste'}, {key:'putamen',label:'Skorupa'}, {key:'accumbens',label:'Jądro półleżące'}],
  wakeSystems: [{key:'lc',label:'LC'}, {key:'dorsalRaphe',label:'Jądra szwu'}, {key:'tmn',label:'TMN'}],
  pontineCholinergic: [{key:'ppn',label:'PPN'}, {key:'ldt',label:'LDT'}],
}

export const spatialBindings: Record<string, string[]> = {
  mesolimbic: ['vta', 'accumbens', 'amygdala', 'hippocampus'],
  mesocortical: ['vta', 'dlpfc', 'vmpfc', 'acc'], nigrostriatal: ['snc', 'caudate', 'putamen'],
  tuberoinfundibular: ['arcuate', 'eminence', 'pituitary'],
  'noradrenergic-ascending': ['lc', 'pfc', 'hippocampus', 'amygdala', 'thalamus'],
  'noradrenergic-visceral': ['medulla', 'hypothalamus', 'extendedAmygdala'],
  'serotonin-dorsal': ['dorsalRaphe', 'pfc', 'striatum', 'amygdala'],
  'serotonin-median': ['medianRaphe', 'hippocampus', 'septum'],
  'serotonin-descending': ['caudalRaphe', 'spinal'], 'cholinergic-basal': ['nbm', 'pfc', 'amygdala'],
  septohippocampal: ['septum', 'hippocampus'], 'cholinergic-pontine': ['pontineCholinergic', 'thalamus', 'nbm'],
  histaminergic: ['tmn', 'pfc', 'thalamus'], orexin: ['lateralHypothalamus', 'lc', 'dorsalRaphe', 'vta', 'tmn'],
  'sleep-gaba': ['vlpo', 'wakeSystems'], corticocortical: ['pfc', 'parietal', 'temporal'],
  thalamocortical: ['thalamus', 'pfc', 'reticular', 'thalamus'], 'cortical-gaba': ['pyramidal', 'interneuron', 'pyramidal'],
  'basal-direct': ['motor', 'dorsalStriatum', 'pallidalOutput', 'thalamus', 'motor'],
  'basal-indirect': ['motor', 'dorsalStriatum', 'gpe', 'stn', 'pallidalOutput', 'thalamus', 'motor'],
  'basal-hyperdirect': ['pfc', 'stn', 'pallidalOutput', 'thalamus', 'pfc'],
  'cstc-motor': ['motor', 'putamen', 'pallidalOutput', 'va', 'motor'],
  'cstc-associative': ['dlpfc', 'caudate', 'pallidalOutput', 'md', 'dlpfc'],
  'cstc-orbitofrontal': ['ofc', 'caudate', 'pallidalOutput', 'md', 'ofc'],
  'cstc-limbic': ['acc', 'accumbens', 'ventralPallidum', 'md', 'acc'],
  papez: ['hippocampus', 'mammillary', 'anteriorThalamus', 'pcc', 'entorhinal', 'hippocampus'],
  'amygdala-output': ['amygdala', 'bnst', 'pag', 'medulla'], 'fear-extinction': ['vmpfc', 'amygdala', 'hippocampus'],
  hpa: ['pvn', 'pituitary', 'adrenal', 'tissues'], 'habenula-lateral': ['lateralHabenula', 'rmtg', 'vta'],
  'habenula-medial': ['medialHabenula', 'ipn', 'medianRaphe'],
  'pain-descending': ['acc', 'pag', 'rvm', 'spinalDorsal'], circadian: ['retina', 'scn', 'hypothalamus', 'pineal'],
  'cerebellar-cognitive': ['pfc', 'pons', 'cerebellum', 'dentate', 'thalamus', 'pfc'],
}

// Qualitative bundle guides. Curves interpolate these teaching waypoints;
// neither they nor the other inter-node curves are a tractography dataset.
export const spatialGuides: Record<string, SpatialPoint[][]> = {
  mesolimbic: [[[-7, -10, -15], [-10, 4, -8]], [[-8, -12, -17], [-17, -8, -20]], [[-10, -20, -12], [-20, -24, -14]]],
  mesocortical: [[[-9, -8, -10], [-18, 15, 14]], [[-6, -7, -12], [-7, 16, -5]], [[-6, -7, -7], [-8, 8, 20]]],
  nigrostriatal: [[[-13, -13, -3], [-14, -3, 6]], [[-15, -12, -5], [-22, -3, -4]]],
  papez: [
    [[-24, -31, -8], [-17, -25, 4], [-5, -16, 14], [-3, -4, 4]],
    [[-4, -13, -8]], [[-5, -4, 24], [-6, -22, 30], [-7, -40, 26]],
    [[-8, -52, 22], [-12, -55, 5], [-20, -44, -12]], [],
  ],
  septohippocampal: [[[-4, -4, 8], [-7, -18, 15], [-18, -30, 5]]],
}

export function bindingsForCircuit(circuit: BrainCircuit) {
  const bindings = spatialBindings[circuit.id]
  if (!bindings || bindings.length !== circuit.nodes.length || bindings.some(key => !spatialAnchors[key] && !spatialGroups[key])) throw new Error(`Brak orientacji przestrzennej: ${circuit.id}`)
  return bindings
}
