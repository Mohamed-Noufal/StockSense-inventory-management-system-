import React from 'react';

interface ItemPartThumbnailProps {
  sku?: string;
  category?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ItemPartThumbnail renders crisp, vector-based industrial 3D isometric thumbnails
 * for oilfield machinery, valves, drilling parts, lubricants, gaskets, and PPE.
 */
export const ItemPartThumbnail: React.FC<ItemPartThumbnailProps> = ({
  sku = '',
  category = '',
  name = '',
  size = 'sm',
  className = '',
}) => {
  const dim = size === 'lg' ? 64 : size === 'md' ? 48 : 38;
  const lowerName = name.toLowerCase();
  const lowerSku = sku.toLowerCase();
  const lowerCat = category.toLowerCase();

  // Determine glyph type from item attributes
  let partType = 'pump';
  if (lowerName.includes('valve') || lowerSku.includes('pv') || lowerSku.includes('vlv')) {
    partType = 'valve';
  } else if (lowerName.includes('drill') || lowerSku.includes('db') || lowerName.includes('bit')) {
    partType = 'drill';
  } else if (lowerName.includes('lubricant') || lowerName.includes('oil') || lowerSku.includes('lo') || lowerSku.includes('lub')) {
    partType = 'oil';
  } else if (lowerName.includes('filter') || lowerSku.includes('fc') || lowerSku.includes('flt')) {
    partType = 'filter';
  } else if (lowerName.includes('gasket') || lowerSku.includes('gs') || lowerSku.includes('gsk') || lowerName.includes('seal')) {
    partType = 'gasket';
  } else if (lowerName.includes('fluid') || lowerName.includes('additive') || lowerSku.includes('df')) {
    partType = 'additive';
  } else if (lowerName.includes('motor') || lowerSku.includes('em')) {
    partType = 'motor';
  } else if (lowerName.includes('hose') || lowerSku.includes('hh')) {
    partType = 'hose';
  } else if (lowerName.includes('helmet') || lowerName.includes('ppe') || lowerSku.includes('sh') || lowerName.includes('glove')) {
    partType = 'ppe';
  } else if (lowerCat.includes('pipe') || lowerCat.includes('tube')) {
    partType = 'valve';
  } else if (lowerCat.includes('chemical')) {
    partType = 'additive';
  }

  // Render dedicated vector glyph based on part type
  const renderGraphic = () => {
    switch (partType) {
      case 'valve':
        return (
          // Isometric Pressure Valve
          <g transform="translate(4, 4)">
            <defs>
              <linearGradient id={`valveGrad-${sku}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            {/* Flange Pipe body */}
            <path d="M6 14 L26 14 L26 18 L6 18 Z" fill="url(#valveGrad-` + sku + `)" opacity="0.9" />
            <rect x="4" y="11" width="4" height="10" rx="1" fill="#cbd5e1" />
            <rect x="24" y="11" width="4" height="10" rx="1" fill="#cbd5e1" />
            {/* Valve center chamber */}
            <circle cx="16" cy="16" r="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Actuator Stem & Wheel */}
            <rect x="14.5" y="6" width="3" height="7" fill="#cbd5e1" />
            <ellipse cx="16" cy="6" rx="7" ry="2.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          </g>
        );

      case 'drill':
        return (
          // Tungsten Carbide Drill Bit
          <g transform="translate(4, 4)">
            <defs>
              <linearGradient id={`drillGrad-${sku}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            {/* Spiral flutes */}
            <path d="M12 28 L14 4 L18 4 L20 28 Z" fill="url(#drillGrad-` + sku + `)" />
            <path d="M14 6 L18 10 M14 12 L18 16 M14 18 L18 22 M14 24 L18 28" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
            {/* Chisel Point */}
            <polygon points="14,4 16,1 18,4" fill="#cbd5e1" />
            {/* Shank base */}
            <rect x="13" y="24" width="6" height="5" rx="1" fill="#475569" />
          </g>
        );

      case 'oil':
        return (
          // Industrial Lubricant Oil Canister / Drum
          <g transform="translate(4, 4)">
            <defs>
              <linearGradient id={`oilGrad-${sku}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* Canister Body */}
            <rect x="8" y="10" width="16" height="18" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
            {/* Handle & Spout */}
            <path d="M10 10 L10 6 L14 6 L14 10" fill="none" stroke="#64748b" strokeWidth="1.5" />
            <rect x="18" y="7" width="4" height="4" rx="1" fill="#f59e0b" />
            {/* Viscosity badge / drop */}
            <path d="M16 16 C16 16 12 21 12 23 C12 25.2 13.8 27 16 27 C18.2 27 20 25.2 20 23 C20 21 16 16 16 16 Z" fill="url(#oilGrad-` + sku + `)" />
          </g>
        );

      case 'filter':
        return (
          // High-Flow Filter Cartridge
          <g transform="translate(4, 4)">
            {/* Filter Cylinder */}
            <rect x="9" y="5" width="14" height="22" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
            {/* Pleated Mesh Rows */}
            <line x1="9" y1="9" x2="23" y2="9" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="9" y1="13" x2="23" y2="13" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="9" y1="17" x2="23" y2="17" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="9" y1="21" x2="23" y2="21" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="9" y1="25" x2="23" y2="25" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            {/* End Caps */}
            <rect x="7" y="3" width="18" height="3" rx="1" fill="#94a3b8" />
            <rect x="7" y="26" width="18" height="3" rx="1" fill="#94a3b8" />
          </g>
        );

      case 'gasket':
        return (
          // Metallic Ring Joint Gasket
          <g transform="translate(4, 4)">
            {/* Concentric high-precision rings */}
            <circle cx="16" cy="16" r="12" fill="none" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="16" cy="16" r="7" fill="#0b1320" stroke="#475569" strokeWidth="1.5" />
            {/* Bolt holes */}
            <circle cx="16" cy="6" r="1.5" fill="#cbd5e1" />
            <circle cx="16" cy="26" r="1.5" fill="#cbd5e1" />
            <circle cx="6" cy="16" r="1.5" fill="#cbd5e1" />
            <circle cx="26" cy="16" r="1.5" fill="#cbd5e1" />
          </g>
        );

      case 'additive':
        return (
          // Chemical Fluid Drum / Container
          <g transform="translate(4, 4)">
            <defs>
              <linearGradient id={`addGrad-${sku}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            {/* Barrel Body */}
            <rect x="8" y="6" width="16" height="20" rx="3" fill="url(#addGrad-` + sku + `)" stroke="#94a3b8" strokeWidth="1" />
            <line x1="8" y1="12" x2="24" y2="12" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
            <line x1="8" y1="19" x2="24" y2="19" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
            {/* Hazardous / High-Grade Diamond */}
            <polygon points="16,13 19,16 16,19 13,16" fill="#f8fafc" opacity="0.9" />
          </g>
        );

      case 'motor':
        return (
          // Heavy-Duty Electric Motor
          <g transform="translate(4, 4)">
            {/* Stator body with cooling fins */}
            <rect x="6" y="8" width="16" height="16" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
            <line x1="9" y1="8" x2="9" y2="24" stroke="#94a3b8" strokeWidth="1" />
            <line x1="12" y1="8" x2="12" y2="24" stroke="#94a3b8" strokeWidth="1" />
            <line x1="15" y1="8" x2="15" y2="24" stroke="#94a3b8" strokeWidth="1" />
            <line x1="18" y1="8" x2="18" y2="24" stroke="#94a3b8" strokeWidth="1" />
            {/* Rotor shaft */}
            <rect x="22" y="14" width="6" height="4" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
            {/* Terminal box */}
            <rect x="10" y="4" width="8" height="4" rx="1" fill="#475569" />
          </g>
        );

      case 'hose':
        return (
          // High Pressure Armored Hose
          <g transform="translate(4, 4)">
            {/* Coiled armored hose */}
            <circle cx="16" cy="16" r="10" fill="none" stroke="#334155" strokeWidth="4.5" strokeDasharray="3,1" />
            <circle cx="16" cy="16" r="10" fill="none" stroke="#64748b" strokeWidth="2.5" />
            {/* Brass / Steel Couplings */}
            <rect x="14" y="2" width="6" height="5" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            <rect x="23" y="13" width="5" height="6" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
          </g>
        );

      case 'ppe':
        return (
          // Oilfield Safety Hard Hat
          <g transform="translate(4, 4)">
            {/* Hard hat dome */}
            <path d="M7 19 C7 10 11 6 16 6 C21 6 25 10 25 19 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            {/* Brim */}
            <path d="M4 19 L28 19 C28 19 26 22 16 22 C6 22 4 19 4 19 Z" fill="#ca8a04" />
            {/* Suspension crest */}
            <path d="M14 7 L18 7 L17 14 L15 14 Z" fill="#fef08a" />
          </g>
        );

      case 'pump':
      default:
        return (
          // Isometric Hydraulic Pump (Reference design item #1)
          <g transform="translate(4, 4)">
            <defs>
              <linearGradient id={`pumpGrad-${sku}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            {/* Isometric Block Base */}
            <path d="M16 4 L27 10 L27 22 L16 28 L5 22 L5 10 Z" fill="url(#pumpGrad-` + sku + `)" stroke="#334155" strokeWidth="1" />
            {/* Top Cylinder / Manifold */}
            <ellipse cx="16" cy="11" rx="6" ry="3.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
            <circle cx="16" cy="11" r="2.5" fill="#475569" />
            {/* Port fittings */}
            <rect x="3" y="13" width="3" height="5" rx="0.5" fill="#94a3b8" />
            <rect x="26" y="13" width="3" height="5" rx="0.5" fill="#94a3b8" />
          </g>
        );
    }
  };

  return (
    <div
      className={`part-thumbnail-wrapper ${className}`}
      style={{
        width: dim,
        height: dim,
        borderRadius: size === 'lg' ? '12px' : '8px',
        background: 'linear-gradient(145deg, #18181b, #0c0c0e)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: size === 'lg' ? '0 8px 16px -4px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
      title={`${name} (${sku})`}
    >
      <svg
        width={dim * 0.85}
        height={dim * 0.85}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderGraphic()}
      </svg>
    </div>
  );
};
