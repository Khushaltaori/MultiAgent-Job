import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section id="hero" className="relative pt-24 pb-16 md:py-32 overflow-hidden flex items-center justify-center font-body min-h-[85vh]">
      {/* Blurred background radial glow ornaments */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-primary-container/10 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-tertiary/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-xl items-center relative z-10 text-left px-md">
        
        {/* Left Column - Copy & CTAs */}
        <div className="lg:col-span-6 flex flex-col items-start gap-md">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-xs px-sm py-[4px] bg-surface-container-high rounded-full border border-outline-variant select-none">
            <span className="material-symbols-outlined text-primary text-md select-none font-bold animate-pulse">
              bolt
            </span>
            <span className="font-label text-label-sm text-primary font-medium tracking-wide">
              Introducing Pro Coach AI v2.5
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl text-on-surface font-extrabold tracking-tight leading-[1.05] max-w-2xl">
            Own Your Preparation.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
              Close Your Skill Gaps.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-body-lg text-on-surface-variant max-w-lg leading-relaxed select-text">
            Upload your resume and target job description to map your skill alignment and practice with a stateful AI interviewer that grills you in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-md w-full sm:w-auto">
            <Button variant="primary" size="lg" className="pulse-glow" onClick={onGetStarted}>
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              const el = document.getElementById('features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              Explore Features
            </Button>
          </div>

          {/* Trust stats row */}
          <div className="grid grid-cols-3 gap-lg border-t border-outline-variant/30 pt-lg w-full max-w-md select-none">
            <div>
              <h4 className="text-headline-md font-bold text-on-surface">94%</h4>
              <span className="text-body-xs text-on-surface-variant">Placement Rate</span>
            </div>
            <div>
              <h4 className="text-headline-md font-bold text-on-surface">15k+</h4>
              <span className="text-body-xs text-on-surface-variant">Mock Sessions</span>
            </div>
            <div>
              <h4 className="text-headline-md font-bold text-on-surface">10x</h4>
              <span className="text-body-xs text-on-surface-variant">Confidence Boost</span>
            </div>
          </div>
        </div>

        {/* Right Column - Bento Visual Grid */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-md w-full relative">
          {/* Large Live AI Analysis Card (span-2) */}
          <GlassCard className="col-span-2 p-lg relative overflow-hidden flex flex-col gap-sm min-h-[220px]">
            {/* Shimmer sweeping texture overlay */}
            <div className="absolute inset-0 shimmer pointer-events-none opacity-20" />
            
            <div className="flex items-center justify-between z-10 select-none">
              <span className="text-label-sm font-bold text-primary uppercase tracking-widest">
                Live AI Analysis
              </span>
              <div className="flex items-center gap-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-body-xs text-on-surface-variant">Processing Resume</span>
              </div>
            </div>

            <div className="flex flex-col gap-sm mt-md z-10">
              <div className="space-y-xs">
                <div className="flex justify-between text-body-xs text-on-surface-variant font-medium">
                  <span>Match Probability</span>
                  <span>82%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div className="space-y-xs">
                <div className="flex justify-between text-body-xs text-on-surface-variant font-medium">
                  <span>Language Alignment</span>
                  <span>65%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full animate-pulse" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Tone Analysis Feature Card */}
          <GlassCard className="p-md flex flex-col gap-xs text-left">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center mb-sm">
              <span className="material-symbols-outlined text-lg font-bold">
                graphic_eq
              </span>
            </div>
            <h3 className="font-headline font-bold text-label-md text-on-surface select-none">
              Tone & Speed
            </h3>
            <p className="text-body-xs text-on-surface-variant leading-relaxed">
              Monitors speech speed, fillers, and confidence ratings dynamically.
            </p>
          </GlassCard>

          {/* Gap Detection Feature Card */}
          <GlassCard className="p-md flex flex-col gap-xs text-left">
            <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center mb-sm">
              <span className="material-symbols-outlined text-lg font-bold">
                analytics
              </span>
            </div>
            <h3 className="font-headline font-bold text-label-md text-on-surface select-none">
              Gap Detection
            </h3>
            <p className="text-body-xs text-on-surface-variant leading-relaxed">
              Flags missing skills and constructs custom mock interview paths instantly.
            </p>
          </GlassCard>
        </div>

      </div>
    </section>
  );
}