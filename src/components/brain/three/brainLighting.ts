import { HalfFloatType, WebGLRenderTarget } from 'three'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function createBrainLighting(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, target)
  const renderPass = new RenderPass(scene, camera)
  const ao = new GTAOPass(scene, camera, 1, 1)
  ao.blendIntensity = 0.65
  ao.updateGtaoMaterial({ radius: 5, thickness: 1.5, distanceExponent: 1.5, distanceFallOff: 0.6, scale: 1, samples: 12, screenSpaceRadius: false })
  ao.updatePdMaterial({ radius: 3, samples: 8, rings: 2 })
  const output = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(ao)
  composer.addPass(output)
  return {
    resize(width: number, height: number) {
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(width, height)
      // AO needs less resolution than the multisampled colour render.
      ao.setSize(Math.round(width), Math.round(height))
    },
    render(opaque: boolean) {
      ao.enabled = opaque
      composer.render()
    },
    dispose() {
      renderPass.dispose()
      ao.dispose()
      // r186 GTAOPass does not release these two materials itself.
      ao.gtaoMaterial.dispose()
      ao.blendMaterial.dispose()
      output.dispose()
      composer.dispose()
    },
  }
}
