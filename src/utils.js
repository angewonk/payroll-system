// Calculation Logic

export const calculateDailyRate = (basicSalary) => {
  // Formula: (Basic * 12) / 261
  return (basicSalary * 12) / 261;
};

export const calculateHourlyRate = (dailyRate) => {
  return dailyRate / 8;
};

// Separate helpers for holiday pay types
export const calculateRegularHolidayPay = (basicSalary, hours) => {
  if (!hours || hours <= 0) return 0;
  const dailyRate = calculateDailyRate(basicSalary);
  return dailyRate * 1.0 * (hours / 8);
};

export const calculateSpecialHolidayPay = (basicSalary, hours) => {
  if (!hours || hours <= 0) return 0;
  const dailyRate = calculateDailyRate(basicSalary);
  return dailyRate * 0.3 * (hours / 8);
};

export const calculateHolidayPay = (basicSalary, type, hours) => {
  if (!hours || hours <= 0) return 0;
  if (type === 'Regular') return calculateRegularHolidayPay(basicSalary, hours);
  if (type === 'Special') return calculateSpecialHolidayPay(basicSalary, hours);
  return 0;
};

export const calculateOTPay = (basicSalary, hours) => {
  if (!hours || hours <= 0) return 0;
  const dailyRate = calculateDailyRate(basicSalary);
  const hourlyRate = calculateHourlyRate(dailyRate);
  // Overtime pays 125% of the hourly rate (hourlyRate * 1.25) per hour
  // OT = hourlyRate * 1.25 * hours
  return hourlyRate * 1.25 * hours;
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

export const formatNumber = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};