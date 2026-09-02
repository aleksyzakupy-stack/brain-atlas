import { useContext } from 'react'
import { AtlasContext } from '../app/atlasContext'

export const useAtlas = () => {
  const value = useContext(AtlasContext)
  if (!value) throw new Error('useAtlas musi być użyty wewnątrz AtlasProvider')
  return value
}
