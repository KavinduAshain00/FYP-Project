import React, { useRef, useEffect, useState } from "react";

/**
 * Dropdown menu for grouping toolbar actions.
 * @param {React.ReactNode} trigger - Button or element that opens the menu
 * @param {React.ReactNode} children - Menu items (use DropdownMenu.Item)
 * @param {string} align - 'left' | 'right'
 * @param {boolean} open - Controlled open state (optional)
 * @param {function} onOpenChange - Called with (open: boolean) when open state changes
 */
export function DropdownMenu({
  trigger,
  children,
  align = "left",
  open: controlledOpen,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const ref = useRef(null);
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpenRef.current(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-slate-800/95 py-1 backdrop-blur-sm ${align === "right" ? "right-0" : "left-0"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Single menu item: icon (optional), label, shortcut (optional), danger (optional).
 * Call onClick then the menu will close if parent uses controlled open state.
 */
export function DropdownItem({
  icon: Icon,
  label,
  shortcut,
  danger,
  onClick,
  disabled,
  children,
}) {
  const content = children ?? (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-current opacity-80" />}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] uppercase text-slate-500">{shortcut}</span>
      )}
    </>
  );
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.();
      }}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition first:rounded-t last:rounded-b ${danger ? "text-red-400 hover:bg-red-500/10" : "text-slate-200 hover:bg-white/10"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {content}
    </button>
  );
}

/**
 * Divider between menu sections.
 */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-white/10" />;
}

/**
 * Section label (non-clickable).
 */
export function DropdownLabel({ children }) {
  return (
    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </div>
  );
}

DropdownMenu.Item = DropdownItem;
DropdownMenu.Divider = DropdownDivider;
DropdownMenu.Label = DropdownLabel;
export default DropdownMenu;
