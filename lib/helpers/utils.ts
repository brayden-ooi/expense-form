import { INITIAL_RATION_STATE } from "./reducer";
import { itemStateType, rationKeys } from "./types";

export const validateItemInput = ({amount, price, label}: itemStateType) => {
  if (!amount.length) return false;
  if (!price.length) return false;
  if (!label.length) return false;

  return true;
};

export const formatCurrency = (value: string|number) => {
  return Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'MYR', 
    currencyDisplay: "code" 
  })
  .format(+value)
  .replace("MYR", "")
  .trim();
}

export const getRatioStep = (prevAmount: number, operation: '+' | '-') => {
  let nextAmount;

  if (operation === '+') {
    if (prevAmount >= 0 && prevAmount < 25) {
      nextAmount = 25;
    }

    if (prevAmount >= 25 && prevAmount < 33) {
      nextAmount = 33;
    }

    if (prevAmount >= 33 && prevAmount < 50) {
      nextAmount = 50;
    }

    if (prevAmount >= 50 && prevAmount < 66) {
      nextAmount = 66;
    }

    if (prevAmount >= 66 && prevAmount < 75) {
      nextAmount = 75;
    }

    if (prevAmount >= 75 && prevAmount < 100) {
      nextAmount = 100;
    }

    if (prevAmount === 100) nextAmount = 100;
  } else {
    if (prevAmount === 0) nextAmount = 0;

    if (prevAmount > 0 && prevAmount <= 25) {
      nextAmount = 0;
    }

    if (prevAmount > 25 && prevAmount <= 33) {
      nextAmount = 25;
    }

    if (prevAmount > 33 && prevAmount <= 50) {
      nextAmount = 33;
    }

    if (prevAmount > 50 && prevAmount <= 66) {
      nextAmount = 50;
    }

    if (prevAmount > 66 && prevAmount <= 75) {
      nextAmount = 66;
    }

    if (prevAmount > 75 && prevAmount <= 100) {
      nextAmount = 75;
    }
  }

  return nextAmount;
}

export const calculateEffectivePc = (totalCost: number, rations: typeof INITIAL_RATION_STATE) => {
  // calculate the % of fixed amounts, then calculate the net % for % amounts
  const sortedRations = Object.entries(rations).sort(([, a], [, b]) => {
    if (a.unit > b.unit) return -1;
    if (a.unit < b.unit) return 1;

    return 0;
  });

  let effectivePcMap = {} as Record<rationKeys, number>;

  sortedRations.reduce((accum, [key, {amount, unit}]) => {
    if (totalCost === 0) {
      effectivePcMap[key as rationKeys] = 0;
      return accum;
    }

    if (unit === 'RM') {
      effectivePcMap[key as rationKeys] = (Number(amount) / totalCost) * 100;

      return accum - Number(amount);
    } else {
      effectivePcMap[key as rationKeys] = ((accum * (Number(amount) / 100)) / totalCost) * 100;
      
      return accum;
    }
  }, totalCost);

  return effectivePcMap;
}