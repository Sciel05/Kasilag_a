import { PlanType } from '../types';
import { PaletteColorKey, typeColorPalette, TypeColorConfig } from '../theme';

export type TypeColorMapping = Record<PlanType, PaletteColorKey>;

const defaultTypeColors: TypeColorMapping = {
  exam: 'rose',
  study: 'blue',
  deadline: 'peach',
  other: 'slate',
};

// In-memory store for settings
let localTypeColors: TypeColorMapping = { ...defaultTypeColors };

type SettingsListener = (mapping: TypeColorMapping) => void;
const listeners = new Set<SettingsListener>();

export const settingsService = {
  async getTypeColors(): Promise<TypeColorMapping> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { ...localTypeColors };
  },

  getTypeColorsSync(): TypeColorMapping {
    return { ...localTypeColors };
  },

  getTypeThemeSync(type: PlanType): TypeColorConfig {
    const key = localTypeColors[type] || 'slate';
    return typeColorPalette[key] || typeColorPalette.slate;
  },

  async setTypeColor(type: PlanType, colorKey: PaletteColorKey): Promise<TypeColorMapping> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    localTypeColors = {
      ...localTypeColors,
      [type]: colorKey,
    };
    const updated = { ...localTypeColors };
    listeners.forEach((fn) => fn(updated));
    return updated;
  },

  subscribe(listener: SettingsListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

