// src/shared/navi.ts
// Formatação do comando de navegação in-game, compartilhada entre Main e Renderer.

export interface NaviCoords {
  mapName: string
  xpos: string | number
  ypos: string | number
}

/** `/navi {mapa} {x/y}` — remove o sufixo `.gat` do nome do mapa. */
export function formatNaviCommand(loc: NaviCoords): string {
  const map = String(loc.mapName).replace(/\.gat$/i, '')
  return `/navi ${map} ${loc.xpos}/${loc.ypos}`
}
