export interface TypesenseConfig {
  nodes: {
    host: string
    port: number
    protocol: string
  }[]
  apiKey: string
  connectionTimeoutSeconds: number
}

export interface SearchParameters {
  q: string
  query_by: string
  per_page?: number
  page?: number
  sort_by?: string
  filter_by?: string
  facet_by?: string
  [key: string]: any
}

export interface SearchResponse<T> {
  hits: Array<{
    document: T
    highlights?: Array<{
      field: string
      snippet: string
    }>
  }>
  found: number
  page: number
  facet_counts?: any
} 