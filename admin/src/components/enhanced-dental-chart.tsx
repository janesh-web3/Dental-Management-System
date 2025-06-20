import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const procedureColors: { [key: string]: { color: string, description: string } } = {
  'RVG X-Ray': { color: 'bg-slate-500', description: 'RVG X-Ray' },
  'Scaling': { color: 'bg-blue-500', description: 'Scaling' },
  'GIC': { color: 'bg-indigo-500', description: 'GIC' },
  'Light Cure': { color: 'bg-red-500', description: 'Light Cure' },
  'Extraction': { color: 'bg-fuchsia-500', description: 'Tooth Extraction' },
  'DCM': { color: 'bg-rose-500', description: 'DCM' },
  'RCT': { color: 'bg-purple-500', description: 'RCT' },
  'RPD': { color: 'bg-slate-500', description: 'RPD' },
  'Complete Denture': { color: 'bg-purple-500', description: 'Complete Denture' },
  'Crown Bridge(Metal)': { color: 'bg-yellow-500', description: 'Crown Bridge(Metal)' },
  'Crown Bridge(Ceramic)': { color: 'bg-neutral-500', description: 'Crown Bridge(Ceramic)' },
  'Crown Bridge(Zirconia)': { color: 'bg-cyan-500', description: 'Crown Bridge(Zirconia)' },
  'Full Mouth Bridge': { color: 'bg-green-500', description: 'Full Mouth Bridge' },
  'Implant': { color: 'bg-emerald-500', description: 'Dental Implant' },
  'Orthodontics': { color: 'bg-indigo-500', description: 'Orthodontic Treatment' },
  'IMF': { color: 'bg-orange-500', description: 'IMF' },
  'L.C': { color: 'bg-blue-500', description: 'L.C' },
  "Composite Filling": { color: 'bg-teal-500', description: 'Composite Filling' },
  "Restoration": { color: 'bg-slate-500', description: 'Restoration' },
  "Pulpectomy": { color: 'bg-red-500', description: 'Pulpectomy' },
  "UCC 1": { color: 'bg-green-500', description: 'UCC 1' },
  "UCC 2": { color: 'bg-red-500', description: 'UCC 2' },
  "UCC 3": { color: 'bg-blue-500', description: 'UCC 3' },
  "UCC 4": { color: 'bg-purple-500', description: 'UCC 4' },
  "UCC 5": { color: 'bg-pink-500', description: 'UCC 5' },
  "UCC 6": { color: 'bg-yellow-500', description: 'UCC 6' },
  "UCC 7": { color: 'bg-orange-500', description: 'UCC 7' },
  "UCC 8": { color: 'bg-pink-500', description: 'UCC 8' },
};

export interface ToothProps {
  number: string;
  position: 'upper' | 'lower';
  selected: boolean;
  onClick: () => void;
  details?: string;
  readOnly?: boolean;
}

export const quadrantColors = {
  upperRight: '#dc2626', // red-600
  upperLeft: '#16a34a',  // green-600
  lowerRight: '#2563eb', // blue-600
  lowerLeft: '#9333ea'   // purple-600
};

