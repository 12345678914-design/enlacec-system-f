/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  iconSize?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name = '', className = 'w-10 h-10 rounded-xl', iconSize }) => {
  // Check if src is valid (not null, not undefined, not empty string)
  const hasImage = src && src.trim() !== '';

  if (hasImage) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
      />
    );
  }

  // Generate beautiful initials or fallback to User icon
  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    
    // Use first letter of first name and first letter of last name
    const firstInitial = parts[0][0];
    const lastInitial = parts[parts.length - 1][0];
    return (firstInitial + lastInitial).toUpperCase();
  };

  const initials = getInitials(name);

  // Pick a dynamic elegant background color based on name hash
  const getBgColor = (fullName: string) => {
    if (!fullName) return 'from-indigo-500 to-purple-600';
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-fuchsia-600',
      'from-cyan-500 to-blue-600'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const bgGradient = getBgColor(name);

  // Estimate icon size based on tailwind width classes if not provided
  let calculatedIconSize = iconSize;
  if (!calculatedIconSize) {
    if (className.includes('w-7.5') || className.includes('h-7.5')) {
      calculatedIconSize = 13;
    } else if (className.includes('w-5') || className.includes('h-5')) {
      calculatedIconSize = 9;
    } else if (className.includes('w-10') || className.includes('h-10')) {
      calculatedIconSize = 16;
    } else if (className.includes('w-16') || className.includes('h-16')) {
      calculatedIconSize = 24;
    } else {
      calculatedIconSize = 16;
    }
  }

  return (
    <div className={`${className} bg-gradient-to-br ${bgGradient} text-white flex items-center justify-center font-bold tracking-wider select-none shrink-0 border border-white/10 shadow-sm overflow-hidden`}>
      {initials ? (
        <span className="text-[38%] leading-none font-sans uppercase">{initials}</span>
      ) : (
        <User size={calculatedIconSize} className="opacity-90" />
      )}
    </div>
  );
};
