'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('nav');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="icon"
      size="icon"
      aria-label={t('theme')}
      title={t('theme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {/* Avoid hydration mismatch: render a stable icon until mounted */}
      {!mounted ? (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      ) : isDark ? (
        <Moon className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      )}
    </Button>
  );
}
