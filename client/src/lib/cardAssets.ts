/** Maps a deck card { suit, value } to its public image URL. */
export function cardImageUrl(suit: string, value: string): string {
  return `${import.meta.env.BASE_URL}cards/${suit}-${value}.png`
}

/** Public URL for a UI image (e.g. 'background', 'table-felt', 'card-slot', 'win-screen', 'gameover-screen'). */
export function uiImageUrl(name: string): string {
  return `${import.meta.env.BASE_URL}ui/${name}.png`
}
