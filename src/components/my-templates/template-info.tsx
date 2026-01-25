interface TemplateInfoProps {
  template: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    userId: string
    description: string | null
    categoryId: string
    canvasData: unknown
    placeholders: unknown
    previewImageUrl: string | null
    isPublic: boolean
    isVerified: boolean
    downloads: number
    deletedAt: Date | null
  }
}

export function TemplateInfo({ template }: TemplateInfoProps) {

}