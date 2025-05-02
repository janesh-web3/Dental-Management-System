import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToothData } from '@/types/patient';

export const procedureColors: { [key: string]: { color: string, description: string } } = {
  'RVG X-Ray': { color: 'bg-slate-500', description: 'RVG X-Ray' },
  'Scaling': { color: 'bg-blue-500', description: 'Scaling' },
  'GIC': { color: 'bg-red-500', description: 'GIC' },
  'Light Cure': { color: 'bg-red-500', description: 'Light Cure' },
  'Extraction': { color: 'bg-red-500', description: 'Tooth Extraction' },
  'DCM': { color: 'bg-red-500', description: 'DCM' },
  'RCT': { color: 'bg-purple-500', description: 'RCT' },
  'RPD': { color: 'bg-slate-500', description: 'RPD' },
  'Complete Denture': { color: 'bg-purple-500', description: 'Complete Denture' },
  'Crown Bridge(Metal)': { color: 'bg-yellow-500', description: 'Crown Bridge(Metal)' },
  'Crown Bridge(Ceramic)': { color: 'bg-yellow-500', description: 'Crown Bridge(Ceramic)' },
  'Crown Bridge(Zirconia)': { color: 'bg-yellow-500', description: 'Crown Bridge(Zirconia)' },
  'Full Mouth Bridge': { color: 'bg-green-500', description: 'Full Mouth Bridge' },
  'Implant': { color: 'bg-emerald-500', description: 'Dental Implant' },
  'Orthodontics': { color: 'bg-indigo-500', description: 'Orthodontic Treatment' },
  'IMF': { color: 'bg-indigo-500', description: 'IMF' },
};

export interface ToothProps {
  number: string;
  position: 'upper' | 'lower';
  selected: boolean;
  onClick: () => void;
  details?: string;
  readOnly?: boolean;
}

// Update the quadrant colors to use proper fill colors
export const quadrantColors = {
  upperRight: 'fill-red-700',
  upperLeft: 'fill-green-700',
  lowerRight: 'fill-blue-700',
  lowerLeft: 'fill-purple-700'
};

