import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { StudyMode } from './components/modes/StudyMode';
import { QuizMode } from './components/modes/QuizMode';
import { ChallengeMode } from './components/modes/ChallengeMode';

function App() {
  const { mode, isDarkMode } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderMode = () => {
    switch (mode) {
      case 'study':
        return <StudyMode />;
      case 'quiz':
        return <QuizMode />;
      case 'challenge':
        return <ChallengeMode />;
      default:
        return <StudyMode />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-1 overflow-hidden">
        {renderMode()}
      </main>
    </div>
  );
}

export default App;
