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
    color: '#b7a092', roughness: 0.62, metalness: 0, side: DoubleSide,
    vertexColors: true, clearcoat: 0.06, clearcoatRoughness: 0.48,
    ior: 1.38, specularIntensity: 0.28, envMapIntensity: 0.22,
    sheen: 0.12, sheenColor: '#dbb7a4', sheenRoughness: 0.85,
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
float tissueLuminance = dot(tissue, vec3(0.299, 0.587, 0.114));
diffuseColor.rgb *= mix(1.0, clamp(tissueLuminance * 1.8, 0.82, 1.08), tissueDetail * 0.22);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (tissue.g - 0.5) * tissueDetail * 0.10, 0.48, 0.85);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
// Screen-space surface gradient: tiny relief, independent of UV seams.
float tissueHeight = dot(tissue, vec3(0.299, 0.587, 0.114));
vec3 tissueDx = dFdx(-vViewPosition);
vec3 tissueDy = dFdy(-vViewPosition);
vec3 tissueR1 = cross(tissueDy, normal);
vec3 tissueR2 = cross(normal, tissueDx);
float tissueDet = dot(tissueDx, tissueR1);
vec3 tissueGradient = sign(tissueDet) * (dFdx(tissueHeight) * tissueR1 + dFdy(tissueHeight) * tissueR2);
normal = normalize(abs(tissueDet) * normal - tissueDetail * 0.014 * tissueGradient);`)
  }
  material.customProgramCacheKey = () => 'blender-studio-tissue-v2'
  return material
}

export function setTissueDetail(material: MeshPhysicalMaterial, enabled: boolean) {
  material.userData.tissueDetail.value = enabled ? 1 : 0
  material.roughness = enabled ? 0.62 : 0.78
  material.clearcoat = enabled ? 0.06 : 0
}
