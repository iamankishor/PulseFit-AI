export function generateDiet(i) {
  const {
    age,
    gender,
    weightKg,
    heightCm,
    activity,
    goal,
    dietType
  } = i;
  const w = Number(weightKg),
    h = Number(heightCm),
    a = Number(age);
  if (!(a >= 13 && a <= 100 && w >= 25 && w <= 400 && h >= 100 && h <= 250)) throw Error('Invalid body measurements');
  const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (gender === 'male' ? 5 : -161));
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9
  };
  if (!multipliers[activity]) throw Error('Invalid activity');
  const tdee = Math.round(bmr * multipliers[activity]);
  const targetCalories = Math.max(1200, Math.round(tdee * (goal === 'fat-loss' ? .8 : goal === 'muscle-gain' ? 1.1 : 1)));
  const protein = Math.round(w * (goal === 'fat-loss' ? 1.8 : goal === 'muscle-gain' ? 2 : 1.6));
  const fats = Math.round(targetCalories * .25 / 9);
  const carbs = Math.round((targetCalories - protein * 4 - fats * 9) / 4);
  const veg = ['Oats + milk + banana', 'Dal + rice + sabzi', 'Curd + fruit', 'Paneer curry + roti'];
  const nonveg = ['Eggs + oats + banana', 'Chicken + rice + vegetables', 'Greek yogurt + fruit', 'Fish + roti + sabzi'];
  return {
    inputs: i,
    bmr,
    tdee,
    targetCalories,
    macros: {
      protein,
      carbs,
      fats
    },
    meals: (dietType === 'non-veg' ? nonveg : veg).map((name, j) => ({
      name,
      calories: Math.round(targetCalories * [.25, .35, .1, .3][j])
    }))
  };
}
