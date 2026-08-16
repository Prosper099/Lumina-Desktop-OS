import React, { useState } from 'react';

export const CalcApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [resetOnNext, setResetOnNext] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === '0' || resetOnNext) {
      setDisplay(digit);
      setResetOnNext(false);
    } else {
      setDisplay(p => p + digit);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setResetOnNext(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setResetOnNext(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(p => p.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    if (!equation) return;
    try {
      const fullExpression = equation + display;
      // Sanitize evaluation
      const clean = fullExpression.replace(/[^0-9+\-*/. ]/g, '');
      const result = eval(clean);
      
      if (!isFinite(result)) {
        setDisplay('Error');
      } else {
        setDisplay(Number(result.toFixed(6)).toString());
      }
      setEquation('');
      setResetOnNext(true);
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 text-slate-100 font-sans select-none p-3 justify-between">
      {/* Display */}
      <div className="flex flex-col items-end justify-end bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[5.5rem] select-all">
        <div className="text-[11px] text-slate-500 font-mono h-4 truncate">
          {equation}
        </div>
        <div className="text-2xl font-semibold font-mono tracking-tight text-slate-100 truncate w-full text-right mt-1">
          {display}
        </div>
      </div>

      {/* Buttons Panel */}
      <div className="grid grid-cols-4 gap-2 mt-3 flex-1">
        <button
          onClick={handleClear}
          className="bg-slate-800 hover:bg-slate-700 hover:text-red-400 font-semibold p-3.5 rounded-lg text-xs cursor-pointer transition text-slate-400"
        >
          C
        </button>
        <button
          onClick={handleBackspace}
          className="bg-slate-800 hover:bg-slate-700 font-semibold p-3.5 rounded-lg text-xs cursor-pointer transition text-slate-400"
        >
          ⌫
        </button>
        <button
          onClick={() => handleOperator('/')}
          className="bg-slate-800 hover:bg-slate-700 font-mono p-3.5 rounded-lg text-sm cursor-pointer transition text-blue-400 font-bold"
        >
          ÷
        </button>
        <button
          onClick={() => handleOperator('*')}
          className="bg-slate-800 hover:bg-slate-700 font-mono p-3.5 rounded-lg text-sm cursor-pointer transition text-blue-400 font-bold"
        >
          ×
        </button>

        {[7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="bg-slate-800/55 hover:bg-slate-700 font-semibold text-slate-200 p-3.5 rounded-lg cursor-pointer transition"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className="bg-slate-800 hover:bg-slate-700 font-mono p-3.5 rounded-lg text-sm cursor-pointer transition text-blue-400 font-bold"
        >
          -
        </button>

        {[4, 5, 6].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="bg-slate-800/55 hover:bg-slate-700 font-semibold text-slate-200 p-3.5 rounded-lg cursor-pointer transition"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className="bg-slate-800 hover:bg-slate-700 font-mono p-3.5 rounded-lg text-sm cursor-pointer transition text-blue-400 font-bold"
        >
          +
        </button>

        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="bg-slate-800/55 hover:bg-slate-700 font-semibold text-slate-200 p-3.5 rounded-lg cursor-pointer transition"
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleCalculate}
          className="row-span-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-lg p-3.5 cursor-pointer text-sm transition flex items-center justify-center shadow"
        >
          =
        </button>

        <button
          onClick={() => handleDigit('0')}
          className="col-span-2 bg-slate-800/55 hover:bg-slate-700 font-semibold text-slate-200 p-3.5 rounded-lg cursor-pointer transition"
        >
          0
        </button>
        <button
          onClick={() => handleDigit('.')}
          className="bg-slate-800/55 hover:bg-slate-700 font-semibold text-slate-200 p-3.5 rounded-lg cursor-pointer transition"
        >
          .
        </button>
      </div>
    </div>
  );
};
