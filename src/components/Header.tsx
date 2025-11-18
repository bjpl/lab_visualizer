import { Moon, Sun, BookOpen, Brain, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LearningMode } from '../types';

export const Header = () => {
  const { mode, setMode, isDarkMode, toggleDarkMode } = useStore();

  const modes: { id: LearningMode; label: string; icon: any; color: string }[] = [
    { id: 'study', label: 'Study', icon: BookOpen, color: 'primary' },
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'purple' },
    { id: 'challenge', label: 'Challenge', icon: Zap, color: 'yellow' }
  ];

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🫀</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Cuerpo Humano
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Learn Spanish Body Parts
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {modes.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
                  ${mode === id
                    ? `bg-white dark:bg-slate-600 shadow-md ${
                        color === 'primary' ? 'text-primary-700 dark:text-primary-400' :
                        color === 'purple' ? 'text-purple-700 dark:text-purple-400' :
                        'text-yellow-700 dark:text-yellow-400'
                      }`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
