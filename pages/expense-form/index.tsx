import Head from 'next/head'
import { ChangeEvent, MouseEvent, useEffect, useReducer, useState } from 'react'
import { clsx } from 'clsx';

import Modal from 'components/Modal'
import ModalCard from 'components/ModalCard'
import Swipeable from 'components/Swipeable'
import reducer, { Entry, INITIAL_FORM_STATE, INITIAL_ITEM_STATE } from '../../lib/helpers/reducer';
import { calculateEffectivePc, formatCurrency, getRatioStep, validateItemInput } from '../../lib/helpers/utils';
import { formKeys, modalKeys, rationKeys, rationUnit } from '../../lib/helpers/types';
import { locationPresets, paidByOptions, rationPresets, typeOptions, vendorPresets } from 'lib/constants/expense';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { uuid } from 'uuidv4';
import produce from 'immer';

const ExpenseForm = () => {
  const [{form, modal, error}, dispatch] = useReducer(reducer, INITIAL_FORM_STATE);
  const router = useRouter();

  const totalCost = form.items.reduce((sum, item) => sum + Number(item.price) * Number(item.amount), 0);
  const costPC = calculateEffectivePc(totalCost, form.ration);

  const handleInput = (key: formKeys, value: string) => dispatch({ type: 'input', payload: { key, value }});
  const handleItemInput = (key: keyof ReturnType<typeof INITIAL_ITEM_STATE>, value: string) => dispatch({ type: 'item/input', payload: { key, value }});
  const showModal = (key: modalKeys) => dispatch({ type: 'modal', payload: key });

  useEffect(() => {
    // on mount, load in the email information
    const userEmail = localStorage.getItem("user-email");

    if (userEmail) {
      handleInput('email', userEmail);
    }
  }, []);

  // ration handlers
  const handleRatioStep = (key: rationKeys, operation: '+' | '-') => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    dispatch({
      type: 'ration/input',
      payload: {
        key,
        value: String(getRatioStep(+form.ration[key].amount, operation))
      }});
  }

  const handleRationChangeUnit = (unit: rationUnit, key: rationKeys) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    dispatch({
      type: 'ration/change_unit',
      payload: {
        key,
        value: unit,
      }
    })
  }

  const handleRationInput = (key: rationKeys) => (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'ration/input',
      payload: {
        key,
        value: e.target.value
      }});
  }

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // save email for future use
    if (!localStorage.getItem("user-email")) {
      localStorage.setItem("user-email", form.email);
    }

    const JSONdata = JSON.stringify(form);

    // Form the request for sending data to the server.
    const options = {
      // The method is POST because we are sending data.
      method: 'POST',
      // Tell the server we're sending JSON.
      headers: {
        'Content-Type': 'application/json',
      },
      // Body of the request is the JSON data we created above.
      body: JSONdata,
    }

    const response = await fetch('/api/submitExpense', options)

    // Get the response data from server as JSON.
    // If server returns the name submitted, that means the form works.
    const {res} = await response.json();

    if (res) {
      dispatch({ type: 'reset' });
      router.push('/');
    }
  }

  /* BILL OCR RELATED LOGIC */
  const [fileState, setFileState] = useState<{
    file: Blob | null;
    billDraft: Array<{ id: string; text: string; type: typeof Entry.billDraftSequence[number] }> | null;
  }>({
    file: null,
    billDraft: null,
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => e.target.files?.length && setFileState({ file: e.target.files[0], billDraft: null });

  const handleFileSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const formData = new FormData();

    if (fileState.file) {
      formData.append(
        "file",
        fileState.file,
        fileState.file.name
      );

      // Form the request for sending data to the server.
      const options = {
        // The method is POST because we are sending data.
        method: 'POST',
        body: formData,
      }

      const response = await fetch('/api/convertImage', options);

      const {res} = await response.json();

      setFileState(prevState => ({
        ...prevState,
        billDraft: res.split('\n').map((line: string) => {
          const splitLine = line.split(' ');

          const quantity = splitLine.pop();
          const price = splitLine.pop();

          return [
            {
              id: uuid(),
              text: splitLine.join(' '),
              type: 'item',
            },
            {
              id: uuid(),
              text: price,
              type: 'price',
            },
            {
              id: uuid(),
              text: quantity,
              type: 'quantity',
            }
          ];
        }).flat(),
      }));
    }
  }

  const handleClearBillDraft = () => setFileState(prevState => ({ ...prevState, billDraft: null }));
  const handleClearBillDraftLine = (selectedId: string) => setFileState(prevState => produce(prevState, prevState => {
    if (prevState.billDraft) {
      prevState.billDraft = prevState.billDraft.filter(({id}) => id !== selectedId);
    }
  }));

  const handleUpdateBillDraftItem = (e: ChangeEvent<HTMLSelectElement>, selectedId: string) => setFileState(prevState => produce(prevState, prevState => {
    if (prevState.billDraft) {
      const selectedBillDraftItem = prevState.billDraft.findIndex(({id}) => id === selectedId);
      prevState.billDraft[selectedBillDraftItem].type = e.target.value as typeof Entry.billDraftSequence[number];
    }
  }));

  const handleFillBillDraftToForm = (e: MouseEvent<HTMLButtonElement>) => {
    if (fileState.billDraft) {
      dispatch({ type: 'item/ocr_add', payload: Entry.generate(fileState.billDraft) });
      setFileState({ file: null, billDraft: null });
      showModal(null);
    }
  };

  useEffect(() => console.log(fileState), [fileState]);

  return (
    <>
      <Head>
        <title>Expense Form</title>
        <meta name="description" content="Add expense form" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mt-10 sm:m-10">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-3">
            <div className="px-4 sm:px-0">
              <div className="flex justify-between sm:justify-start align-middle">
                <Link href="/">
                  <h2 className="text-2xl" style={{marginTop: '-3px'}}>⬅️</h2>
                </Link>
                <h2 className="text-xl font-medium leading-6 text-gray-900 text-center sm:text-left sm:pl-3">Add Expense</h2>
                <h2></h2>
              </div>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
              
            <form>
              <div className="bg-white px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 gap-6">

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="expense-email" className="block text-base font-medium text-gray-700">
                      Email*
                    </label>
                    <input
                        type="text"
                        name="expense-email"
                        id="expense-email"
                        className="mt-1 rounded-md block w-full border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                        value={form.email}
                        onChange={(e) => handleInput('email', e.target.value)}
                        autoComplete="email"
                      />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="expense-date" className="block text-base font-medium text-gray-700">
                      Date*
                    </label>
                    <input
                      type="date"
                      name="expense-date"
                      id="expense-date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                      value={form.date}
                      onChange={(e) => handleInput('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="expense-vendor" className="block text-base font-medium text-gray-700">
                      Vendor
                    </label>
                    <div className='w-full grid grid-cols-6 gap-3 mt-1'>
                      <input
                        type="text"
                        name="expense-vendor"
                        id="expense-vendor"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm col-start-1 col-end-5 sm:col-end-6"
                        value={form.vendor}
                        onChange={(e) => handleInput('vendor', e.target.value)}
                        autoComplete="organization"
                      />
                      <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white px-4 text-base font-small text-gray-700 shadow-sm h-11 col-start-5 col-end-7 sm:col-start-6"
                        onClick={() => showModal('vendor_preset')}
                      >
                        More
                      </button>
                    </div>
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="expense-location" className="block text-base font-medium text-gray-700">
                      Location*
                    </label>

                    <div className='w-full grid grid-cols-6 gap-3 mt-1'>
                      <input
                        type="text"
                        name="expense-location"
                        id="expense-location"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm  col-start-1 col-end-5 sm:col-end-6"
                        value={form.location}
                        onChange={(e) => handleInput('location', e.target.value)}
                        autoComplete="organization"
                        required
                      />
                      <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white px-4 text-base font-small text-gray-700 shadow-sm h-11 col-start-5 col-end-7 sm:col-start-6"
                        onClick={() => showModal('location_preset')}
                      >
                        More
                      </button>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="expense-type" className="text-base font-medium text-gray-700 ">
                      Type*
                    </label>

                    <button
                      type="button"
                      className="ml-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => showModal('type')}
                    >
                      {form.type.length
                      ? `${typeOptions.find(option => option.label === form.type)?.icon} ${form.type}`
                      : 'Select'
                      }
                    </button>
                  </div>

                  <div className="col-span-6">
                    <label className="block text-base font-medium text-gray-700">
                      Items*
                    </label>

                    {form.items.map((item) => (
                      <Swipeable key={item.id} handleSwipe={() => item.id && dispatch({ type: 'item/remove', payload: item.id })}>
                        <div className="grid grid-cols-6 gap-3">
                          <input
                            type="text"
                            name="expense-item-label"
                            id="expense-item-label"
                            className="mt-1 col-start-1 col-end-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={item.label}
                            disabled
                          />

                          <div className="relative mt-1 col-start-4 col-end-6 rounded-md border-gray-300 shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 text-sm">RM</span>
                            </div>
                            <input
                              type="text"
                              name="expense-item-price"
                              id="expense-item-price"
                              className="block w-full rounded-md border-gray-300 pl-11 pr-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={item.price}
                              disabled
                            />
                          </div>

                          <input
                            type="number"
                            name="expense-item-unit"
                            id="expense-item-unit"
                            className="mt-1 col-start-6 col-end-6 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={item.amount}
                            disabled
                          />
                        </div>
                      </Swipeable>
                    ))}

                    {!!form.items.length && (
                      <div className='border border-gray-300 mt-3'></div>
                    )}

                    <div className="grid grid-cols-6 gap-3 mt-3">
                      <input
                        type="text"
                        name="expense-item-label"
                        id="expense-item-label"
                        className="mt-1 col-start-1 col-end-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={form.itemDraft.label}
                        onChange={(e) => handleItemInput('label', e.target.value)}
                        autoComplete='on'
                        placeholder='Coffee'
                      />

                      <div className="relative mt-1 col-start-4 col-end-6 rounded-md border-gray-300 shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 text-sm">RM</span>
                        </div>
                        <input
                          type="number"
                          name="expense-item-price"
                          id="expense-item-price"
                          className="block w-full rounded-md border-gray-300 pl-12 pr-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={form.itemDraft.price}
                          onChange={(e) => handleItemInput('price', e.target.value)}
                          placeholder='4.99'
                        />
                      </div>

                      <input
                        type="number"
                        name="expense-item-unit"
                        id="expense-item-unit"
                        className="mt-1 col-start-6 col-end-6 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={form.itemDraft.amount}
                        onChange={(e) => handleItemInput('amount', e.target.value)}
                        placeholder='1'
                      />
                    </div>

                    <button
                      type="button"
                      className={clsx([
                        "mt-3 inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-2xl text-white shadow-sm focus:outline-none",
                        error.form.itemDraft ? "bg-red-600" : "bg-indigo-500"
                      ])} 
                      onClick={() => validateItemInput(form.itemDraft) ? dispatch({ type: 'item/add' }) : dispatch({ type: 'error', payload: 'itemDraft' })}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className={clsx([
                        "mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-md text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                      ])} 
                      onClick={() => showModal('upload_receipt')}
                    >
                      Upload
                    </button>
                  </div>

                  <div className="col-span-6 h-12 sticky top-0 pb-3 bg-white border-solid border-b border-indigo-500">
                    <div className="relative z-0 h-12">
                      <div className="absolute w-full h-full bottom-0 left-0" style={{ zIndex: 2 }}>
                        <div className="flex justify-between p-2">
                          <p className="text-xl font-medium text-gray-700">
                            Total
                          </p>

                          <div className={clsx([
                            "flex justify-between px-1",
                            "bg-white",
                          ])}>
                            <p className='text-xl font-bold text-gray-700 pr-3'>RM</p>
                            <p className='text-xl font-bold text-gray-700'>
                              {formatCurrency(totalCost)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 h-full w-full overflow-hidden flex">
                        {paidByOptions.map(({label, icon, color}) => (
                          <div
                            className="h-full text-center block pt-3"
                            style={{
                              width: `${costPC[label]}%`,
                              backgroundColor: color,
                              transition: 'width 1s'
                            }}
                            key={label}
                          >
                            {costPC[label] > 5 && icon}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="expense-type" className="text-base font-medium text-gray-700">
                      Paid By*
                    </label>

                    <button
                      type="button"
                      className="ml-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => showModal('paid_by')}
                    >
                      {form.paid_by.length
                      ? `${paidByOptions.find(option => option.label === form.paid_by)?.icon} ${form.paid_by}`
                      : 'Select'
                      }
                    </button>
                  </div>

                  <div className='rounded-md border border-gray-300 col-span-6 sm:col-span-4'>
                    {paidByOptions.map(({label, icon}) => (
                      <div className="p-3 grid grid-cols-9 gap-1" key={label}>
                        <div className="pt-2 col-span-3">
                          <label htmlFor={`ration-${label}`}>
                            <span className='text-2xl'>{icon}</span>
                            &nbsp;
                            <span className='text-md'>{label}</span>
                          </label>
                        </div>

                        <button
                          className='col-span-1'
                          onClick={handleRatioStep(label, '-')}
                        >
                          ➖
                        </button>
                        <button
                          className={clsx([
                            'text-md col-span-1',
                            form.ration[label].unit === 'RM' ? 'text-indigo-500' : 'text-gray-400'
                          ])}
                          onClick={handleRationChangeUnit('RM', label)}
                        >
                          RM
                        </button>
                        
                        <input
                          type="text"
                          name={`ration-${label}`}
                          id={`ration-${label}`}
                          className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm col-span-2 text-center"
                          value={form.ration[label].amount}
                          onChange={handleRationInput(label)}
                          required
                        />
                        <button
                          className={clsx([
                            'text-md col-span-1',
                            form.ration[label].unit === '%' ? 'text-indigo-500' : 'text-gray-400'
                          ])}
                          onClick={handleRationChangeUnit('%', label)}
                        >
                          %
                        </button>

                        <button
                          className='col-span-1'
                          onClick={handleRatioStep(label, '+')}
                        >
                          ➕
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-end pb-1 pr-2 pt-2">
                      <span className="text-gray-400 text-xs">% is calculated after subtracting fixed amount</span>
                    </div>
                  </div>

                  <div className="col-span-6 flex justify-end gap-3" style={{ marginTop: '-10px', }}>
                    <button
                      type='button'
                      className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm"
                      onClick={() => dispatch({ type: 'ration/reset' })}
                    >
                      Reset
                    </button>
                    <button
                      type='button'
                      className={clsx([
                        "rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        !totalCost ? 'bg-gray-400' : 'bg-indigo-600'
                      ])}
                      onClick={() => showModal('ration_preset')}
                      disabled={!totalCost}
                    >
                      Preset
                    </button>
                  </div>

                  <div  className="col-span-6">
                    <label htmlFor="about" className="block text-base font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="expense-description"
                        name="expense-description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="eg Car park"
                        value={form.description}
                        onChange={e => handleInput('description', e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      If left empty description will be generated using items
                    </p>
                  </div>
                  
                  <fieldset className='col-span-6'>
                    <legend className="contents text-base font-medium text-gray-900">Clearance*</legend>
                    <p className="text-xs text-gray-500">Has this expense been cleared off?</p>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="clearance-yes"
                          name="clearance-yes"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.clearance === 'Yes'}
                          onChange={() => handleInput('clearance', 'Yes')}
                        />
                        <label htmlFor="clearance-yes" className="ml-3 block text-sm font-medium text-gray-700">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="clearance-partial"
                          name="clearance-partial"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.clearance === 'Partial'}
                          onChange={() => handleInput('clearance', 'Partial')}
                        />
                        <label htmlFor="clearance-partial" className="ml-3 block text-sm font-medium text-gray-700">
                          Partial
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="clearance-no"
                          name="clearance-no"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.clearance === 'No'}
                          onChange={() => handleInput('clearance', 'No')}
                        />
                        <label htmlFor="clearance-no" className="ml-3 block text-sm font-medium text-gray-700">
                          No
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="clearance-repayment"
                          name="clearance-repayment"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.clearance === 'Repayment'}
                          onChange={() => handleInput('clearance', 'Repayment')}
                        />
                        <label htmlFor="clearance-repayment" className="ml-3 block text-sm font-medium text-gray-700">
                          Repayment
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 sm:px-6">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm"
                  onClick={() => dispatch({ type: 'reset' })}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={handleSubmit}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal open={modal.isShown} setOpen={() => {
        switch (modal.mode) {
          case 'upload_receipt':
            // setFileState({ file: null, text: null });
            return showModal(null);
          default:
            return showModal(null);
        }
      }}>
        <div className="w-full">
          {(() => {
            switch (modal.mode) {
              case 'type':
                return (
                  <>
                    <div className="text-center mt-1 w-full">
                      Expense Type
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6 text-center">
                      {typeOptions.map(({label, icon}) => (
                        <ModalCard
                          key={label}
                          handleSelect={() => {
                            handleInput('type', label);
                            showModal(null);
                          }}
                          isSelected={form.type !== 'Selected' && label === form.type}>
                          <p className="text-2xl">{icon}</p>
                          <p className="text-xs mt-2">{label}</p>
                        </ModalCard>)
                      )}
                    </div>
                  </>
                );
              case 'paid_by':
                return (
                  <>
                    <div className="text-center mt-1 w-full">
                      Paid by
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-center">
                      {paidByOptions.map(({label, icon}) => (
                        <ModalCard
                          key={label}
                          handleSelect={() => {
                            handleInput('paid_by', label);
                            showModal(null);
                          }}
                          isSelected={form.paid_by.includes(label)}>
                          <p className="text-2xl">{icon}</p>
                          <p className="text-xs mt-2">{label}</p>
                        </ModalCard>)
                      )}
                    </div>
                  </>
                );
              case 'ration_preset':
                return (
                  <>
                    <div className="text-center mt-1 w-full">
                      Presets
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-center">
                      {rationPresets.map(({label, icon, preset}) => (
                        <ModalCard
                          key={label}
                          handleSelect={() => {
                            dispatch({ type: 'ration/preset_input', payload: preset })
                            showModal(null);
                          }}
                          isSelected={form.paid_by.includes(label)}>
                          <p className="text-2xl">{icon}</p>
                          <p className="text-xs mt-2">{label}</p>
                        </ModalCard>)
                      )}
                    </div>
                  </>
                );
              case 'location_preset':
                return (
                  <>
                    <div className="text-center mt-1 w-full">
                      Presets
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-center">
                      {locationPresets.map((location) => (
                        <div
                          key={location}
                          className="rounded-md border border-gray-300 bg-white py-2 text-base text-gray-700 shadow-sm"
                          onClick={() => {
                            handleInput('location', location);
                            showModal(null);
                          }}
                        >
                          <p className="text-md">{location}</p>
                        </div>)
                      )}
                    </div>
                  </>
                );
              case 'vendor_preset':
                return (
                  <>
                    <div className="text-center mt-1 w-full">
                      Presets
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-center">
                      {vendorPresets.map((vendor) => (
                        <div
                          key={vendor}
                          className="rounded-md border border-gray-300 bg-white py-2 text-base text-gray-700 shadow-sm"
                          onClick={() => {
                            handleInput('vendor', vendor);
                            showModal(null);
                          }}
                        >
                          <p className="text-md">{vendor}</p>
                        </div>)
                      )}
                    </div>
                  </>
                );
              case 'upload_receipt':
                // if result retrieved
                if (fileState.billDraft) {
                  return (
                    <>
                      <div className="text-center mt-1 w-full">
                        Upload Receipt
                      </div>
                      <div className="text-center flex flex-col gap-3">
                        <div className='mt-3 flex flex-col gap-5' style={{maxHeight: 500, overflow: 'scroll'}}>
                          {fileState.billDraft.map(({type, text, id}) => (
                            <div key={id}>
                              <div className="mt-1 flex rounded-md">
                                <p className="block w-full py-2 flex-1 rounded-none rounded-l-md border border-gray-300 sm:text-sm h-10">{text}</p>
                                <select
                                  className="inline-flex items-center border border-l-0 border-gray-300 bg-gray-50 px-3 h-10 text-sm text-gray-500"
                                  onChange={e => handleUpdateBillDraftItem(e, id)}
                                  value={type}
                                >
                                  <option value="item">Item</option>
                                  <option value="price">Price</option>
                                  <option value="quantity">Quantity</option>
                                </select>
                                <button
                                  className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 h-10 text-sm text-gray-500"
                                  onClick={() => handleClearBillDraftLine(id)}
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-red-500 px-4 py-3 text-md shadow-sm bg-white text-gray-700"
                          onClick={handleClearBillDraft}
                        >
                          Clear Generated Text
                        </button>
                        <button
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 px-4 py-3 text-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-indigo-500 text-white"
                          onClick={handleFillBillDraftToForm}
                        >
                          OK
                        </button>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="text-center mt-1 w-full">
                        Upload Receipt
                      </div>
                      <div className="text-center flex flex-col gap-3">
                        <div className='p-4 mt-3 flex justify-center w-full border border-gray-300 rounded-md'>
                          <input type="file" name="file" accept="image/*" required id="file" onChange={handleFileSelect} />
                        </div>
                        <button
                          className={clsx([
                            "mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 px-4 py-3 text-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                            fileState.file ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'
                          ])}
                          disabled={!fileState.file}
                          onClick={handleFileSubmit}
                        >
                          Extract Text From Image
                        </button>
                      </div>
                    </>
                );
                }
              default:
                return <div className="h-32" />;
            }
          })()}
        </div>
      </Modal>
    </>
  )
}

export default ExpenseForm;
