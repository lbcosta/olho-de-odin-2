// src/renderer/utils/LogTranslator.ts
// Dicionário Tradutor (T016): mascara paths técnicos da GnJoy em strings
// amigáveis para a visão colapsada do Request Log. Sem Regex de valor — apenas
// checagens de substring sobre o path.

type Rule = { match: (path: string) => boolean; label: string }

const RULES: Rule[] = [
  { match: (p) => p.startsWith('renew'), label: 'Renovando sessão...' },
  { match: (p) => p.includes('[store'), label: 'Buscando localização da loja...' },
  { match: (p) => p.includes('[item'), label: 'Buscando detalhes do item...' },
  { match: (p) => p.includes('[price'), label: 'Atualizando histórico de preços...' },
  { match: (p) => p.includes('market-price'), label: 'Consultando histórico de mercado...' },
  { match: (p) => p.includes('trading'), label: 'Verificando concorrência...' },
]

const FALLBACK = 'Comunicando com a GnJoy...'

/** Traduz um path técnico para uma ação humanizada. */
export function translateLogPath(path: string): string {
  return RULES.find((rule) => rule.match(path))?.label ?? FALLBACK
}
