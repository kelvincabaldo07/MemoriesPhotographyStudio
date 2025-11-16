export default function Footer() {
  return (
    <footer className="border-t mt-auto py-6 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} Memories Photography Studio. All rights reserved.
          </p>
          
          {/* Legal Links */}
          <div className="flex items-center gap-6 text-sm">
            <a 
              href="/privacy" 
              className="text-gray-600 dark:text-gray-400 hover:text-[#0b3d2e] dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-gray-400">|</span>
            <a 
              href="/terms" 
              className="text-gray-600 dark:text-gray-400 hover:text-[#0b3d2e] dark:hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
        
        {/* Tagline */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-3">
          Capture With Purpose. Create Change.
        </p>
      </div>
    </footer>
  );
}
