import { getAnatomyBreadcrumb } from '../../utils/anatomyHierarchy'
import { useAtlas } from '../../hooks/useAtlas'

type StructureBreadcrumbsProps = { structureId: string }

export function StructureBreadcrumbs({ structureId }: StructureBreadcrumbsProps) {
  const { state } = useAtlas()
  const items = getAnatomyBreadcrumb(structureId, state.terminologyLanguage)

  return (
    <nav className="anatomy-breadcrumbs" aria-label="Położenie w hierarchii anatomicznej">
      <ol>
        {items.map((item, index) => (
          <li key={item.id} aria-current={index === items.length - 1 ? 'page' : undefined}>
            {item.label}
          </li>
        ))}
      </ol>
    </nav>
  )
}
