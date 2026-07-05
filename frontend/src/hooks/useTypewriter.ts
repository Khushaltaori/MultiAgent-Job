import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speedMs = 120, onComplete?: () => void) {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setTypedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setTypedText('');

    const words = text.split(' ');
    let currentWordIndex = 0;

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const nextWord = words[currentWordIndex];
        setTypedText((prev) => (prev ? prev + ' ' : '') + nextWord);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs]);

  return { typedText, isTyping };
}
