import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Широкое окно (для списка «грязи» и деталей задания) */
  wide?: boolean;
}

/**
 * Универсальное модальное окно.
 * Закрывается по Escape и клику на затемнённый фон.
 * Если открыто несколько окон подряд, Escape закрывает только верхнее.
 */
export default function Modal({ title, onClose, children, wide = false }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const overlays = document.querySelectorAll('.modal-overlay');
      if (overlays[overlays.length - 1] === overlayRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      setTimeout(() => {
        if (!document.querySelector('.modal-overlay')) document.body.style.overflow = '';
      }, 0);
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? ' modal--wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            X
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
