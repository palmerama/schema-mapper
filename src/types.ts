export type { DiscoveredField, DiscoveredType } from '@sanity-labs/schema-mapper-core'

export type DatasetInfo = {
  name: string
  aclMode: 'public' | 'private'
  totalDocuments: number
  types: import('@sanity-labs/schema-mapper-core').DiscoveredType[]
  schemaSource?: 'deployed' | 'inferred'
  hasDeployedSchema?: boolean
  deployedTypes?: import('@sanity-labs/schema-mapper-core').DiscoveredType[] | null
  inferredTypes?: import('@sanity-labs/schema-mapper-core').DiscoveredType[] | null
}

export type ProjectInfo = {
  id: string
  displayName: string
  studioHost?: string
  hasAccess?: boolean
  isProjectLoading?: boolean
  datasets: DatasetInfo[]
}
