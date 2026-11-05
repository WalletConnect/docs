/**
 * Mintlify-compatible <Icon icon="wallet" />: Mintlify uses Font Awesome names, so we resolve
 * them against react-icons' Font Awesome 6 set, falling back to Lucide and Simple Icons.
 */
import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import * as fa from 'react-icons/fa6';
import * as lu from 'react-icons/lu';
import * as si from 'react-icons/si';

// Font Awesome Pro names used in the docs that aren't in the free set.
const aliases: Record<string, IconType> = {
  browser: lu.LuAppWindow,
  window: lu.LuAppWindowMac,
  'rectangle-terminal': lu.LuSquareTerminal,
};

const pascal = (name: string) =>
  name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

export function resolveIcon(name: string): IconType | undefined {
  if (aliases[name]) return aliases[name];
  const key = pascal(name);
  return (
    (fa as Record<string, IconType>)[`Fa${key}`] ??
    (lu as Record<string, IconType>)[`Lu${key}`] ??
    (si as Record<string, IconType>)[`Si${key}`]
  );
}

export interface IconProps {
  icon: string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Mintlify prop, accepted for compatibility. */
  iconType?: string;
}

export function Icon({ icon, size, color, className, style }: IconProps) {
  // Mintlify also accepts image URLs as icons.
  if (icon.startsWith('/') || icon.startsWith('http')) {
    return <img src={icon} alt="" width={size} height={size} className={className} style={style} />;
  }
  const Resolved = resolveIcon(icon);
  if (!Resolved) {
    if (process.env.NODE_ENV === 'development') console.warn(`[Icon] unknown icon: ${icon}`);
    return null;
  }
  return (
    <Resolved size={size ? Number(size) : undefined} color={color} className={className} style={style} aria-hidden />
  );
}
