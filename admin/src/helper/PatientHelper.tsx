export const getToothPosition = (toothNumber: string): string => {
    const num = parseInt(toothNumber);
    if ([11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28].includes(num)) return 'Upper';
    return 'Lower';
  };

export const getToothType = (toothNumber: string): string => {
    const num = parseInt(toothNumber.slice(-1));
    if ([1, 2].includes(num)) return 'Incisor';
    if (num === 3) return 'Canine';
    if ([4, 5].includes(num)) return 'Premolar';
    if ([6, 7, 8].includes(num)) return 'Molar';
    return '';
  };

  
export const getToothSide = (toothNumber: string): string => {
    const num = parseInt(toothNumber);
    if ([11,12,13,14,15,16,17,18].includes(num)) return 'Right';
    if ([21,22,23,24,25,26,27,28].includes(num)) return 'Left';
    if ([41,42,43,44,45,46,47,48].includes(num)) return 'Right';
    if ([31,32,33,34,35,36,37,38].includes(num)) return 'Left';
    return '';
  };