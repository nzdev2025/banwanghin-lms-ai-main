// src/icons/Icon.jsx (Enhanced to use lucide-react)
import React from 'react';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, size = 24, className, ...props }) => {
  // 1. Check if it's a direct Lucide icon
  const LucideIcon = LucideIcons[name];

  // 2. Custom Overrides (if any specific SVGs are needed that differ from Lucide, keep them here)
  const customIcons = {
    // ... We can keep the manual SVGs here if strictly necessary, 
    // but for now, let's rely on Lucide for consistency and breadth.
    // If we need a custom one not in Lucide, we add it here.
    QrCode: (p) => (
      <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
      </svg>
    ),
  };

  const IconComponent = customIcons[name] || LucideIcon;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} className={className} {...props} />;
};

export default Icon;
