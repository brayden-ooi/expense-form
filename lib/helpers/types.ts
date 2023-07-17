import { INITIAL_FORM_STATE, INITIAL_ITEM_STATE, INITIAL_RATION_STATE } from "./reducer";

export type formKeys = Exclude<keyof typeof INITIAL_FORM_STATE["form"], 'items' | 'ration' | 'itemDraft'>;
export type modalKeys = 'type' | 'paid_by' | 'ration_preset' | 'vendor_preset' | 'location_preset' | 'upload_receipt' | null;
export type itemStateType = ReturnType<typeof INITIAL_ITEM_STATE>;
export type rationKeys = keyof typeof INITIAL_RATION_STATE;
export type rationUnit = '%' | 'RM';

export type FORM_ACTIONS = 
  { type: 'input'; payload: { key: formKeys; value: string }}
| { type: 'modal'; payload: modalKeys }
| { type: 'item/add'; }
| { type: 'item/ocr_add'; payload: Array<ReturnType<typeof INITIAL_ITEM_STATE>> }
| { type: 'item/remove'; payload: string }
| { type: 'item/input'; payload: { key: keyof itemStateType; value: any }}
| { type: 'ration/change_unit'; payload: { key: rationKeys; value: rationUnit }}
| { type: 'ration/input'; payload: { key: rationKeys; value: string }}
| { type: 'ration/preset_input'; payload: typeof INITIAL_RATION_STATE }
| { type: 'ration/reset'; }
| { type: 'reset'; }
| { type: 'error'; payload: keyof typeof INITIAL_FORM_STATE['error']['form']; }
