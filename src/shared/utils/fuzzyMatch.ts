export const normalizeText = (text: string | null | undefined): string => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const fuzzyMatch = (text: string | null | undefined, query: string): boolean => {
  const normText = normalizeText(text)
  const normQuery = normalizeText(query)
  return normText.includes(normQuery)
}
