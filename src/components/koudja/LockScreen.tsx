import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

const ACCESS_CODE = 'koudja1021';
const STORAGE_KEY = 'koudja-unlocked';

export function useLockScreen() {
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const unlock = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setUnlocked(true);
  }, []);

  return { unlocked, unlock };
}

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-primary">KOUDJA</h1>
          <p className="text-sm text-muted-foreground">أدخل رمز الدخول</p>
        </div>

        <Input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          placeholder="••••••••"
          className={`text-center text-lg tracking-widest ${error ? 'border-destructive animate-shake' : ''}`}
          autoFocus
        />

        {error && (
          <p className="text-destructive text-sm font-medium">رمز خاطئ</p>
        )}

        <Button type="submit" className="w-full font-bold">
          دخول
        </Button>
      </form>
    </div>
  );
}
