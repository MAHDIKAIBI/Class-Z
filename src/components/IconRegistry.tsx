import React from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Signal,
  Cpu,
  Binary,
  Server,
  Database,
  Lock,
  ShieldCheck,
  HardDrive,
  Smartphone,
  PhoneCall,
  Phone,
  Home,
  Building2,
  Building,
  Sliders,
  SlidersHorizontal,
  Volume2,
  Mic,
  Headphones,
  Speaker,
  Disc,
  Music,
  Cable,
  Activity,
  Cog,
  Settings,
  Link,
  Link2,
  Gauge,
  Timer,
  Wrench,
  Shield,
  Zap,
  CircleDot,
  TrendingUp,
  Layers,
  Box,
  Share2,
  ArrowRight,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BatteryCharging,
  Mail,
  MessageSquare,
  Search,
  Laptop,
  Monitor,
} from 'lucide-react';

// ============================================================================
// CUSTOM VECTOR PATHS (Exact geometric blueprint silhouettes)
// ============================================================================

// 1. Industrial Lattice Radio Tower (Matching 1.mp4 exactly)
export const CustomCellTowerSvg: React.FC<{ size?: number; color?: string }> = ({
  size = 120,
  color = '#E6D5B8',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Base Feet */}
    <path d="M 20 195 L 80 195" stroke={color} strokeWidth="6" strokeLinecap="round" />
    {/* Main Legs tapering upward */}
    <path d="M 25 195 L 43 55" stroke={color} strokeWidth="5" />
    <path d="M 75 195 L 57 55" stroke={color} strokeWidth="5" />
    {/* Internal Cross Lattice Bars */}
    <path d="M 26 170 L 74 170 M 28 145 L 72 145 M 31 120 L 69 120 M 34 95 L 66 95 M 38 70 L 62 70" stroke={color} strokeWidth="3" />
    {/* Diagonal X-Braces */}
    <path d="M 26 195 L 74 170 M 74 195 L 26 170" stroke={color} strokeWidth="2.5" />
    <path d="M 26 170 L 72 145 M 74 170 L 28 145" stroke={color} strokeWidth="2.5" />
    <path d="M 28 145 L 69 120 M 72 145 L 31 120" stroke={color} strokeWidth="2.5" />
    <path d="M 31 120 L 66 95 M 69 120 L 34 95" stroke={color} strokeWidth="2.5" />
    <path d="M 34 95 L 62 70 M 66 95 L 38 70" stroke={color} strokeWidth="2.5" />
    {/* Top Antenna Head & Panels */}
    <rect x="42" y="40" width="16" height="15" fill={color} />
    <rect x="25" y="22" width="10" height="30" rx="2" fill={color} />
    <rect x="45" y="15" width="10" height="35" rx="2" fill={color} />
    <rect x="65" y="22" width="10" height="30" rx="2" fill={color} />
    {/* Central Spike */}
    <path d="M 50 15 L 50 2" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 2. Op-Amp Operational Amplifier Schematic (Midi-Fi circuit blueprint)
export const CustomOpAmpSvg: React.FC<{ size?: number; color?: string }> = ({
  size = 120,
  color = '#E6D5B8',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Op-Amp Triangle */}
    <polygon points="40,15 40,105 130,60" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
    {/* Inverting (-) Input */}
    <path d="M 10 38 L 40 38" stroke={color} strokeWidth="4" />
    <text x="50" y="44" fill={color} fontSize="20" fontWeight="bold" fontFamily="monospace">-</text>
    {/* Non-Inverting (+) Input */}
    <path d="M 10 82 L 40 82" stroke={color} strokeWidth="4" />
    <text x="48" y="87" fill={color} fontSize="18" fontWeight="bold" fontFamily="monospace">+</text>
    {/* Output Line */}
    <path d="M 130 60 L 155 60" stroke={color} strokeWidth="4" />
    {/* Power Rails (Top/Bottom) */}
    <path d="M 85 38 L 85 10" stroke={color} strokeWidth="3" strokeDasharray="3 3" />
    <path d="M 85 82 L 85 110" stroke={color} strokeWidth="3" strokeDasharray="3 3" />
  </svg>
);

// 3. Vacuum Tube Outline (Midi-Fi vintage preamp)
export const CustomVacuumTubeSvg: React.FC<{ size?: number; color?: string }> = ({
  size = 120,
  color = '#E6D5B8',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Glass Envelope */}
    <path d="M 30 130 C 30 130 20 100 20 60 C 20 25 35 15 60 15 C 85 15 100 25 100 60 C 100 100 90 130 90 130 Z" stroke={color} strokeWidth="4" fill="none" />
    {/* Base & Pins */}
    <rect x="25" y="130" width="70" height="15" rx="3" fill={color} />
    <path d="M 38 145 L 38 158 M 52 145 L 52 158 M 68 145 L 68 158 M 82 145 L 82 158" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Internal Filament & Plates */}
    <path d="M 45 95 L 45 45 M 75 95 L 75 45" stroke={color} strokeWidth="3" />
    <path d="M 40 45 L 80 45" stroke={color} strokeWidth="3" />
    <path d="M 50 80 Q 60 65 70 80" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 4. Bicycle Cassette Cog Cluster (Cycle-Fi drivetrain)
export const CustomBicycleCassetteSvg: React.FC<{ size?: number; color?: string }> = ({
  size = 120,
  color = '#E6D5B8',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer 52T Cog */}
    <circle cx="80" cy="80" r="70" stroke={color} strokeWidth="4" strokeDasharray="8 6" />
    {/* Middle 36T Cog */}
    <circle cx="80" cy="80" r="50" stroke={color} strokeWidth="3.5" strokeDasharray="7 5" />
    {/* Inner 11T Cog */}
    <circle cx="80" cy="80" r="30" stroke={color} strokeWidth="3" strokeDasharray="6 4" />
    {/* Center Freehub Spline */}
    <circle cx="80" cy="80" r="14" fill={color} />
    {/* 4 Lightning Cutouts */}
    <circle cx="80" cy="40" r="6" fill="#030712" />
    <circle cx="80" cy="120" r="6" fill="#030712" />
    <circle cx="40" cy="80" r="6" fill="#030712" />
    <circle cx="120" cy="80" r="6" fill="#030712" />
  </svg>
);

// ============================================================================
// MASTER ICON DIRECTORY (Multi-Niche Whitelist)
// ============================================================================

export const ICON_DIRECTORY: Record<string, React.FC<any>> = {
  // Telecommunications & General Tech (Matching 1.mp4 & pc.mp4)
  'radio-tower': CustomCellTowerSvg,
  'tower': CustomCellTowerSvg,
  'cell-tower': CustomCellTowerSvg,
  'antenna': Radio,
  'radio': Radio,
  'phone-call': PhoneCall,
  'phone': Phone,
  'handset': PhoneCall,
  'smartphone': Smartphone,
  'wifi': Wifi,
  'signal': Signal,
  'cpu': Cpu,
  'chip': Cpu,
  'processor': Cpu,
  'binary': Binary,
  'digital': Binary,
  'server': Server,
  'database': Database,
  'lock': Lock,
  'security': Lock,
  'shield-check': ShieldCheck,
  'hard-drive': HardDrive,
  'battery': BatteryCharging,
  'laptop': Laptop,
  'monitor': Monitor,
  'desk': Monitor,
  'home': Home,
  'house': Home,
  'building-2': Building2,
  'building': Building2,
  'office': Building2,
  'skyscraper': Building,
  'mail': Mail,
  'message': MessageSquare,

  // Midi-Fi & Audio Engineering
  'waveform': Activity,
  'sine-wave': Activity,
  'analog': Activity,
  'activity': Activity,
  'sliders': SlidersHorizontal,
  'fader': SlidersHorizontal,
  'gain': SlidersHorizontal,
  'preamp': SlidersHorizontal,
  'op-amp': CustomOpAmpSvg,
  'vacuum-tube': CustomVacuumTubeSvg,
  'tube': CustomVacuumTubeSvg,
  'mic': Mic,
  'microphone': Mic,
  'headphones': Headphones,
  'speaker': Speaker,
  'volume': Volume2,
  'disc': Disc,
  'vinyl': Disc,
  'cable': Cable,
  'xlr': Cable,
  'music': Music,
  'vu-meter': Gauge,

  // Cycle-Fi & Mechanical Engineering
  'bicycle': Cog,
  'bike': Cog,
  'cassette': CustomBicycleCassetteSvg,
  'cog': Cog,
  'sprocket': Cog,
  'gear': Settings,
  'settings': Settings,
  'chain': Link2,
  'link': Link,
  'bearing': CircleDot,
  'hub': CircleDot,
  'gauge': Gauge,
  'pressure': Gauge,
  'torque': Gauge,
  'cadence': Timer,
  'speedometer': Gauge,
  'wrench': Wrench,
  'tool': Wrench,
  'shield': Shield,
  'zap': Zap,
  'gradient': TrendingUp,
  'power': Zap,

  // Conceptual & Flow
  'layers': Layers,
  'box': Box,
  'network': Share2,
  'transfer': ArrowRight,
  'cycle': Repeat,
  'check': CheckCircle2,
  'alert': AlertTriangle,
  'fire': Flame,
};

// ============================================================================
// CREAM VECTOR ICON ENGINE (With 3D Drop-Extrusion Shader)
// ============================================================================

interface CreamVectorIconProps {
  iconKey: string;
  size?: number;
  label?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CreamVectorIcon: React.FC<CreamVectorIconProps> = ({
  iconKey,
  size = 110,
  label,
  accentColor = '#E5C07B',
  style,
}) => {
  const normalizedKey = (iconKey || 'cpu').trim().toLowerCase();
  const IconComponent = ICON_DIRECTORY[normalizedKey];

  // 3D Extrusion Shader:
  // 1. Hard 6px edge (#8C7A5B) gives depth/thickness
  // 2. Soft 24px ambient blur gives elevation off the blueprint
  const extrusionFilter =
    'drop-shadow(0px 6px 0px #8C7A5B) drop-shadow(0px 16px 24px rgba(0,0,0,0.75))';

  // ────────────────────────────────────────────────────────────────────────
  // A. DIRECT MATCH: Found in Whitelist Directory
  // ────────────────────────────────────────────────────────────────────────
  if (IconComponent) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          filter: extrusionFilter,
          ...style,
        }}
      >
        <div style={{ color: '#E6D5B8' }}>
          <IconComponent size={size} strokeWidth={2.2} color="#E6D5B8" />
        </div>
        {label && label.trim() !== '' && (
          <div
            style={{
              fontFamily: '"JetBrains Mono", "Courier New", monospace',
              fontSize: Math.max(12, Math.round(size * 0.16)),
              fontWeight: 800,
              color: '#080D1A',
              backgroundColor: '#E6D5B8',
              padding: '3px 12px',
              borderRadius: 4,
              letterSpacing: 2,
              textTransform: 'uppercase',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            }}
          >
            {label}
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // B. TECHNICAL SCHEMATIC TOKEN: Scalable Fallback for Any Niche
  // (Renders a high-tech blueprint hardware token with the label spec)
  // ────────────────────────────────────────────────────────────────────────
  const displayLabel = (label || normalizedKey).slice(0, 12).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: size * 1.3,
        height: size * 1.15,
        backgroundColor: '#0E1726',
        border: '3px solid #E6D5B8',
        borderRadius: 12,
        padding: 12,
        boxSizing: 'border-box',
        filter: extrusionFilter,
        position: 'relative',
        ...style,
      }}
    >
      {/* Corner Blueprint Screws */}
      <div style={{ position: 'absolute', top: 6, left: 6, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#E6D5B8' }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#E6D5B8' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#E6D5B8' }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#E6D5B8' }} />

      {/* Internal Schematic Primitive (Cpu / Chip) */}
      <Cpu size={Math.round(size * 0.5)} strokeWidth={2.2} color="#E6D5B8" />

      {/* Technical Spec Monospace Badge */}
      <div
        style={{
          marginTop: 8,
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          fontSize: Math.max(11, Math.round(size * 0.14)),
          fontWeight: 800,
          color: accentColor,
          letterSpacing: 1.5,
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
      </div>
    </div>
  );
};
