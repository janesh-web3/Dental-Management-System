import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DentalChartProps, quadrantColors, ToothProps } from './DentalChart';

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
    if (n >= 51 && n <= 55) return quadrantColors.upperRight;
    if (n >= 61 && n <= 65) return quadrantColors.upperLeft;
    if (n >= 71 && n <= 75) return quadrantColors.lowerLeft;
    if (n >= 81 && n <= 85) return quadrantColors.lowerRight;
    return '';
  };

  // Keep existing getToothType function
  const getToothType = (number: string) => {
    const n = parseInt(number);
    // Central/lateral incisors
    if ([51, 52, 61, 62, 71, 72, 81, 82].includes(n)) return 'incisor';
    // Canines
    if ([53, 63, 73, 83].includes(n)) return 'canine';
    // Molars
    return 'molar';
  };

  const toothType = getToothType(number);
  const isUpper = position === 'upper';

  // Updated SVG paths for different tooth types - primary teeth (more realistic, bigger)
  const getToothPath = () => {
    if (toothType === 'incisor') {
      // Primary incisors are more rounded/bulbous than adult teeth
      return isUpper 
        ? "M4,7 C4,3 7,1 10,1 C13,1 16,3 16,7 C16,10 16,14 15,19 C14,23 12,25 10,25 C8,25 6,23 5,19 C4,14 4,10 4,7 Z" // Upper incisor
        : "M4,3 C4,1 7,0 10,0 C13,0 16,1 16,3 C16,7 16,11 15,19 C14,23 12,25 10,25 C8,25 6,23 5,19 C4,11 4,7 4,3 Z"; // Lower incisor
    } else if (toothType === 'canine') {
      // Primary canines are less pointed than adult canines
      return isUpper
        ? "M4,7 C4,3 7,1 10,1 C13,1 16,3 16,7 C16,10 17,15 14,20 C13,23 11,25 10,25 C9,25 7,23 6,20 C3,15 4,10 4,7 Z" // Upper canine
        : "M4,3 C4,1 7,0 10,0 C13,0 16,1 16,3 C16,7 17,12 14,19 C13,22 11,24 10,24 C9,24 7,22 6,19 C3,12 4,7 4,3 Z"; // Lower canine
    } else {
      // Primary molars are bulkier and more rounded
      return isUpper
        ? "M2,7 C2,3 6,1 10,1 C14,1 18,3 18,7 L18,17 C18,22 14,25 10,25 C6,25 2,22 2,17 Z" // Upper molar
        : "M2,3 C2,1 6,0 10,0 C14,0 18,1 18,3 L18,17 C18,22 14,25 10,25 C6,25 2,22 2,17 Z"; // Lower molar
    }
  };

  // Crown surface details for different tooth types (enhanced)
  const getCrownSurfacePath = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M4,9 L16,9 M4,13 L16,13 M6,5 C8,8 12,8 14,5 M6,17 C8,14 12,14 14,17" // Upper molar crown
        : "M4,8 L16,8 M4,12 L16,12 M6,4 C8,7 12,7 14,4 M6,18 C8,15 12,15 14,18"; // Lower molar crown
    } else if (toothType === 'incisor') {
      return isUpper
        ? "M6,17 C8,20 12,20 14,17" // Upper incisor cutting edge
        : "M6,7 C8,4 12,4 14,7"; // Lower incisor cutting edge
    } else {
      return isUpper
        ? "M6,17 C8,20 12,20 14,17" // Upper canine cusp
        : "M6,7 C8,4 12,4 14,7"; // Lower canine cusp
    }
  };
  
  // Add root texture for baby teeth (shorter roots than adult teeth)
  const getRootTexturePath = () => {
    if (toothType === 'molar') {
      return isUpper
        ? "M5,17 L5,21 M10,17 L10,22 M15,17 L15,21" // Upper molar roots
        : "M5,8 L5,4 M10,8 L10,3 M15,8 L15,4"; // Lower molar roots
    } else if (toothType === 'incisor') {
      return isUpper
        ? "M10,17 L10,22" // Upper incisor root
        : "M10,8 L10,3"; // Lower incisor root
    } else {
      return isUpper
        ? "M10,17 L10,22" // Upper canine root
        : "M10,8 L10,3"; // Lower canine root
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`
            w-8 h-12 md:w-10 md:h-14 flex flex-col items-center cursor-pointer
            ${selected ? 'text-primary' : 'text-gray-600'}
          `}>
            <div className={`text-[10px] md:text-xs ${position === 'upper' ? 'order-1' : 'order-3'}`}>
              {number}
            </div>
            <div className="relative h-4 w-4 md:w-8 md:h-10 order-2 mt-0.5">
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
                
                {/* Add realistic tooth gradients - more prominent for primary teeth */}
                <defs>
                  <radialGradient id={`toothGradient-${number}`} cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <path
                  d={getToothPath()}
                  fill={`url(#toothGradient-${number})`}
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


const ChildDentalChart: React.FC<DentalChartProps> = ({ 
  selectedTeeth, 
  onToothSelect,
  readOnly
}) => {
  const upperTeeth = ['55','54','53','52','51','61','62','63','64','65'];
  const lowerTeeth = ['85','84','83','82','81','71','72','73','74','75'];

  return (
    <div className="w-full max-w-3xl mx-auto p-2 border rounded-lg bg-background shadow-sm">
      <div className="text-center mb-2 text-sm font-semibold text-gray-700">Child Dental Chart (Primary Teeth)</div>
      
      <div className="flex flex-col gap-0">
        {/* Upper teeth with separator */}
        <div className="flex justify-center gap-0.5 md:gap-1">
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
              {index === 4 && <div className="border-l border-gray-300 mx-0.5 md:mx-1" />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Horizontal separator */}
        <div className="flex justify-center py-1">
          <div className="border-t border-gray-300 w-full max-w-xs md:max-w-lg" />
        </div>
        
        {/* Lower teeth with separator */}
        <div className="flex justify-center gap-0.5 md:gap-1">
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
              {index === 4 && <div className="border-l border-gray-300 mx-0.5 md:mx-1" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChildDentalChart;