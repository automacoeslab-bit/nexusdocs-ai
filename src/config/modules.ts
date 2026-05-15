export interface ModuleOverride {
  label?: string
  order?: number
  icon?: string
  hidden?: boolean
  category?: string
}

export const moduleConfig: Record<string, ModuleOverride> = {
  'modulo-visao-estrategia': {
    label: 'Visão e Estratégia',
    order: 1,
    icon: 'open-book',
  },
  'modulo-arquitetura': {
    label: 'Arquitetura',
    order: 2,
    icon: 'puzzle',
  },
  'modulo-feature': {
    label: 'Features',
    order: 3,
    icon: 'rocket',
  },
  'modulo-produto': {
    label: 'Produto',
    order: 4,
    icon: 'laptop',
  },
  'modulo-governanca': {
    label: 'Governança',
    order: 5,
    icon: 'setting',
  },
  'modulo-guide': {
    label: 'Guias',
    order: 6,
    icon: 'document',
  },
  'modulo-relacionamentos': {
    label: 'Relacionamentos',
    order: 7,
    icon: 'forward-slash',
  },
}
