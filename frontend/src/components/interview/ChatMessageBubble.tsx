import type { ChatMessage } from '../../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAi = message.sender === 'ai';

  return (
    <div className={`flex w-full gap-md font-body ${isAi ? 'justify-start' : 'justify-end'}`}>
      
      {/* AI Avatar */}
      {isAi && (
        <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary flex-shrink-0 select-none shadow shadow-primary/5">
          <span className="material-symbols-outlined text-lg leading-none select-none">
            smart_toy
          </span>
        </div>
      )}

      {/* Message Text Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-md py-sm flex flex-col gap-[2px] ${
          isAi
            ? 'bg-surface-container border border-outline-variant text-on-surface rounded-tl-none text-left'
            : 'bg-primary-container text-on-primary-container rounded-tr-none text-right'
        }`}
      >
        <p className="text-body-sm leading-relaxed whitespace-pre-line select-text">
          {message.text}
        </p>
        <span
          className={`text-[9px] font-label font-semibold mt-xs select-none ${
            isAi ? 'text-outline self-start' : 'text-on-primary-container/70 self-end'
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {/* User Avatar */}
      {!isAi && (
        <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary flex-shrink-0 select-none shadow shadow-primary-container/5">
          <span className="material-symbols-outlined text-lg leading-none select-none">
            person
          </span>
        </div>
      )}

    </div>
  );
}
