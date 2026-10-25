export interface Ingredient {
  id: string;
  name: string;
  icon: string;
  temperature: number;
  density: number;
  magicPower: number;
}

// Official README order; Level 1 uses the first six, Level 2 may use all eight.
export const INGREDIENTS: readonly Ingredient[] = [
  {
    id: 'dragon-tears',
    name: 'Dragon Tears',
    icon: 'dragon-tears',
    temperature: 25,
    density: 8,
    magicPower: 10,
  },
  {
    id: 'fairy-dust',
    name: 'Fairy Dust',
    icon: 'fairy-dust',
    temperature: 12,
    density: 9,
    magicPower: 12,
  },
  {
    id: 'frost-lotus',
    name: 'Frost Lotus',
    icon: 'frost-lotus',
    temperature: -18,
    density: 4,
    magicPower: 14,
  },
  {
    id: 'mandrake-root',
    name: 'Mandrake Root',
    icon: 'mandrake-root',
    temperature: -5,
    density: 20,
    magicPower: 8,
  },
  {
    id: 'caustic-acid',
    name: 'Caustic Acid',
    icon: 'caustic-acid',
    temperature: 10,
    density: 14,
    magicPower: 22,
  },
  {
    id: 'essence-of-the-void',
    name: 'Essence of the Void',
    icon: 'essence-of-the-void',
    temperature: -20,
    density: -10,
    magicPower: 40,
  },
  {
    id: 'phoenix-feather',
    name: 'Phoenix Feather',
    icon: 'phoenix-feather',
    temperature: 50,
    density: -10,
    magicPower: 30,
  },
  {
    id: 'toad-slime',
    name: 'Toad Slime',
    icon: 'toad-slime',
    temperature: 5,
    density: 30,
    magicPower: 0,
  },
];
