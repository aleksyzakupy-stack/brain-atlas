import { CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, ShadowMaterial } from 'three'

/** Quiet studio ground, also used in the Blender master. No extra animation. */
export function createStudioEnvironment(floorY: number) {
  const root = new Group()
  root.name = 'Anatomical studio'
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const context = shadowCanvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 62)
  gradient.addColorStop(0, 'rgba(0,0,0,.42)')
  gradient.addColorStop(.45, 'rgba(0,0,0,.24)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new CanvasTexture(shadowCanvas)
  const contact = new Mesh(new PlaneGeometry(245, 260), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: DoubleSide }))
  contact.rotation.x = -Math.PI / 2
  contact.position.set(0, floorY, 5)
  const shadow = new Mesh(new PlaneGeometry(1100, 1100), new ShadowMaterial({ opacity: .055, depthWrite: false, side: DoubleSide }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = floorY + .1
  shadow.receiveShadow = true
  root.add(contact, shadow)
  return {
    root,
    dispose() {
      root.removeFromParent()
      texture.dispose()
      contact.geometry.dispose(); contact.material.dispose()
      shadow.geometry.dispose(); shadow.material.dispose()
    },
  }
}
