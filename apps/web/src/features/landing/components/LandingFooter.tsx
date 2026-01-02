export function LandingFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-12 text-gray-500">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src="/nexttale-logo.png" alt="Next Tale" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">NEXT TALE</span>
          </div>
          <p className="text-center text-sm md:text-left">
            AI-powered interactive fiction for adults
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="transition-colors hover:text-white">
              Terms
            </a>
            <a href="mailto:support@nexttale.app" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Next Tale. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
