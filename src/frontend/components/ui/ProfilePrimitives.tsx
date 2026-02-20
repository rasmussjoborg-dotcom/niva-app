import React from 'react';

/** iOS-style toggle switch */
export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
            className="sr-only peer"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-[51px] h-[31px] bg-border-light dark:bg-border-dark rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[27px] after:w-[27px] after:transition-all after:shadow-sm peer-checked:bg-primary dark:peer-checked:bg-white"></div>
    </label>
);

/** Section header with optional expand/collapse */
export const SectionHeader = ({ children, expandable, expanded, onToggle }: {
    children: React.ReactNode;
    expandable?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
}) => (
    <div className="px-1 mb-3">
        {expandable ? (
            <button onClick={onToggle} className="flex items-center justify-between w-full group">
                <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">{children}</h2>
                <span className={`material-symbols-outlined text-lg text-text-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
        ) : (
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">{children}</h2>
        )}
    </div>
);

/** Settings-style list row */
export const ListRow = ({ icon, label, trailing, onClick, destructive }: {
    icon?: string;
    label: string;
    trailing?: React.ReactNode;
    onClick?: () => void;
    destructive?: boolean;
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-surface-muted-light dark:active:bg-surface-dark ${destructive ? 'text-red-500' : 'text-black dark:text-white'}`}
    >
        {icon && (
            <span className={`material-symbols-outlined text-xl ${destructive ? 'text-red-500' : 'text-text-muted'}`}>
                {icon}
            </span>
        )}
        <span className="flex-1 text-base font-medium">{label}</span>
        {trailing || (
            <span className="material-symbols-outlined text-xl text-text-muted">chevron_right</span>
        )}
    </button>
);

/** Indented divider for list rows */
export const Divider = () => (
    <div className="h-px bg-surface-muted-light dark:bg-surface-dark ml-14"></div>
);
