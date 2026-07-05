export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/60 py-xl font-body relative z-10 select-none">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-xl text-left px-md">
        
        {/* Branding Block */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-md select-none font-bold">
                filter_center_focus
              </span>
            </div>
            <span className="font-headline font-bold text-body-lg text-on-surface">
              CareerLens <span className="text-primary">AI</span>
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-on-surface-variant max-w-xs">
            Own your interview preparation and bridge the gaps between where you are and where you want to be. Powered by Google Gemini.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-xs">
          <h5 className="font-label text-label-sm uppercase font-bold tracking-wider text-on-surface">
            Features
          </h5>
          <nav className="flex flex-col gap-[6px] text-body-sm text-on-surface-variant font-medium">
            <a href="#features" className="hover:text-primary transition-colors">Mock Room</a>
            <a href="#features" className="hover:text-primary transition-colors">Gap Analysis</a>
            <a href="#features" className="hover:text-primary transition-colors">Analytics</a>
          </nav>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-xs">
          <h5 className="font-label text-label-sm uppercase font-bold tracking-wider text-on-surface">
            Company
          </h5>
          <nav className="flex flex-col gap-[6px] text-body-sm text-on-surface-variant font-medium">
            <a href="#" className="hover:text-primary transition-colors">About Us</a>
            <a href="#" className="hover:text-primary transition-colors">Careers</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </nav>
        </div>

        {/* Links Column 3 */}
        <div className="flex flex-col gap-xs">
          <h5 className="font-label text-label-sm uppercase font-bold tracking-wider text-on-surface">
            Support
          </h5>
          <nav className="flex flex-col gap-[6px] text-body-sm text-on-surface-variant font-medium">
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
            <a href="#" className="hover:text-primary transition-colors">FAQs</a>
            <a href="#" className="hover:text-primary transition-colors">API Status</a>
          </nav>
        </div>

      </div>

      <div className="container mx-auto mt-xl pt-lg border-t border-outline-variant/30 text-center text-body-xs text-on-surface-variant px-md">
        &copy; {new Date().getFullYear()} CareerLens AI. All rights reserved.
      </div>
    </footer>
  );
}