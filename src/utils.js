// Calculation Logic

export const calculateDailyRate = (basicSalary) => {
  // Formula: (Basic * 12) / 261
  return (basicSalary * 12) / 261;
};

export const calculateHourlyRate = (dailyRate) => {
  return dailyRate / 8;
};

export const calculateHolidayPay = (basicSalary, type, hours) => {
  if (!hours || hours <= 0) return 0;
  
  const dailyRate = calculateDailyRate(basicSalary);
  // Use daily-rate based computation for clarity:
  // holidayPay = dailyRate * multiplier * (hours / 8)
  // Regular: multiplier = 1.0 (100% of daily rate)
  // Special: multiplier = 0.30 (30% of daily rate)
  const multiplier = type === 'Regular' ? 1.0 : (type === 'Special' ? 0.30 : 0);
  return dailyRate * multiplier * (hours / 8);
  return 0;
};

export const calculateOTPay = (basicSalary, hours) => {
  if (!hours || hours <= 0) return 0;
  const dailyRate = calculateDailyRate(basicSalary);
  const hourlyRate = calculateHourlyRate(dailyRate);
  // Use flat OT rate (no percentage multiplier): OT = hourlyRate * hours
  return hourlyRate * hours;
};

// Revised Withholding Tax Table (Jan 1, 2023 onwards)
export const computeWithholdingTax = (taxableIncome) => {
  if (taxableIncome <= 20833) {
    return 0;
  } else if (taxableIncome <= 33332) {
    return (taxableIncome - 20833) * 0.15;
  } else if (taxableIncome <= 66666) {
    return 1875 + ((taxableIncome - 33333) * 0.20);
  } else if (taxableIncome <= 166666) {
    return 8541.80 + ((taxableIncome - 66667) * 0.25);
  } else if (taxableIncome <= 666666) {
    return 33541.80 + ((taxableIncome - 166667) * 0.30);
  } else {
    return 183541.80 + ((taxableIncome - 666667) * 0.35);
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};