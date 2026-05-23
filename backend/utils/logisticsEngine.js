/**
 * Estimate the fuel cost based on vehicle efficiency, fuel prices, cargo weight, and distance
 */
export const calculateFuelCost = (distance, fuelEfficiency, weightKg) => {
  const baseFuelPrice = 1.35; // USD per liter (average commercial diesel)
  
  if (!fuelEfficiency || fuelEfficiency <= 0) {
    fuelEfficiency = 6.0; // Fallback average (6 km/liter)
  }

  // Weight penalty: heavy cargo increases fuel consumption
  // Every 1,000 kg added reduces fuel efficiency by 2%
  const weightInTons = weightKg / 1000;
  const weightPenaltyFactor = 1 - (weightInTons * 0.02);
  const adjustedEfficiency = Math.max(2.0, fuelEfficiency * weightPenaltyFactor); // Don't drop below 2 km/L

  const fuelRequiredLiters = distance / adjustedEfficiency;
  const totalCost = fuelRequiredLiters * baseFuelPrice;
  
  return parseFloat(totalCost.toFixed(2));
};

/**
 * AI-Based Heuristic/Probabilistic delay risk prediction engine.
 * Computes delay probability (0-100%) and categorizes risk ('Low', 'Moderate', 'High').
 */
export const predictDelayRisk = (distance, priority, driverScore, vehicleMileage) => {
  let probability = 5.0; // Base delay probability of 5%

  // 1. Distance Impact
  if (distance > 800) {
    probability += 25.0; // Long haul has high delay risk
  } else if (distance > 400) {
    probability += 15.0;
  } else if (distance > 150) {
    probability += 8.0;
  }

  // 2. Priority Rush Impact
  if (priority === 'Critical') {
    probability += 12.0; // Tighter deadlines can lead to missing delivery windows
  } else if (priority === 'High') {
    probability += 6.0;
  }

  // 3. Driver Quality Impact (higher rating reduces delay probability)
  const scoreDiff = 5.0 - driverScore;
  probability += scoreDiff * 15.0; // If score is 3.0, adds 30% to delay risk

  // 4. Vehicle Reliability Impact (based on mileage - wear & tear)
  if (vehicleMileage > 80000) {
    probability += 10.0; // High mileage, greater breakdown risk
  } else if (vehicleMileage > 40000) {
    probability += 5.0;
  }

  // 5. Environmental Random Factor (Simulating weather/road conditions)
  // Ensures some dynamic shifts in live estimations
  const weatherVariance = Math.random() * 8; // Random 0-8% noise
  probability += weatherVariance;

  // Bound check
  probability = Math.min(99.0, Math.max(1.0, probability));
  probability = parseFloat(probability.toFixed(1));

  // Determine Risk Category
  let riskLevel = 'Low';
  if (probability > 50) {
    riskLevel = 'High';
  } else if (probability > 20) {
    riskLevel = 'Moderate';
  }

  return {
    probability,
    riskLevel,
  };
};
