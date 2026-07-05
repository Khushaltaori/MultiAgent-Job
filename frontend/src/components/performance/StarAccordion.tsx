import { GlassCard } from '../ui/GlassCard';
import type { StarSection } from '../../types';

interface StarAccordionProps {
  sections: StarSection[];
  openSectionId: string | null; // using letter as ID: 'S' | 'T' | 'A' | 'R'
  setOpenSectionId: (id: string | null) => void;
}

export function StarAccordion({
  sections,
  openSectionId,
  setOpenSectionId,
}: StarAccordionProps) {
  const badgeColors: { [key: string]: string } = {
    S: 'bg-primary/20 text-primary border-primary/20 shadow shadow-primary/5',
    T: 'bg-tertiary/20 text-tertiary border-tertiary/20 shadow shadow-tertiary/5',
    A: 'bg-secondary-container/40 text-on-secondary-container border-outline/20 shadow',
    R: 'bg-error/20 text-error border-error/20 shadow shadow-error/5',
  };

  const handleToggle = (letter: string) => {
    if (openSectionId === letter) {
      setOpenSectionId(null);
    } else {
      setOpenSectionId(letter);
    }
  };

  return (
    <div className="w-full flex flex-col gap-md font-body text-left select-none">
      <div className="flex flex-col gap-xs select-none">
        <h3 className="font-headline font-bold text-headline-sm text-on-surface">
          STAR Method Breakdown
        </h3>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          AI breakdown of your behavioral responses structured by the STAR (Situation, Task, Action, Result) methodology.
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        {sections.map((section) => {
          const isOpen = openSectionId === section.letter;
          const badgeClass = badgeColors[section.letter] || 'bg-primary/10 text-primary border-primary/20';

          return (
            <GlassCard
              key={section.letter}
              className={`p-0 border-outline-variant/60 bg-surface-container/30 overflow-hidden hover:border-outline-variant transition-all duration-300 ${
                isOpen ? 'border-primary-container/40 shadow-lg' : ''
              }`}
            >
              {/* Accordion Summary / Header */}
              <div
                onClick={() => handleToggle(section.letter)}
                className="flex items-center justify-between p-md cursor-pointer hover:bg-surface-container-high/20 transition-colors"
              >
                <div className="flex items-center gap-md">
                  {/* STAR Badge letter */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-headline font-bold text-lg select-none ${badgeClass}`}>
                    {section.letter}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-body-md text-on-surface">
                      {section.title}
                    </h4>
                    <p className="text-body-xs text-on-surface-variant leading-relaxed">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-lg">
                  {/* Mini score metrics */}
                  <div className="hidden sm:flex flex-col items-end gap-[4px] w-24">
                    <span className="text-body-xs font-bold text-on-surface font-mono">
                      Score: {section.score}%
                    </span>
                    <div className="w-full h-[4px] bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${section.score}%` }} />
                    </div>
                  </div>

                  <span className={`material-symbols-outlined text-xl text-outline-variant font-bold transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Accordion Detail Panel */}
              {isOpen && (
                <div className="p-md border-t border-outline-variant/20 bg-surface-container-lowest/20 flex flex-col gap-md select-text">
                  {section.isCritical ? (
                    /* Critical callout mode */
                    <div className="p-md bg-error-container/10 border border-error-container/20 rounded-xl text-error text-body-sm leading-relaxed flex gap-sm items-start">
                      <span className="material-symbols-outlined text-lg leading-none font-bold select-none">
                        campaign
                      </span>
                      <div>
                        <h5 className="font-bold uppercase tracking-wider text-[11px] mb-xs select-none">
                          Critical Feedback
                        </h5>
                        <p>{section.analysis}</p>
                      </div>
                    </div>
                  ) : (
                    /* Standard analysis view (2 cols on md+) */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-start">
                      <div className="md:col-span-8 space-y-xs">
                        <h5 className="font-label text-label-sm font-bold text-outline uppercase tracking-wider select-none">
                          AI Analysis
                        </h5>
                        <p className="text-body-sm text-on-surface-variant leading-relaxed">
                          {section.analysis}
                        </p>
                      </div>
                      <div className="md:col-span-4 p-md rounded-xl bg-surface-container-high/40 border border-outline-variant flex gap-sm items-start select-none">
                        <span className="material-symbols-outlined text-tertiary text-lg leading-none font-bold">
                          lightbulb
                        </span>
                        <div>
                          <h5 className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                            Pro Coaching Tip
                          </h5>
                          <p className="text-body-xs text-on-surface-variant leading-relaxed mt-[2px]">
                            {section.tip || 'Frame your outcome quantitatively. Mention the exact metric improved.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}