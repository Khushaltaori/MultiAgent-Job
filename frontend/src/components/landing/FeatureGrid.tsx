import { GlassCard } from '../ui/GlassCard';

export function FeatureGrid() {
  const features = [
    {
      title: 'Adaptive Scenarios',
      icon: 'psychology',
      iconColor: 'text-primary',
      bgGlow: 'from-primary/10',
      description: 'AI custom-generates mock interview questions in real-time, responding dynamically to the answers you give and probe deeper based on JD gaps.',
    },
    {
      title: 'Cognitive Feedback',
      icon: 'neurology',
      iconColor: 'text-tertiary',
      bgGlow: 'from-tertiary/10',
      description: 'Receive multi-dimensional feedback on your answers instantly: clarity and structure scoring, impact metrics, vocal tone advice, and confidence level gauges.',
    },
    {
      title: 'Roadmap Generation',
      icon: 'map',
      iconColor: 'text-secondary-fixed-dim',
      bgGlow: 'from-secondary-fixed-dim/10',
      description: 'Gain a personalized skill development roadmap with explicit steps to close highlighted gaps, linking your profile seamlessly to target roles.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-surface-container-lowest/40 border-y border-outline-variant/60 font-body relative">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto relative z-10 px-md">
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-sm mb-16">
          <span className="font-label text-label-sm text-primary uppercase font-bold tracking-widest">
            Key Architecture
          </span>
          <h2 className="font-headline text-headline-md md:text-headline-lg font-bold text-on-surface">
            Engineered for Senior-Level Results
          </h2>
          <p className="text-body-sm md:text-body-md text-on-surface-variant leading-relaxed select-text">
            Go beyond standard text-based Q&A. Practice with a cognitive partner that listens, adapts, and builds a customized career roadmap based on real gaps.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {features.map((feature, idx) => (
            <GlassCard
              key={idx}
              className={`p-lg relative overflow-hidden flex flex-col items-start text-left gap-md`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.bgGlow} to-transparent blur-2xl pointer-events-none`} />
              
              <div className={`w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center ${feature.iconColor}`}>
                <span className="material-symbols-outlined text-2xl font-bold select-none">
                  {feature.icon}
                </span>
              </div>

              <div className="space-y-xs">
                <h3 className="font-headline font-bold text-headline-sm text-on-surface select-none">
                  {feature.title}
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed select-text">
                  {feature.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}