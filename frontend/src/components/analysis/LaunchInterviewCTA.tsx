import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

export function LaunchInterviewCTA() {
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate('/interview');
  };

  return (
    <GlassCard className="relative overflow-hidden flex flex-col justify-between p-lg bg-gradient-to-br from-[#1d2745] to-[#11182e] border-outline-variant/60 hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 min-h-[300px] h-full font-body text-left">
      {/* Blurred decorative color circle absolute nodes */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/20 blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-tertiary/15 blur-lg pointer-events-none" />

      <div className="flex flex-col gap-sm relative z-10 select-none">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-lg leading-none select-none font-bold">
            forum
          </span>
        </div>

        <h3 className="font-headline font-bold text-headline-sm text-on-surface">
          Bridge Your Gaps Now
        </h3>
        
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Launch a target mock interview session tailored to probe the specific skill gaps identified in this report.
        </p>
      </div>

      <div className="relative z-10 w-full mt-lg">
        <Button
          variant="primary"
          icon="smart_toy"
          size="lg"
          onClick={handleLaunch}
          className="w-full justify-center pulse-glow"
        >
          Launch Interview Room
        </Button>
      </div>
    </GlassCard>
  );
}
