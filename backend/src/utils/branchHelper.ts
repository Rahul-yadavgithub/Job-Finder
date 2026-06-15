export function getBranchGroup(branch: string): 'Circuital' | 'Core' {
  const circuital = [
    'MNC',
    'CSE',
    'EE',
    'ECE',
    'EP'
  ];

  return circuital.includes(branch) ? 'Circuital' : 'Core';
}
