import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CustomSelect({ options = [], value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() => options.findIndex(o => o.value === value));
  const [isFlipped, setIsFlipped] = useState(false);
  const ref = useRef(null);
  const controlRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    setHighlight(options.findIndex(o => o.value === value));
  }, [value, options]);

  const toggle = () => setOpen(s => !s);
  const select = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    onChange && onChange(opt.value);
    setOpen(false);
  };

  // compute and set menu position when open to avoid being clipped by overflow parents
  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      setIsFlipped(false);
      return;
    }
    const calc = () => {
      const btn = controlRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();

      // Check space below. If < 250px and there is more space above, flip.
      const spaceBelow = window.innerHeight - rect.bottom;
      const flip = spaceBelow < 250 && rect.top > spaceBelow;
      setIsFlipped(flip);

      const style = {
        position: 'absolute',
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        zIndex: 10050, // Higher than table headers
        minWidth: 'max-content' // Ensure text fits
      };

      if (flip) {
        // Position at the top of the button, move up by 100% of menu height via transform
        style.top = `${rect.top + window.scrollY}px`;
        style.transform = 'translateY(-100%)';
        style.marginTop = '1px'; // Visual tuck
      } else {
        // Position at bottom of button
        style.top = `${rect.bottom + window.scrollY}px`;
        style.marginTop = '-1px'; // Visual tuck
      }

      setMenuStyle(style);
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('scroll', calc, true); };
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight(i => Math.min(options.length - 1, (i === -1 ? 0 : i + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setHighlight(i => Math.max(0, (i === -1 ? options.length - 1 : i - 1)));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && highlight >= 0) select(highlight);
      else setOpen(true);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const selectedLabel = (options.find(o => o.value === value) || {}).label || '';

  return (
    <div ref={ref} className={`custom-select ${open ? 'is-open' : ''} ${isFlipped ? 'is-flipped' : ''} ${className}`}>
      <button
        ref={controlRef}
        type="button"
        className="custom-select__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="custom-select__value">{selectedLabel}</span>
        <span className="custom-select__caret">▾</span>
      </button>

      {open && createPortal(
        <ul className={`custom-select__menu ${isFlipped ? 'is-flipped' : ''}`} role="listbox" style={menuStyle}>
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`custom-select__option ${i === highlight ? 'is-highlight' : ''} ${opt.value === value ? 'is-selected' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
