export type VesselPoint = [number, number, number]
export type VascularRoute = {
  id: string; name: string; points: VesselPoint[]; radius: number; endRadius: number
  hemisphere: 'left' | 'right' | 'midline'; vein?: boolean
}

// Authored teaching centerlines in surface-RAS millimetres, not angiography.
// Shared endpoints keep the canonical complete Circle of Willis connected.
// Anatomy reference: https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html
// Venous drainage: OpenStax Anatomy and Physiology 2e, §13.3.
export const vascularJunctions = {
  basilarOrigin: [0, -24, -51] as VesselPoint,
  basilarTip: [0, -12, -18] as VesselPoint,
  confluence: [0, -98, 13] as VesselPoint,
}

export function majorVascularRoutes(): VascularRoute[] {
  const { basilarOrigin, basilarTip, confluence } = vascularJunctions
  const routes: VascularRoute[] = [
    { id: 'BA', name: 'Tętnica podstawna', hemisphere: 'midline', points: [basilarOrigin, [0, -17, -40], [0, -12, -29], basilarTip], radius: 1.55, endRadius: 1.4 },
    { id: 'ACom', name: 'Tętnica łącząca przednia', hemisphere: 'midline', points: [[-3, 11, -14], [0, 12, -14], [3, 11, -14]], radius: .62, endRadius: .62 },
    { id: 'SSS', name: 'Zatoka strzałkowa górna', hemisphere: 'midline', vein: true, points: [[0, 55, 8], [0, 48, 42], [0, 17, 73], [0, -28, 79], [0, -71, 57], confluence], radius: 1, endRadius: 2.4 },
    { id: 'Straight', name: 'Zatoka prosta', hemisphere: 'midline', vein: true, points: [[0, -39, 18], [0, -56, 17], [0, -77, 15], confluence], radius: 1.1, endRadius: 1.5 },
  ]
  for (const sign of [-1, 1]) {
    const hemisphere = sign < 0 ? 'left' : 'right'
    const p = (x: number, y: number, z: number): VesselPoint => [sign * x, y, z]
    const ica = p(13, 2, -20), aca = p(3, 11, -14), pca = p(11, -17, -17)
    const add = (id: string, name: string, points: VesselPoint[], radius: number, endRadius: number, vein = false) => routes.push({ id: `${hemisphere}-${id}`, name, hemisphere, points, radius, endRadius, vein })
    add('ICA', 'Tętnica szyjna wewnętrzna', [p(19, -3, -43), p(16, 4, -33), p(12, 6, -27), ica], 1.95, 1.7)
    add('VA', 'Tętnica kręgowa', [p(10, -37, -72), p(9, -30, -63), p(5, -25, -55), basilarOrigin], 1.25, 1.35)
    add('ACA-A1', 'Tętnica mózgu przednia · A1', [ica, p(8, 7, -17), aca], 1.2, 1.0)
    add('ACA-A2', 'Tętnica mózgu przednia · okołospoidłowa', [aca, p(3, 21, -4), p(4, 29, 14), p(4, 25, 31), p(4, -3, 37), p(5, -34, 34), p(7, -52, 29)], 1.0, .45)
    add('MCA-M1', 'Tętnica mózgu środkowa · M1', [ica, p(23, 3, -18), p(32, 1, -14), p(35, 2, -12)], 1.65, 1.25)
    add('PCA-P1', 'Tętnica mózgu tylna · P1', [basilarTip, p(6, -14, -17), pca], 1.15, 1.1)
    add('PCom', 'Tętnica łącząca tylna', [ica, p(12, -7, -20), pca], .65, .6)
    add('PCA-P2', 'Tętnica mózgu tylna · P2', [pca, p(19, -26, -15), p(25, -38, -13), p(33, -52, -20)], 1.1, .8)
    add('SCA', 'Tętnica górna móżdżku', [[0, -12.8, -23], p(12, -20, -25), p(21, -36, -29), p(29, -52, -32)], .8, .35)
    add('AICA', 'Tętnica dolna przednia móżdżku', [[0, -17, -40], p(12, -28, -39), p(25, -40, -40), p(35, -50, -47)], .7, .3)
    add('Transverse', 'Zatoka poprzeczna', [confluence, p(22, -96, 6), p(43, -84, -5), p(57, -64, -16)], 2.3, 2.1, true)
    add('Sigmoid', 'Zatoka esowata', [p(57, -64, -16), p(54, -54, -25), p(44, -53, -36), p(38, -48, -47)], 2.1, 2.0, true)
  }
  return routes
}
