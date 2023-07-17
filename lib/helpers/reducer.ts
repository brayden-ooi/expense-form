import { uuid } from 'uuidv4';
import produce from 'immer';
import { FORM_ACTIONS, modalKeys, rationKeys, rationUnit } from './types';
import { formatCurrency } from './utils';

const today = new Date();

export class Entry {
  static billDraftSequence = ['item', 'price', 'quantity'] as const;

  static generate(entries: Array<{ id: string; type: typeof Entry.billDraftSequence[number]; text: string }>) {
    let payload: Array<ReturnType<typeof INITIAL_ITEM_STATE>> = [];
    let draft = {
      id: '',
      label: '',
      price: '',
      amount: '',
    };

    function translate(entry: typeof entries[number], draftEntry: typeof draft) {
      switch (entry.type) {
        case 'item':
          draftEntry.label = entry.text;
          return;
        case 'price':
          draftEntry.price = entry.text;
          return;
        case 'quantity':
          draftEntry.amount = entry.text;
      }
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // create new entry
      if (i === 0) {
        payload.push({...draft});
        payload[0].id = entry.id;
        translate(entry, payload[0]);
      } else {
        // if prevEntry type is greater than entry type, start new entry
        const prevEntryTypeIndex = Entry.billDraftSequence.findIndex((type) => type === entries[i - 1].type);
        const curEntryTypeIndex = Entry.billDraftSequence.findIndex((type) => type === entry.type);
        if (prevEntryTypeIndex >= curEntryTypeIndex) {
          payload.push({...draft});
          payload.at(-1)!.id = entry.id;
          translate(entry, payload.at(-1)!);
        } else {
          translate(entry, payload.at(-1)!);
        }
      }
    }

    return payload;
  }
}

export const INITIAL_ITEM_STATE = () => ({
  id: uuid(),
  label: '',
  price: '',
  amount: '',
});

export const INITIAL_RATION_STATE = {
  'Name #1': {
    amount: '0',
    unit: '%' as rationUnit,
  },
  'Name #2': {
    amount: '0',
    unit: '%' as rationUnit,
  },
  'Name #3': {
    amount: '0',
    unit: '%' as rationUnit,
  },
  'Name #4': {
    amount: '0',
    unit: '%' as rationUnit,
  },
};

