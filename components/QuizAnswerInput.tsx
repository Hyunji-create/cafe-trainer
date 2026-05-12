'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';

type QuizAnswerInputProps = {
  placeholder?: string;
  disabled?: boolean;
  rounded?: 'full' | 'top' | 'bottom';
  onChange?: (value: string) => void;
  value?: string;
  specialChars?: string[];
};

export type QuizAnswerInputHandle = {
  focus: () => void;
  getValue: () => string;
  setValue: (val: string) => void;
  clear: () => void;
};

const roundedClasses = {
  full: 'rounded-2xl shadow-lg shadow-slate-200',
  top: 'rounded-t-2xl shadow-sm',
  bottom: 'rounded-b-2xl shadow-lg shadow-slate-200',
};

const QuizAnswerInput = forwardRef<QuizAnswerInputHandle, QuizAnswerInputProps>(
  ({ placeholder = 'Type the answer here', disabled = false, rounded = 'full', onChange, value, specialChars }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const cursorPosRef = useRef<number>(0);
    const [showChars, setShowChars] = useState(false);
    const [internalValue, setInternalValue] = useState('');

    const currentValue = value !== undefined ? value : internalValue;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      getValue: () => currentValue,
      setValue: (val: string) => {
        setInternalValue(val);
        onChange?.(val);
      },
      clear: () => {
        setInternalValue('');
        onChange?.('');
      },
    }));

    const handleChange = (newVal: string) => {
      setInternalValue(newVal);
      onChange?.(newVal);
    };

    const insertChar = (char: string) => {
      const pos = cursorPosRef.current;
      const newValue = currentValue.slice(0, pos) + char + currentValue.slice(pos);
      handleChange(newValue);
      setShowChars(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPos = pos + char.length;
          inputRef.current.setSelectionRange(newPos, newPos);
          cursorPosRef.current = newPos;
        }
      }, 0);
    };

    return (
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full p-4 ${specialChars ? 'pl-14' : 'pl-4'} text-xl font-black text-center text-slate-950 uppercase bg-white border-4 border-white focus:border-blue-300 focus:ring-0 focus:outline-none placeholder:text-slate-200 placeholder:text-lg placeholder:font-bold transition-all ${roundedClasses[rounded]}`}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          onSelect={(e) => {
            cursorPosRef.current = (e.target as HTMLInputElement).selectionStart || 0;
          }}
        />
        {specialChars && (
          <>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowChars(!showChars)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 hover:bg-blue-100 rounded-lg flex items-center justify-center text-sm text-slate-500 active:scale-95 transition-all cursor-pointer"
              title="Special characters"
            >
              #
            </button>
            {showChars && (
              <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 flex gap-2 z-20">
                {specialChars.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => insertChar(char)}
                    className="w-10 h-10 bg-slate-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-lg font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

QuizAnswerInput.displayName = 'QuizAnswerInput';

export default QuizAnswerInput;
