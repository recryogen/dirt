import { useEffect, useRef, useState } from 'react';

interface Props {
  nickname: string;
  activeTab: 'tasks' | 'schedule' | 'notes' | 'crossword';
  onTabChange: (tab: 'tasks' | 'schedule' | 'notes' | 'crossword') => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onDirtyClick: () => void;
}

export default function Header({ nickname, activeTab, onTabChange, onLoginClick, onLogout, onDirtyClick }: Props) {
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

      <nav className="site-tabs" aria-label="Разделы сайта">
        <button className={activeTab === 'tasks' ? 'site-tabs__item site-tabs__item--active' : 'site-tabs__item'} onClick={() => onTabChange('tasks')}>ЗАДАНИЯ</button>
        <button className={activeTab === 'schedule' ? 'site-tabs__item site-tabs__item--active' : 'site-tabs__item'} onClick={() => onTabChange('schedule')}>РАСПИСАНИЕ</button>
        <button className={activeTab === 'notes' ? 'site-tabs__item site-tabs__item--active' : 'site-tabs__item'} onClick={() => onTabChange('notes')}>ЗАМЕТКИ</button>
        <button className={activeTab === 'crossword' ? 'site-tabs__item site-tabs__item--active' : 'site-tabs__item'} onClick={() => onTabChange('crossword')}>КРОССВОРД</button>
      </nav>

      {activeTab === 'tasks' && <>
        <button type="button" className="dirty-btn" onClick={onDirtyClick}>
          <span className="dirty-btn__text">СДЕЛАТЬ ГРЯЗЬ</span>
        </button>
        <p className="header__hint">Сортировка невыполненных заданий по важности и срочности</p>
      </>}
    </header>
  );
}
