import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PopoverDropdownProps {
  trigger: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  hoverable?: boolean;
  triggerRect?: { top: number; bottom: number; left: number } | null;
}

export default function PopoverDropdown({
  trigger,
  isOpen,
  onClose,
  onOpen,
  children,
  align = 'left',
  hoverable = false,
  triggerRect,
}: PopoverDropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirRef = useRef<'below' | 'above'>('below');

  useLayoutEffect(() => {
    if (!isOpen || !triggerRect || !menuRef.current) return;
    const el = menuRef.current;
    const gap = 8;
    const menuH = el.offsetHeight || 280;
    const vpH = window.innerHeight;

    const belowTop = triggerRect.bottom + gap;
    const aboveTop = triggerRect.top - menuH - gap;
    const fitsBelow = belowTop + menuH <= vpH;
    const fitsAbove = aboveTop >= 0;

    if (fitsBelow) {
      el.style.top = `${belowTop}px`;
      dirRef.current = 'below';
    } else if (fitsAbove) {
      el.style.top = `${aboveTop}px`;
      dirRef.current = 'above';
    } else {
      el.style.top = `${belowTop}px`;
      dirRef.current = 'below';
    }
    el.style.position = 'fixed';
    el.style.left = `${triggerRect.left}px`;
    el.style.zIndex = '9999';
    el.style.transformOrigin = dirRef.current === 'above' ? 'bottom left' : 'top left';
  }, [isOpen, triggerRect]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearLeaveTimer();
    if (hoverable && !isOpen && onOpen) {
      onOpen();
    }
  };

  const handleMouseLeave = () => {
    if (hoverable && isOpen) {
      leaveTimerRef.current = setTimeout(() => {
        onClose();
      }, 200);
    }
  };

  return (
    <div
      className="inline-block"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}

      {isOpen && createPortal(
        <>
          <style>{`@keyframes dropdownFadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              zIndex: 9999,
              opacity: 0,
              animation: 'dropdownFadeIn 0.15s ease-out forwards',
            }}
            className="min-w-[240px] max-w-[320px]"
            onMouseEnter={clearLeaveTimer}
            onMouseLeave={() => {
              if (hoverable) {
                leaveTimerRef.current = setTimeout(() => {
                  onClose();
                }, 200);
              }
            }}
          >
            <div className="bg-[#161622]/95 border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
              {children}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
