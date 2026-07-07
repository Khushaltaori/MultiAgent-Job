import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TopNavBar } from '../components/layout/TopNavBar';
import { Hero } from '../components/landing/Hero';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { Footer } from '../components/landing/Footer';
import { AuthModal } from '../components/landing/AuthModal';
import { GlassCard } from '../components/ui/GlassCard';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Top Navbar */}
      <TopNavBar variant="landing" onGetStarted={() => handleOpenAuth('register')} />

      {/* Main Container */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onGetStarted={() => handleOpenAuth('register')} />

        {/* Feature Grid Section */}
        <FeatureGrid />

        {/* Benefits/Assessment Promo Section */}
        <section id="benefits" className="py-16 md:py-24 relative overflow-hidden font-body">
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-[90px] pointer-events-none" />
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-xl items-center relative z-10 text-left px-md">
            <div className="lg:col-span-7 flex flex-col gap-md">
              <span className="font-label text-label-sm text-primary uppercase font-bold tracking-widest">
                Dynamic Simulators
              </span>
              <h2 className="font-headline text-headline-md md:text-headline-lg font-bold text-on-surface">
                Get Targeted Prep for High-Growth Roles
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed select-text">
                Connect your professional background directly to senior requirements. We highlight overlap, map missing skills, and build custom situational questions to test your architectural depth and leadership instincts.
              </p>
            </div>
            
            <div className="lg:col-span-5 w-full">
              <GlassCard className="p-lg flex flex-col gap-sm">
                <h4 className="font-headline font-bold text-headline-sm text-on-surface text-center select-none">
                  Assess Alignment in 3 Minutes
                </h4>
                <p className="text-body-sm text-on-surface-variant text-center select-text">
                  Upload a resume and any target role description to check your match index instantly.
                </p>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="w-full py-sm bg-primary text-on-primary font-label font-bold rounded-xl hover:bg-opacity-95 transition-colors mt-sm select-none"
                >
                  Start Career Mapping
                </button>
              </GlassCard>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <Footer />

      {/* Auth Modal overlay */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialTab={authTab}
        />
      )}
    </div>
  );
}