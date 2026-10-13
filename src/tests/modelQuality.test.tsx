import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Brain3DScene from '../components/brain/Brain3DScene'
const viewer = vi.hoisted(()=>({pathway:vi.fn(),upgrade:vi.fn(),select:vi.fn(),layers:vi.fn(),preset:vi.fn(),zoom:vi.fn(),reset:vi.fn(),dispose:vi.fn()}))
const create = vi.hoisted(()=>vi.fn(()=>viewer))
vi.mock('../components/brain/three/brainViewer',()=>({createBrainViewer:create}))
const model = {version:1,coordinateSystem:'surface-RAS',meshes:[{id:'lh_Brodmann.4',label:'BA4',kind:'cortex',hemisphere:'left',structureIds:['motor-cortex'],approximate:false,positions:[0,0,0,1,0,0,0,1,0],indices:[0,1,2]}]}

describe('zmiana jakości bez resetowania sceny', () => {
  it('wymienia geometrię, zachowuje renderer i ponawia wybór oraz warstwy', async () => {
    const contextDescriptor=Object.getOwnPropertyDescriptor(window,'WebGL2RenderingContext')
    Object.defineProperty(window,'WebGL2RenderingContext',{configurable:true,value:class{}})
    const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(JSON.stringify(model),{headers:{'content-encoding':'gzip'}}))
    try {
      const {unmount}=render(<Brain3DScene language="pl" selectedId="lh_Brodmann.4" onSelect={vi.fn()} onFallback={vi.fn()} />)
      fireEvent.click(screen.getByLabelText('Widok'))
      await waitFor(()=>expect(create).toHaveBeenCalledOnce())
      fireEvent.click(screen.getByRole('button',{name:'Podpisy'}))
      fireEvent.change(screen.getByRole('combobox',{name:'Jakość modelu'}),{target:{value:'standard'}})
      await waitFor(()=>expect(viewer.upgrade).toHaveBeenCalledOnce())
      expect(viewer.dispose).not.toHaveBeenCalled()
      expect(create).toHaveBeenCalledOnce()
      expect(viewer.select).toHaveBeenLastCalledWith('lh_Brodmann.4',[])
      expect(screen.getByRole('button',{name:'Podpisy'})).toHaveAttribute('aria-pressed','true')
      fireEvent.change(screen.getByRole('combobox',{name:'Jakość modelu'}),{target:{value:'high'}})
      await waitFor(()=>expect(viewer.upgrade).toHaveBeenCalledTimes(2))
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(viewer.layers).toHaveBeenLastCalledWith(expect.objectContaining({labels:true,texture:true}))
      unmount()
      expect(viewer.dispose).toHaveBeenCalledOnce()
    } finally {
      fetch.mockRestore()
      if(contextDescriptor) Object.defineProperty(window,'WebGL2RenderingContext',contextDescriptor)
      else Reflect.deleteProperty(window,'WebGL2RenderingContext')
    }
  })
})
