// src/config/c4-theme.ts
// Engine de diagramas tematizável — deriva 100% de brand.ts
// Trocar brand.ts atualiza todos os diagramas automaticamente.

import { brand } from './brand';

const { accent, accentHigh, bg, surface, card, border, text, muted } = brand.colors;

// ─── Tokens derivados da marca ──────────────────────────────────────────────

export const C4_INIT = `%%{init: {'theme': 'base'}}%%`;

export const C4_CLASSDEF = [
  `classDef system    fill:${surface},stroke:${accent},color:${text}`,
  `classDef container fill:${card},stroke:${accent},color:${text}`,
  `classDef database  fill:${bg},stroke:${muted},color:${text}`,
  `classDef decision  fill:${surface},stroke:${accentHigh},color:${text}`,
  `classDef external  fill:${bg},stroke:${border},color:${text}`,
].join('\n');

// ─── injectTheme ─────────────────────────────────────────────────────────────
// Recebe código Mermaid bruto (sem classDef, sem init) e devolve código
// completo com o tema da marca atual. Remove qualquer classDef ou init
// residual antes de injetar — evita conflito de duplo classDef.

export function injectTheme(rawCode: string): string {
  const stripped = rawCode
    .split('\n')
    .filter(line => {
      const t = line.trim();
      return !t.startsWith('%%{init') && !t.startsWith('classDef');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const firstNewline = stripped.indexOf('\n');

  if (firstNewline === -1) {
    return `${C4_INIT}\n${stripped}\n\n${C4_CLASSDEF}\n`;
  }

  const declaration = stripped.slice(0, firstNewline); // "flowchart TD"
  const rest = stripped.slice(firstNewline);

  return `${C4_INIT}\n${declaration}\n\n${C4_CLASSDEF}\n${rest}`;
}

// ─── Configuração global do Mermaid ─────────────────────────────────────────

export const C4_MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base' as const,
  darkMode: true,
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  flowchart: {
    curve: 'basis' as const,
    padding: 20,
    nodeSpacing: 44,
    rankSpacing: 56,
    htmlLabels: true,
  },
  themeVariables: {
    background:            'transparent',
    mainBkg:               surface,
    secondaryColor:        card,
    tertiaryColor:         border,
    clusterBkg:            bg,

    primaryBorderColor:    accent,
    secondaryBorderColor:  border,
    tertiaryBorderColor:   accent,
    lineColor:             accent,
    nodeBorder:            accent,

    primaryColor:          surface,
    primaryTextColor:      text,
    secondaryTextColor:    '#E4E4E7',
    tertiaryTextColor:     muted,
    nodeTextColor:         text,
    titleColor:            accentHigh,

    edgeLabelBackground:   bg,

    clusterBorder:         border,
    clusterTextColor:      accentHigh,

    actorBkg:              surface,
    actorBorder:           accent,
    actorTextColor:        text,
    actorLineColor:        border,
    signalColor:           muted,
    signalTextColor:       text,
    noteBkgColor:          card,
    noteBorderColor:       accent,
    noteTextColor:         '#E4E4E7',
    labelBoxBkgColor:      surface,
    labelBoxBorderColor:   accent,
    labelTextColor:        text,
    loopTextColor:         accentHigh,

    pie1: accent,
    pie2: muted,
    pie3: accentHigh,
    pie4: border,
    pie5: surface,
    pie6: card,
    pieTitleTextColor:     text,
    pieSectionTextColor:   text,
    pieLegendTextColor:    '#E4E4E7',
    pieStrokeColor:        bg,
  },
} as const;

export type C4NodeType = 'system' | 'container' | 'database' | 'decision' | 'external';