export const INITIAL_FORM_STATE = {
  form: {
    email: '',
    date: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}-${today.getDate()}`,
    vendor: '',
    location: '',
    type: '',
    items: [] as Array<ReturnType<typeof INITIAL_ITEM_STATE>>,
    description: '',
    itemDraft: INITIAL_ITEM_STATE(),
    paid_by: '' as 'Name #1' | 'Name #2' | 'Name #3' | 'Name #4',
    ration: INITIAL_RATION_STATE,
    clearance: '' as 'Yes' | 'Partial' | 'No' | 'Repayment',
  },
  modal: {
    isShown: false,
    mode: null as modalKeys,
  },
  error: {
    form: {
      itemDraft: false,
    }
  }
};

const reducer = (state: typeof INITIAL_FORM_STATE, action: FORM_ACTIONS) => {
  const totalCost = state.form.items.reduce((sum, item) => sum + Number(item.price) * Number(item.amount), 0);

  switch (action.type) {
    case 'input':
      const newState: typeof INITIAL_FORM_STATE = {
        ...state,
        form: {
          ...state.form,
          [action.payload.key]: action.payload.value
        }
      };
      return newState;

      // return produce(state, state => {
      //   state.form[action.payload.key] = action.payload.value;
      // });
    case 'item/input':
      return produce(state, state => {
        state.form.itemDraft[action.payload.key] = action.payload.value;

        // reset error state if any
        state.error.form.itemDraft = false;
      });
    case 'item/add':
      return produce(state, state => {
        state.form.itemDraft.price = formatCurrency(state.form.itemDraft.price);

        state.form.items.push(state.form.itemDraft);

        state.form.itemDraft = INITIAL_ITEM_STATE();

        // reset error state if any
        state.error.form.itemDraft = false;
      });
    case 'item/ocr_add':
      return produce(state, state => {
        state.form.items.push(...action.payload);
      })
    case 'item/remove': {
      // total input must not be greater than bill
      const nextItems = state.form.items.filter(({id}) => id !== action.payload);
      const nextTotalCost = nextItems.reduce((sum, item) => sum + Number(item.price) * Number(item.amount), 0);

      const breakdown = Object.values(state.form.ration).reduce((accum, {amount, unit}) => {
        if (unit === '%') {
          return {
            ...accum,
            percents: accum.percents + Number(amount),
          }
        } else {
          return {
            ...accum,
            subsidies: accum.subsidies + Number(amount),
          };
        }
      }, {
        percents: 0,
        subsidies: 0,
      });

      // reset subsidies if nextTotalCost is lesser than subsidies
      if (nextTotalCost - breakdown.subsidies < 0) {
        return produce(state, state => {
          (Object.entries(state.form.ration) as Array<[rationKeys, typeof INITIAL_RATION_STATE[rationKeys]]>).forEach(([key, {unit, amount}]) => {
            if (unit === 'RM') {
              state.form.ration[key].amount = '0';
            } else {
              state.form.ration[key].amount = amount;
            }
          });
          state.form.items = nextItems;
        })
      };

      if (nextTotalCost === 0) {
        return produce(state, state => {
          state.form.ration = INITIAL_RATION_STATE;
          state.form.items = nextItems;
        });
      }

      return produce(state, state => {
        state.form.items = nextItems;
      })
    }
    case 'ration/change_unit':
      return produce(state, state => {
        state.form.ration[action.payload.key].unit = action.payload.value;
        state.form.ration[action.payload.key].amount = '0';
      });
    case 'ration/input': {
      // amount in RM is treated as subsidy and will take higher precedence in calculations and adjustments
      // Total payable amount = Total amount in RM + Total amount in % (100%)
      const nextRation = produce(state.form.ration, ration => {
        ration[action.payload.key].amount = action.payload.value
      });

      const breakdown = Object.values(nextRation).reduce((accum, {amount, unit}) => {
        if (unit === '%') {
          return {
            ...accum,
            percents: accum.percents + Number(amount),
          }
        } else {
          return {
            ...accum,
            subsidies: accum.subsidies + Number(amount),
          };
        }
      }, {
        percents: 0,
        subsidies: 0,
      });

      // reject input if subsidies are greater than bill
      if (totalCost - breakdown.subsidies < 0) return state;

      // reset %s if bill fully subsidized
      if (totalCost === breakdown.subsidies) {
        return produce(state, state => {
          (Object.entries(nextRation) as Array<[rationKeys, typeof INITIAL_RATION_STATE[rationKeys]]>).forEach(([key, {unit, amount}]) => {
            if (unit === '%') {
              state.form.ration[key].amount = '0';
            } else {
              state.form.ration[key].amount = nextRation[key].amount;
            }
          });
        })
      }

      // reject input if % greater than 100%
      if (breakdown.percents > 100) return state;

      return produce(state, state => {
        state.form.ration = nextRation;
      })
    }
    case 'ration/preset_input': 
      if (totalCost <= 0) return state;

      return produce(state, state => {
        state.form.ration = action.payload;
      });
    case 'ration/reset':
      return produce(state, state => {
        state.form.ration = INITIAL_RATION_STATE;
      });
    case 'reset':
      return INITIAL_FORM_STATE;
    case 'error':
      return produce(state, state => {
        state.error.form[action.payload] = true;
      });
    case 'modal':
      return produce(state, state => {
        if (!!action.payload) {
          state.modal.isShown = true;
          state.modal.mode = action.payload;
        } else {
          state.modal.isShown = false;
          state.modal.mode = action.payload;
        }
      });
    default:
      return state;
  }
}

export default reducer;
