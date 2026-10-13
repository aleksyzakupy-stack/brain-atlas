import { DoubleSide, MeshPhysicalMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { Texture } from 'three'

/** Artistic microtexture only: the source mesh supplies all anatomical folds. */
export function loadTissueTexture(onLoad: () => void, onError: () => void, anisotropy: number) {
  const texture = new TextureLoader().load(`${import.meta.env.BASE_URL}textures/cortex-tissue-albedo.png`, onLoad, undefined, onError)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.anisotropy = Math.min(8, anisotropy)
  return texture
}

export function createTissueMaterial(texture: Texture) {
  const material = new MeshPhysicalMaterial({
    color: '#e2bfb1', roughness: 0.49, metalness: 0, side: DoubleSide,
    vertexColors: true, clearcoat: 0.24, clearcoatRoughness: 0.35,
    ior: 1.38, specularIntensity: 0.65, envMapIntensity: 0.32,
  })
  const detail = { value: 1 }
  material.userData.tissueDetail = detail
  material.onBeforeCompile = shader => {
    shader.uniforms.tissueMap = { value: texture }
    shader.uniforms.tissueDetail = detail
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vTissuePosition;
varying vec3 vTissueNormal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vTissuePosition = position;
vTissueNormal = normal;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D tissueMap;
uniform float tissueDetail;
varying vec3 vTissuePosition;
varying vec3 vTissueNormal;
vec3 tissueSample(vec3 p) {
  vec3 w = pow(abs(normalize(vTissueNormal)), vec3(4.0));
  w /= max(w.x + w.y + w.z, 0.0001);
  // Three projections share object coordinates across all atlas parcels.
  return texture2D(tissueMap, p.yz).rgb * w.x
       + texture2D(tissueMap, p.xz).rgb * w.y
       + texture2D(tissueMap, p.xy).rgb * w.z;
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
vec3 tissue = tissueSample(vTissuePosition / 32.0);
diffuseColor.rgb *= mix(vec3(1.0), clamp(tissue * vec3(1.48, 1.85, 2.05), 0.62, 1.15), tissueDetail * 0.58);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (tissue.g - 0.5) * tissueDetail * 0.24, 0.32, 0.9);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
// Screen-space surface gradient: tiny relief, independent of UV seams.
float tissueHeight = dot(tissue, vec3(0.299, 0.587, 0.114));
vec3 tissueDx = dFdx(-vViewPosition);
vec3 tissueDy = dFdy(-vViewPosition);
vec3 tissueR1 = cross(tissueDy, normal);
vec3 tissueR2 = cross(normal, tissueDx);
float tissueDet = dot(tissueDx, tissueR1);
vec3 tissueGradient = sign(tissueDet) * (dFdx(tissueHeight) * tissueR1 + dFdy(tissueHeight) * tissueR2);
normal = normalize(abs(tissueDet) * normal - tissueDetail * 0.045 * tissueGradient);`)
  }
  material.customProgramCacheKey = () => 'cortical-tissue-v1'
  return material
}

export function setTissueDetail(material: MeshPhysicalMaterial, enabled: boolean) {
  material.userData.tissueDetail.value = enabled ? 1 : 0
  material.roughness = enabled ? 0.49 : 0.78
  material.clearcoat = enabled ? 0.24 : 0
}
