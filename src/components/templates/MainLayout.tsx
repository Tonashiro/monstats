import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MainLayout component props interface
 */
export interface MainLayoutProps {
  /** Content to render in the header */
  header?: React.ReactNode;
  /** Main content to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main layout template component
 * @param header - Content to render in the header
 * @param children - Main content to render
 * @param className - Additional CSS classes
 * @returns MainLayout component
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className="relative min-h-screen gradient-bg flex flex-col">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-150 h-150 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-150 h-150 bg-purple-600/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "container mx-auto px-4 py-8 relative z-10 flex-1",
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full border-t border-border/50 bg-background/80 backdrop-blur-sm z-10 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Built with 💜 by{" "}
              <a
                href="https://x.com/tonashiro_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 hover:underline transition-colors"
              >
                Tonashiro
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