const Tooth: React.FC<ToothProps> = ({ 
  number, 
  position, 
  selected, 
  onClick,
  details,
  readOnly
}) => {
  const getQuadrantColor = (number: string) => {
    const n = parseInt(number);
    if (n >= 11 && n <= 18) return quadrantColors.upperRight;
    if (n >= 21 && n <= 28) return quadrantColors.upperLeft;
    if (n >= 31 && n <= 38) return quadrantColors.lowerLeft;
    if (n >= 41 && n <= 48) return quadrantColors.lowerRight;
    return '#6b7280'; // gray-500 fallback
  };

  const getToothType = (number: string) => {
    const n = parseInt(number);
    const position = n % 10;
    
    if (position >= 1 && position <= 2) return 'incisor';
    if (position === 3) return 'canine';
    if (position >= 4 && position <= 5) return 'premolar';
    return 'molar';
  };

  const toothType = getToothType(number);
  const isUpper = position === 'upper';

  // Updated SVG paths for different tooth types - adult teeth (more realistic)
  const getToothPath = () => {
    if (toothType === 'incisor') {
      return isUpper 
        ? "M4,7 C4,3 7,1 10,1 C13,1 16,3 16,7 C16,10 16,14 16,18 C15,23 12,25 10,25 C8,25 5,23 4,18 C4,14 4,10 4,7 Z" // Upper incisor
        : "M4,3 C4,1 7,0 10,0 C13,0 16,1 16,3 C16,7 16,11 16,19 C15,23 12,25 10,25 C8,25 5,23 4,19 C4,11 4,7 4,3 Z"; // Lower incisor
    } else if (toothType === 'canine') {
      return isUpper
        ? "M4,7 C4,3 7,1 10,1 C13,1 16,3 16,7 C16,11 17,17 14,21 C12,24 11,26 10,26 C9,26 8,24 6,21 C3,17 4,11 4,7 Z" // Upper canine
        : "M4,3 C4,1 7,0 10,0 C13,0 16,1 16,3 C16,7 17,13 14,20 C12,23 11,25 10,25 C9,25 8,23 6,20 C3,13 4,7 4,3 Z"; // Lower canine
    } else if (toothType === 'premolar') {
      return isUpper
        ? "M2,7 C2,3 6,1 10,1 C14,1 18,3 18,7 L18,17 C18,21 14,25 10,25 C6,25 2,21 2,17 Z" // Upper premolar
        : "M2,3 C2,1 6,0 10,0 C14,0 18,1 18,3 L18,17 C18,21 14,25 10,25 C6,25 2,21 2,17 Z"; // Lower premolar
    } else {
      // Molar - more complex with cusps
      return isUpper
        ? "M1,7 C1,3 5,1 10,1 C15,1 19,3 19,7 L19,17 C19,22 15,26 10,26 C5,26 1,22 1,17 Z" // Upper molar
        : "M1,3 C1,1 5,0 10,0 C15,0 19,1 19,3 L19,17 C19,22 15,26 10,26 C5,26 1,22 1,17 Z"; // Lower molar
    }
  };

  // Enhanced surface details for realism
  const getSurfaceDetails = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M5,9 L19,9 M5,13 L19,13 M7,6 C9,9 15,9 17,6 M6,17 Q12,13 18,17 M8,17 Q12,20 16,17"
        : "M5,8 L19,8 M5,12 L19,12 M7,5 C9,8 15,8 17,5 M6,18 Q12,14 18,18 M8,18 Q12,21 16,18";
    } else if (toothType === 'premolar') {
      return isUpper
        ? "M7,9 L17,9 M9,6 Q12,9 15,6 M8,17 Q12,13 16,17"
        : "M7,8 L17,8 M9,5 Q12,8 15,5 M8,18 Q12,14 16,18";
    } else if (toothType === 'incisor') {
      return isUpper
        ? "M8,18 C10,21 14,21 16,18 M10,6 L14,6"
        : "M8,8 C10,5 14,5 16,8 M10,22 L14,22";
    } else {
      return isUpper
        ? "M8,18 C10,23 14,23 16,18 M12,6 L12,8"
        : "M8,8 C10,3 14,3 16,8 M12,20 L12,22";
    }
  };

  // Root structure for different tooth types
  const getRootStructure = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M7,18 L7,24 M12,18 L12,25 M17,18 L17,24"
        : "M7,9 L7,3 M12,9 L12,2 M17,9 L17,3";
    } else if (toothType === 'premolar') {
      return isUpper
        ? "M9,18 L9,24 M15,18 L15,24"
        : "M9,9 L9,3 M15,9 L15,3";
    } else {
      return isUpper
        ? "M12,18 L12,25"
        : "M12,9 L12,2";
    }
  };

  const quadrantColor = getQuadrantColor(number);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`
            relative flex flex-col items-center transition-all duration-200 ease-in-out
            ${!readOnly ? 'cursor-pointer hover:scale-105' : ''}
            ${selected ? 'drop-shadow-lg' : 'hover:drop-shadow-md'}
          `}>
            {/* Tooth number label */}
            <div className={`
              text-xs font-medium mb-1 transition-colors duration-200
              ${position === 'upper' ? 'order-1' : 'order-3'}
              ${selected ? 'text-blue-600 font-semibold' : 'text-gray-700'}
            `}>
              {number}
            </div>

            {/* Tooth SVG container */}
            <div className="relative order-2">
              <svg 
                width="48" 
                height="64" 
                viewBox="0 0 24 28" 
                className={`
                  transition-all duration-200 ease-in-out
                  ${!readOnly ? 'cursor-pointer' : ''}
                  ${selected ? 'filter brightness-110' : 'hover:brightness-105'}
                `}
                onClick={!readOnly ? onClick : undefined}
              >
                {/* Gradient definitions for realistic shading */}
                <defs>
                  <linearGradient id={`toothGradient-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#fefefe" />
                    <stop offset="70%" stopColor="#f8f9fa" />
                    <stop offset="100%" stopColor="#f1f3f4" />
                  </linearGradient>
                  
                  <linearGradient id={`selectedGradient-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={quadrantColor} stopOpacity="0.9" />
                    <stop offset="50%" stopColor={quadrantColor} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={quadrantColor} stopOpacity="0.5" />
                  </linearGradient>

                  <radialGradient id={`highlight-${number}`} cx="30%" cy="20%" r="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                    <stop offset="70%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>

                {/* Main tooth body */}
                <path
                  d={getToothPath()}
                  fill={selected ? `url(#selectedGradient-${number})` : `url(#toothGradient-${number})`}
                  stroke={selected ? quadrantColor : '#d1d5db'}
                  strokeWidth={selected ? "1.5" : "1"}
                  className="transition-all duration-200"
                />

                {/* Realistic highlight overlay */}
                <path
                  d={getToothPath()}
                  fill={`url(#highlight-${number})`}
                  className="opacity-60"
                />

                {/* Surface anatomy details */}
                <g stroke={selected ? 'rgba(255,255,255,0.8)' : '#9ca3af'} 
                   strokeWidth="0.5" 
                   fill="none" 
                   className="opacity-70">
                  <path d={getSurfaceDetails()} />
                </g>

                {/* Root structure */}
                <g stroke={selected ? 'rgba(255,255,255,0.6)' : '#d1d5db'} 
                   strokeWidth="0.4" 
                   fill="none" 
                   className="opacity-50">
                  <path d={getRootStructure()} />
                </g>

                {/* Enamel shine effect */}
                <ellipse
                  cx="12"
                  cy={isUpper ? "8" : "12"}
                  rx="3"
                  ry="1.5"
                  fill="rgba(255,255,255,0.4)"
                  className="opacity-80"
                />
              </svg>

              {/* Selection indicator ring */}
              {selected && (
                <div 
                  className="absolute inset-0 rounded-full border-2 animate-pulse"
                  style={{ borderColor: quadrantColor }}
                />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side={position === 'upper' ? 'top' : 'bottom'}>
          <div className="text-sm">
            <p className="font-medium">Tooth {number}</p>
            <p className="text-xs text-gray-600 capitalize">{toothType}</p>
            {details && <p className="text-xs mt-1">Details: {details}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface DentalChartProps {
  selectedTeeth: { [key: string]: any };
  onToothSelect: (toothNumber: string) => void;
  selectedProcedure?: string;
  readOnly?: boolean;
}

const DentalChart: React.FC<DentalChartProps> = ({ 
  selectedTeeth, 
  onToothSelect,
  readOnly
}) => {
  const upperTeeth = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
  const lowerTeeth = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Chart header with realistic styling */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Adult Dental Chart</h2>
        <div className="text-sm text-gray-600">FDI World Dental Federation Notation</div>
      </div>

      {/* Quadrant color legend */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: quadrantColors.upperRight}}></div>
            <span>Upper Right (11-18)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: quadrantColors.upperLeft}}></div>
            <span>Upper Left (21-28)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: quadrantColors.lowerRight}}></div>
            <span>Lower Right (41-48)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: quadrantColors.lowerLeft}}></div>
            <span>Lower Left (31-38)</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center gap-2">
          {/* Upper teeth row */}
          <div className="flex justify-center items-end gap-1 mb-2">
            {upperTeeth.map((number, index) => (
              <React.Fragment key={number}>
                <Tooth
                  number={number}
                  position="upper"
                  selected={!!selectedTeeth[number]}
                  onClick={() => onToothSelect(number)}
                  details={selectedTeeth[number]?.details}
                  readOnly={readOnly}
                />
                {index === 7 && (
                  <div className="h-16 border-l-2 border-gray-300 mx-2 opacity-50" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Anatomical separation line */}
          <div className="w-full max-w-4xl">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4" />
            <div className="text-center text-xs text-gray-500 mb-4">Occlusal Plane</div>
          </div>
          
          {/* Lower teeth row */}
          <div className="flex justify-center items-start gap-1">
            {lowerTeeth.map((number, index) => (
              <React.Fragment key={number}>
                <Tooth
                  number={number}
                  position="lower"
                  selected={!!selectedTeeth[number]}
                  onClick={() => onToothSelect(number)}
                  details={selectedTeeth[number]?.details}
                  readOnly={readOnly}
                />
                {index === 7 && (
                  <div className="h-16 border-l-2 border-gray-300 mx-2 opacity-50" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Usage instructions */}
      {!readOnly && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Click on teeth to select • Hover for details
        </div>
      )}
    </div>
  );
};

export default DentalChart;