import { useEffect, useRef, useState } from 'react';

interface Props {
  nickname: string;
  onLoginClick: () => void;
  onLogout: () => void;
  onDirtyClick: () => void;
}

export default function Header({ nickname, onLoginClick, onLogout, onDirtyClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-main">STUDY DIRT</span>
          <span className="topbar__brand-sub">система учебных заданий</span>
        </div>

        {nickname ? (
          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="user-menu__name">Пользователь: {nickname}</span>
              <span aria-hidden="true">▼</span>
            </button>
            {menuOpen && (
              <div className="user-menu__list" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="user-menu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn--outline" onClick={onLoginClick}>
            Войти
          </button>
        )}
      </div>

      <button type="button" className="dirty-btn" onClick={onDirtyClick}>
        <span className="dirty-btn__text">СДЕЛАТЬ ГРЯЗЬ</span>
      </button>
      <p className="header__hint">Сортировка невыполненных заданий по важности и срочности</p>
    </header>
  );
}
