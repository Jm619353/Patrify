const ANNUAL_RATE_BY_CATEGORY = Object.freeze({
  Tecnologia: 0.2,
  Transporte: 0.2,
  Laboratorial: 0.15,
  Mobiliário: 0.1,
  Industrial: 0.1,
  Logística: 0.1,
  Segurança: 0.1,
  Produção: 0.1
});

const RESIDUAL_FACTOR = 0.1;

const calculateDepreciation = ({ value, quantity = 1, purchaseDate, category, condition }) => {
  const unitValue = Number(value) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  const totalAcquisitionValue = Number((unitValue * qty).toFixed(2));
  const annualRate = ANNUAL_RATE_BY_CATEGORY[category] ?? 0.1;

  if (condition === 'Descartado' || unitValue <= 0) {
    return {
      annualRatePercent: Math.round(annualRate * 100),
      ageMonths: 0,
      unitDepreciatedValue: 0,
      totalAcquisitionValue,
      totalDepreciatedValue: 0,
      depreciationAmount: totalAcquisitionValue,
      depreciationPercent: unitValue > 0 ? 100 : 0
    };
  }

  let ageMonths = 0;
  if (purchaseDate) {
    const purchased = new Date(`${purchaseDate}T00:00:00Z`);
    if (!Number.isNaN(purchased.getTime())) {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - purchased.getTime());
      ageMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
    }
  }

  const years = ageMonths / 12;
  const maxDepreciableFraction = 1 - RESIDUAL_FACTOR;
  const depreciatedFraction = Math.min(maxDepreciableFraction, years * annualRate);
  const currentFactor = Math.max(RESIDUAL_FACTOR, 1 - depreciatedFraction);

  const unitDepreciatedValue = Number((unitValue * currentFactor).toFixed(2));
  const totalDepreciatedValue = Number((totalAcquisitionValue * currentFactor).toFixed(2));
  const depreciationAmount = Number((totalAcquisitionValue - totalDepreciatedValue).toFixed(2));
  const depreciationPercent = Number((depreciatedFraction * 100).toFixed(1));

  return {
    annualRatePercent: Math.round(annualRate * 100),
    ageMonths,
    unitDepreciatedValue,
    totalAcquisitionValue,
    totalDepreciatedValue,
    depreciationAmount,
    depreciationPercent
  };
};

module.exports = { ANNUAL_RATE_BY_CATEGORY, calculateDepreciation };
