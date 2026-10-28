export const colors = {
  bg: '#FFF4F7',
  surface: '#FFFFFF',
  pinkSoft: '#FCE4EC',
  pinkLine: '#F5CAD7',
  pinkInput: '#EBC4D2',
  pinkTrack: '#F5DDE6',
  pinkAccent: '#E58AAA',
  pinkDot: '#D9568A',
  rose: '#C2416E',
  roseText: '#A8325D',
  blue: '#3B6BD0',
  blueSoft: '#E6EEFC',
  blueTextMuted: '#4F5E7A',
  ink: '#3A2530',
  muted: '#7A5F6B',
  chevron: '#C7A9B5',
} as const;

export type PaletteColorKey =
  | 'rose'
  | 'blue'
  | 'lavender'
  | 'mint'
  | 'peach'
  | 'amber'
  | 'teal'
  | 'slate';

export interface TypeColorConfig {
  key: PaletteColorKey;
  label: string;
  bg: string;
  dot: string;
  text: string;
}

export const typeColorPalette: Record<PaletteColorKey, TypeColorConfig> = {
  rose: {
    key: 'rose',
    label: 'Rose',
    bg: '#FCE4EC',
    dot: '#D9568A',
    text: '#A8325D',
  },
  blue: {
    key: 'blue',
    label: 'Blue',
    bg: '#E6EEFC',
    dot: '#3B6BD0',
    text: '#2C529F',
  },
  lavender: {
    key: 'lavender',
    label: 'Lavender',
    bg: '#F3E8FF',
    dot: '#8B5CF6',
    text: '#6D28D9',
  },
  mint: {
    key: 'mint',
    label: 'Mint',
    bg: '#E6F8EF',
    dot: '#10B981',
    text: '#047857',
  },
  peach: {
    key: 'peach',
    label: 'Peach',
    bg: '#FFECE5',
    dot: '#F97316',
    text: '#C2410C',
  },
  amber: {
    key: 'amber',
    label: 'Amber',
    bg: '#FEF3D6',
    dot: '#F59E0B',
    text: '#B45309',
  },
  teal: {
    key: 'teal',
    label: 'Teal',
    bg: '#E0F7F6',
    dot: '#14B8A6',
    text: '#0F766E',
  },
  slate: {
    key: 'slate',
    label: 'Slate',
    bg: '#EDF1F5',
    dot: '#64748B',
    text: '#334155',
  },
};

export const typography = {
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_700Bold',
    bold: 'DMSans_700Bold',
    monoRegular: 'DMMono_400Regular',
    monoMedium: 'DMMono_500Medium',
    monoBold: 'DMMono_500Medium',
  },
  sizes: {
    screenTitle: 26,
    sectionHeading: 16,
    cardTitle: 15,
    body: 14,
    meta: 13,
    caption: 12,
    tabLabel: 11,
  },
} as const;

export const radii = {
  card: 20,
  cardLarge: 22,
  cardSmall: 18,
  chip: 10,
  button: 16,
  buttonSmall: 8,
  pill: 15,
  tabPill: 15,
  round: 9999,
  badge: 6,
  input: 12,
} as const;

export const spacing = {
  screenPaddingHorizontal: 20,
  sectionGap: 16,
  listGap: 10,
  minTouchTarget: 44,
  tabBarHeight: 84,
} as const;

export const theme = {
  colors,
  typeColorPalette,
  typography,
  radii,
  spacing,
} as const;

export type Theme = typeof theme;
export default theme;
