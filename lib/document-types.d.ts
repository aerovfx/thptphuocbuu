declare module './document-types.json' {
  export interface DocumentType {
    code: string
    name: string
    group: string
    description?: string
    synonyms: string[]
    keywords: string[]
    order: number
  }

  export interface DocumentTypesData {
    documentTypes: DocumentType[]
    groups: {
      [key: string]: {
        name: string
        description: string
      }
    }
  }

  const data: DocumentTypesData
  export default data
}

