import { INITIAL_RATION_STATE } from "lib/helpers/reducer";
import { rationKeys } from "lib/helpers/types";

export const paidByOptions: Array<{label: rationKeys, icon: string, color: string}> = [
  {
    label: 'Name #1',
    icon: '🧑🏻',
    color: 'rgb(171, 255, 160, 0.66)'
  },
  {
    label: 'Name #2',
    icon: '👩🏻',
    color: 'rgb(255, 202, 228, 0.5)',
  },
  {
    label: 'Name #3',
    icon: '👦🏻',
    color: 'rgb(201, 237, 255)'
  },
  {
    label: 'Name #4',
    icon: '👧🏻',
    color: 'rgb(241, 255, 201)'
  },
]

export const typeOptions = [
  {
    label: 'Food',
    icon: '☕️🍝',
  },
  {
    label: 'Home/Groceries',
    icon: '🏠',
  },
  {
    label: 'Health/Medical',
    icon: '💊',
  },
  {
    label: 'Personal',
    icon: '💅🏻',
  },
  {
    label: 'Parents',
    icon: '👩‍❤️‍👨',
  },
  {
    label: 'Utilities',
    icon: '⚡️',
  },
  {
    label: 'Travel/Transport',
    icon: '🚗💨',
  },
  {
    label: 'Gifts',
    icon: '🎁',
  },
  {
    label: 'Donation',
    icon: '💸',
  },
  {
    label: 'Repayment',
    icon: '💰',
  },
];

export const rationPresets: Array<{ label: string, icon: string, preset: typeof INITIAL_RATION_STATE }> = [
  {
    label: 'Preset #1',
    icon: '🧑🏻👩🏻👦🏻👧🏻',
    preset: {
      'Name #1': {
        amount: '25',
        unit: '%',
      },
      'Name #2': {
        amount: '25',
        unit: '%',
      },
      'Name #3': {
        amount: '25',
        unit: '%',
      },
      'Name #4': {
        amount: '25',
        unit: '%',
      },
    }
  },
  {
    label: 'Preset #2',
    icon: '👩🏻👦🏻👧🏻',
    preset: {
      'Name #1': {
        amount: '0',
        unit: '%',
      },
      'Name #2': {
        amount: '33',
        unit: '%',
      },
      'Name #3': {
        amount: '33',
        unit: '%',
      },
      'Name #4': {
        amount: '33',
        unit: '%',
      },
    }
  },
  {
    label: 'Preset #3',
    icon: '👩🏻👦🏻',
    preset: {
      'Name #1': {
        amount: '0',
        unit: '%',
      },
      'Name #2': {
        amount: '50',
        unit: '%',
      },
      'Name #3': {
        amount: '50',
        unit: '%',
      },
      'Name #4': {
        amount: '0',
        unit: '%',
      },
    }
  },
  {
    label: 'Preset #4',
    icon: '🧑🏻',
    preset: {
      'Name #1': {
        amount: '100',
        unit: '%',
      },
      'Name #2': {
        amount: '0',
        unit: '%',
      },
      'Name #3': {
        amount: '0',
        unit: '%',
      },
      'Name #4': {
        amount: '0',
        unit: '%',
      },
    }
  },
  {
    label: 'Preset #5',
    icon: '👩🏻',
    preset: {
      'Name #1': {
        amount: '0',
        unit: '%',
      },
      'Name #2': {
        amount: '100',
        unit: '%',
      },
      'Name #3': {
        amount: '0',
        unit: '%',
      },
      'Name #4': {
        amount: '0',
        unit: '%',
      },
    }
  },
  {
    label: 'Preset #6',
    icon: '👧🏻',
    preset: {
      'Name #1': {
        amount: '0',
        unit: '%',
      },
      'Name #2': {
        amount: '0',
        unit: '%',
      },
      'Name #3': {
        amount: '0',
        unit: '%',
      },
      'Name #4': {
        amount: '100',
        unit: '%',
      },
    }
  }
];

export const locationPresets = [
  'Location #1',
  'Location #2',
  'Location #3',
  'Location #4',
  'Location #5',
  'Location #6',
  'Location #7',
  'Location #8',
  'Location #9',
  'Location #10',
  'Location #11',
];

export const vendorPresets = [
  'Vendor #1',
  'Vendor #2',
  'Vendor #3',
  'Vendor #4',
  'Vendor #5',
  'Vendor #6',
  'Vendor #7',
  'Vendor #8',
  'Vendor #9',
  'Vendor #10',
  'Vendor #11',
];
