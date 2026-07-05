import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  isThinking: boolean;
  typewriterMessage?: ChatMessage | null;
  isTypewriterActive?: boolean;
}

export function ChatTranscript({
  messages,
  isThinking,
  typewriterMessage,
  isTypewriterActive,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages list or thinking status changes
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, typewriterMessage, isTypewriterActive]);

  return (
    <div className="flex-1 overflow-y-auto px-sm py-md flex flex-col gap-lg min-h-[400px] max-h-[550px] scrollbar-thin">
      {/* Existing messages */}
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}

      {/* Typewriter message (streaming right now) */}
      {isTypewriterActive && typewriterMessage && (
        <ChatMessageBubble message={typewriterMessage} />
      )}

      {/* Thinking indicator */}
      {isThinking && !isTypewriterActive && <ThinkingIndicator />}

      {/* Dummy ref to scroll to */}
      <div ref={bottomRef} />
    </div>
  );
}
