export const NormaliseAnswer = (rawAnswer: string) => 
    rawAnswer
        .replace(/\n/g, '')
        .toLowerCase()
        .trim()
        .replace(/[.,;:!?]$/, '');