const Tooth: React.FC<ToothProps> = ({ 
  number, 
  position, 
  selected, 
  onClick,
  details,
  readOnly
}) => {
  // Add function to determine quadrant color
  const getQuadrantColor = (number: string) => {
    const n = parseInt(number);
    if (n >= 11 && n <= 18) return quadrantColors.upperRight;
    if (n >= 21 && n <= 28) return quadrantColors.upperLeft;
    if (n >= 31 && n <= 38) return quadrantColors.lowerLeft;
    if (n >= 41 && n <= 48) return quadrantColors.lowerRight;
    return '';
  };

  // Determine if tooth is incisor, canine, premolar, or molar based on number
  const getToothType = (number: string) => {
    const n = parseInt(number);
    const position = n % 10;
    
    // Central/lateral incisors (1-2)
    if (position >= 1 && position <= 2) return 'incisor';
    // Canines (3)
    if (position === 3) return 'canine';
    // Premolars (4-5)
    if (position >= 4 && position <= 5) return 'premolar';
    // Molars (6-8)
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
  
  // Updated crown surface patterns for different tooth types (more detailed)
  const getCrownSurfacePath = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M3,8 L17,8 M3,12 L17,12 M5,5 C7,8 13,8 15,5 M4,16 Q10,12 16,16 M7,16 Q10,19 13,16" // Upper molar crown
        : "M3,7 L17,7 M3,11 L17,11 M5,4 C7,7 13,7 15,4 M4,17 Q10,13 16,17 M7,17 Q10,20 13,17"; // Lower molar crown
    } else if (toothType === 'premolar') {
      return isUpper
        ? "M5,8 L15,8 M7,5 Q10,8 13,5 M7,16 Q10,12 13,16" // Upper premolar
        : "M5,7 L15,7 M7,4 Q10,7 13,4 M7,17 Q10,13 13,17"; // Lower premolar
    } else if (toothType === 'incisor') {
      return isUpper
        ? "M6,17 C8,20 12,20 14,17" // Upper incisor cutting edge
        : "M6,7 C8,4 12,4 14,7"; // Lower incisor cutting edge
    } else {
      return isUpper
        ? "M6,17 C8,22 12,22 14,17" // Upper canine cusp (more pointed)
        : "M6,7 C8,2 12,2 14,7"; // Lower canine cusp (more pointed)
    }
  };
  
  // Add root texture for more realism
  const getRootTexturePath = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M5,17 L5,22 M10,17 L10,24 M15,17 L15,22" // Upper molar roots
        : "M5,8 L5,3 M10,8 L10,2 M15,8 L15,3"; // Lower molar roots
    } else if (toothType === 'premolar') {
      return isUpper
        ? "M7,17 L7,22 M13,17 L13,22" // Upper premolar roots
        : "M7,8 L7,3 M13,8 L13,3"; // Lower premolar roots
    } else if (toothType === 'incisor') {
      return isUpper
        ? "M10,17 L10,23" // Upper incisor root
        : "M10,8 L10,2"; // Lower incisor root
    } else {
      return isUpper
        ? "M10,17 L10,24" // Upper canine root (longer)
        : "M10,8 L10,1"; // Lower canine root (longer)
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`
            md:w-14 md:h-20 flex flex-col items-center cursor-pointer
            ${selected ? 'text-primary' : 'text-gray-600'}
          `}>
            <div className={`text-xs ${position === 'upper' ? 'order-1' : 'order-3'}`}>
              {number}
            </div>
            <div className="relative h-5 w-5 md:w-12 md:h-14 order-2 mt-1">
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 20 28" 
                className={`${!readOnly ? 'cursor-pointer' : ''}`}
                onClick={!readOnly ? onClick : undefined}
              >
                {/* Base tooth shape */}
                <path
                  d={getToothPath()}
                  className={`
                    ${selected ? `${getQuadrantColor(number)} stroke-[0.75]` : 'fill-white stroke-gray-400 stroke-[1]'}
                  `}
                />
                
                {/* Crown surface details */}
                <path 
                  d={getCrownSurfacePath()} 
                  className={`stroke-current ${selected ? 'stroke-white opacity-80' : 'stroke-gray-300'}`} 
                  strokeWidth="0.5" 
                  fill="none"
                />
                
                {/* Root texture details */}
                <path 
                  d={getRootTexturePath()}
                  className={`stroke-current ${selected ? 'stroke-white opacity-50' : 'stroke-gray-300'}`} 
                  strokeWidth="0.5" 
                  fill="none"
                />
                
                {/* Add realistic tooth shading */}
                <defs>
                  <radialGradient id={`adultToothGradient-${number}`} cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <path
                  d={getToothPath()}
                  fill={`url(#adultToothGradient-${number})`}
                  className="opacity-70"
                />
              </svg>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooth {number}</p>
          {details && <p>Details: {details}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface DentalChartProps {
  selectedTeeth: { [key: string]: ToothData };
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
    <div className="w-full max-w-5xl mx-auto p-4 border rounded-lg bg-background">
      <div className="text-center mb-4 font-semibold">Adult Dental Chart</div>
      
      <div className="flex flex-col gap-0">
        {/* Upper teeth with separator */}
        <div className="flex justify-center gap-1">
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
              {index === 7 && <div className="border-l-2 border-gray-400 mx-1" />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Horizontal separator */}
        <div className="flex justify-center">
          <div className="border-t-2 border-gray-400 w-[800px]" />
        </div>
        
        {/* Lower teeth with separator */}
        <div className="flex justify-center gap-1">
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
              {index === 7 && <div className="border-l-2 border-gray-400 mx-1" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DentalChart;