export type ThemePreset = 
  | 'financial_noir' 
  | 'tactical_dossier' 
  | 'cyber_blueprint' 
  | 'vintage_archive' 
  | 'luxury_prestige';

export interface ThemeConfig {
  bgColor: string;
  bgGradient: string;
  gridSvg: string;
  gridSize: string;
  accentColor: string;
  secondaryAccent: string;
  vignetteStyle: string;
  fontFamily: string;
  tapeColor: string;
  // Cinematic 2.5D Lighting
  spotlightColor: string;
  spotlightIntensity: number;
  shadowColor: string;
  shadowIntensity: number;
  particleGlow: string;
}

export const THEME_REGISTRY: Record<ThemePreset, ThemeConfig> = {
  financial_noir: {
    bgColor: '#030d07',
    bgGradient: 'radial-gradient(circle at 60% 40%, rgba(0, 255, 102, 0.08) 0%, rgba(0,0,0,0.95) 75%)',
    gridSvg: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='rgba(0, 255, 102, 0.04)' stroke-width='1'/%3E%3Crect x='0' y='0' width='60' height='60' fill='none' stroke='rgba(255, 255, 255, 0.02)' stroke-width='1'/%3E%3C/svg%3E")`,
    gridSize: '60px 60px',
    accentColor: '#00FF66',
    secondaryAccent: '#D4AF37',
    vignetteStyle: 'inset 0 0 300px rgba(0,0,0,0.95), inset 0 0 80px rgba(0,255,102,0.1)',
    fontFamily: '"Impact", "Geist", sans-serif',
    tapeColor: 'rgba(0, 255, 102, 0.7)',
    spotlightColor: 'rgba(0, 255, 102, 0.15)',
    spotlightIntensity: 0.9,
    shadowColor: 'rgba(0, 40, 15, 0.95)',
    shadowIntensity: 0.85,
    particleGlow: '0 0 20px rgba(0, 255, 102, 0.4)',
  },

  tactical_dossier: {
    bgColor: '#0a0d12',
    bgGradient: 'radial-gradient(circle at 50% 50%, rgba(255, 42, 77, 0.06) 0%, rgba(5, 7, 10, 0.98) 80%)',
    gridSvg: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255, 255, 255, 0.08)'/%3E%3Cpath d='M 0 20 L 40 20 M 20 0 L 20 40' stroke='rgba(255, 42, 77, 0.03)' stroke-width='0.5'/%3E%3C/svg%3E")`,
    gridSize: '40px 40px',
    accentColor: '#FF2A4D',
    secondaryAccent: '#FFAA00',
    vignetteStyle: 'inset 0 0 350px rgba(0,0,0,0.98), inset 0 0 100px rgba(255, 42, 77, 0.12)',
    fontFamily: '"Courier New", "JetBrains Mono", monospace',
    tapeColor: 'rgba(255, 42, 77, 0.8)',
    spotlightColor: 'rgba(255, 42, 77, 0.12)',
    spotlightIntensity: 0.85,
    shadowColor: 'rgba(40, 5, 10, 0.95)',
    shadowIntensity: 0.9,
    particleGlow: '0 0 20px rgba(255, 42, 77, 0.4)',
  },

  cyber_blueprint: {
    bgColor: '#020612',
    bgGradient: 'radial-gradient(circle at 70% 30%, rgba(0, 229, 255, 0.07) 0%, rgba(2, 4, 8, 0.98) 70%)',
    gridSvg: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 80 0 L 0 80 M 0 0 L 80 80' stroke='rgba(0, 229, 255, 0.025)' stroke-width='1'/%3E%3Crect width='80' height='80' fill='none' stroke='rgba(0, 229, 255, 0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
    gridSize: '80px 80px',
    accentColor: '#00E5FF',
    secondaryAccent: '#7928CA',
    vignetteStyle: 'inset 0 0 300px rgba(0,0,0,0.95), inset 0 0 60px rgba(0, 229, 255, 0.15)',
    fontFamily: '"Inter", "Geist", sans-serif',
    tapeColor: 'rgba(0, 229, 255, 0.7)',
    spotlightColor: 'rgba(0, 229, 255, 0.12)',
    spotlightIntensity: 0.8,
    shadowColor: 'rgba(2, 10, 30, 0.95)',
    shadowIntensity: 0.85,
    particleGlow: '0 0 25px rgba(0, 229, 255, 0.5)',
  },

  vintage_archive: {
    bgColor: '#120d09',
    bgGradient: 'radial-gradient(circle at 40% 60%, rgba(212, 175, 55, 0.07) 0%, rgba(10, 7, 5, 0.98) 80%)',
    gridSvg: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgba(212, 175, 55, 0.06)'/%3E%3C/svg%3E")`,
    gridSize: '20px 20px',
    accentColor: '#D4AF37',
    secondaryAccent: '#E65100',
    vignetteStyle: 'inset 0 0 350px rgba(0,0,0,0.98), inset 0 0 100px rgba(80, 50, 20, 0.3)',
    fontFamily: '"Playfair Display", "Georgia", serif',
    tapeColor: 'rgba(212, 175, 55, 0.7)',
    spotlightColor: 'rgba(212, 175, 55, 0.1)',
    spotlightIntensity: 0.7,
    shadowColor: 'rgba(30, 20, 5, 0.95)',
    shadowIntensity: 0.8,
    particleGlow: '0 0 15px rgba(212, 175, 55, 0.3)',
  },

  luxury_prestige: {
    bgColor: '#050505',
    bgGradient: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.98) 85%)',
    gridSvg: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='8' height='8' fill='rgba(255,255,255,0.02)'/%3E%3Crect x='8' y='8' width='8' height='8' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E")`,
    gridSize: '16px 16px',
    accentColor: '#E5C07B',
    secondaryAccent: '#FFFFFF',
    vignetteStyle: 'inset 0 0 300px rgba(0,0,0,0.98)',
    fontFamily: '"Geist", "Inter", sans-serif',
    tapeColor: 'rgba(229, 192, 123, 0.8)',
    spotlightColor: 'rgba(255, 255, 255, 0.08)',
    spotlightIntensity: 0.6,
    shadowColor: 'rgba(0, 0, 0, 0.98)',
    shadowIntensity: 0.95,
    particleGlow: '0 0 20px rgba(229, 192, 123, 0.3)',
  }
};
