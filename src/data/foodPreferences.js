export const FORBIDDEN_FOOD_OPTIONS = [
  { value: 'peanuts', label: 'Peanuts' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'red_meat', label: 'Red Meat' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'soy', label: 'Soy' },
  { value: 'mushrooms', label: 'Mushrooms' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'spicy', label: 'Spicy Food' },
];

export const forbiddenFoodLabel = (value) =>
  FORBIDDEN_FOOD_OPTIONS.find((food) => food.value === value)?.label || value;
