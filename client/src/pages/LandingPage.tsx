import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DotGridBackground } from '../components/ui/DotGridBackground';
import { RoughButton } from '../components/ui/RoughButton';
import { RoughCard } from '../components/ui/RoughCard';
import { DoodleAnim } from '../components/ui/DoodleAnim';
import { Canvas } from '../canvas/Canvas';
import { useElementsStore } from '../store/elementsStore';
import { Pen, Square, Circle, Diamond, Eraser, Cloud, Share2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const RevealSection = ({ children, delayMs = 0, className = "" }: { children: React.ReactNode, delayMs?: number, className?: string }) => {
  const { ref, className: revealClass, style } = useScrollReveal(delayMs);
  return (
    <div ref={ref} className={`${revealClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

export const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Isolate store on mount and unmount
  useEffect(() => {
    useElementsStore.getState().hydrateCanvas([], null);
    
    // Set default tool to freedraw for the demo
    useElementsStore.getState().setAppState({ activeTool: 'freedraw' });

    return () => {
      useElementsStore.getState().hydrateCanvas([], null);
    };
  }, []);

  const [activeTool, setActiveTool] = useState<'freedraw' | 'rectangle' | 'ellipse' | 'diamond' | 'eraser'>('freedraw');

  const handleToolSelect = (tool: any) => {
    useElementsStore.getState().setAppState({ activeTool: tool });
    setActiveTool(tool);
  };

  const ToolBtn = ({ tool, icon: Icon }: { tool: any, icon: any }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        handleToolSelect(tool);
      }}
      className={`p-2 rounded-lg transition-colors ${
        activeTool === tool ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-ui-fg hover:bg-ui-bg-hover'
      }`}
    >
      <Icon size={18} strokeWidth={activeTool === tool ? 2.5 : 2} />
    </button>
  );

  if (loading) {
    return <div className="min-h-screen bg-canvas-bg flex items-center justify-center text-ui-fg">Loading...</div>;
  }

  return (
    <DotGridBackground className="min-h-screen bg-canvas-bg relative flex flex-col items-center overflow-x-hidden selection:bg-yellow-200 dark:selection:bg-yellow-900">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8">
            <DoodleAnim />
          </div>
          <span className="font-excalifont text-xl font-bold tracking-tight text-ink">Xcalidraw</span>
        </div>
        <Link 
          to="/login"
          className="text-sm font-sans font-medium text-ui-fg-muted hover:text-ui-fg transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 z-10 relative">
        <div className="flex-1 flex flex-col items-start gap-6 max-w-xl">
          <h1 className="font-excalifont text-5xl md:text-6xl text-ink leading-[1.1]">
            Sketch ideas that stick around.
          </h1>
          <p className="font-sans text-lg md:text-xl text-ui-fg-muted">
            A fast, hand-drawn canvas tool to capture your thoughts, save to your account, and share with others.
          </p>
          <div className="pt-4">
            <RoughButton 
              onClick={() => navigate('/login')}
              variant="primary"
              className="text-lg px-8 py-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black"
            >
              Get Started
            </RoughButton>
          </div>
        </div>

        {/* Demo Canvas Container */}
        <div className="flex-1 w-full max-w-2xl bg-ui-bg border-2 border-ui-border rounded-2xl shadow-xl overflow-hidden flex flex-col relative" style={{ height: '400px' }}>
          {/* Mock Header for Demo */}
          <div className="h-12 border-b border-ui-border bg-ui-bg-hover flex items-center justify-between px-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            
            {/* Inline Toolbar for Demo */}
            <div className="flex items-center gap-1 bg-ui-bg p-1 rounded-lg border border-ui-border shadow-sm">
              <ToolBtn tool="freedraw" icon={Pen} />
              <ToolBtn tool="rectangle" icon={Square} />
              <ToolBtn tool="ellipse" icon={Circle} />
              <ToolBtn tool="diamond" icon={Diamond} />
              <ToolBtn tool="eraser" icon={Eraser} />
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
          
          <div className="flex-1 relative">
            <Canvas isDemo={true} />
            <div className="absolute inset-0 z-50 pointer-events-none" style={{ pointerEvents: 'none' }} />
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-20 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <RevealSection delayMs={0} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6 border border-yellow-200 dark:border-yellow-700">
              <Pen className="text-yellow-600 dark:text-yellow-400" size={32} />
            </div>
            <span className="font-excalifont text-4xl text-ink/20 mb-2">01</span>
            <h3 className="font-excalifont text-2xl text-ink mb-3">Start drawing</h3>
            <p className="font-sans text-ui-fg-muted">Open a blank canvas instantly. No complicated setup or onboarding required.</p>
          </RevealSection>
          <RevealSection delayMs={100} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-700">
              <Cloud className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <span className="font-excalifont text-4xl text-ink/20 mb-2">02</span>
            <h3 className="font-excalifont text-2xl text-ink mb-3">It saves itself</h3>
            <p className="font-sans text-ui-fg-muted">Every stroke autosaves to your account securely as you go.</p>
          </RevealSection>
          <RevealSection delayMs={200} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 border border-indigo-200 dark:border-indigo-700">
              <Share2 className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>
            <span className="font-excalifont text-4xl text-ink/20 mb-2">03</span>
            <h3 className="font-excalifont text-2xl text-ink mb-3">Share when ready</h3>
            <p className="font-sans text-ui-fg-muted">Generate a link and choose exactly who can view or edit your ideas.</p>
          </RevealSection>
        </div>
      </section>

      {/* Feature 1: Autosave */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 relative">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <RevealSection delayMs={0} className="flex-1 w-full order-2 md:order-1">
            <h3 className="font-excalifont text-4xl text-ink mb-4">Never lose a thought.</h3>
            <p className="font-sans text-lg text-ui-fg-muted">
              Your canvas state is saved automatically to your account as you make changes. Forget hitting save, just focus on your ideas.
            </p>
          </RevealSection>
          <RevealSection delayMs={100} className="flex-1 w-full order-1 md:order-2">
            <RoughCard className="bg-ui-bg p-8 flex items-center justify-center min-h-[200px]">
              <div className="px-4 py-2 bg-ui-bg border-2 border-ui-border rounded-lg shadow-sm flex items-center gap-2">
                <Cloud size={16} className="text-green-500" />
                <span className="font-sans text-sm text-ui-fg font-medium">Autosaved</span>
              </div>
            </RoughCard>
          </RevealSection>
        </div>
      </section>

      {/* Feature 2: Share */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 relative">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <RevealSection delayMs={0} className="flex-1 w-full order-1 md:order-1">
            <RoughCard className="bg-ui-bg">
              <h2 className="text-xl font-virgil text-ink mb-4">Share Canvas</h2>
              <div className="flex gap-2 mb-6">
                <RoughButton variant="primary" className="flex-1 text-sm py-2 pointer-events-none">
                  Public Link
                </RoughButton>
                <RoughButton variant="secondary" className="flex-1 text-sm py-2 pointer-events-none">
                  Private
                </RoughButton>
              </div>
              <div className="p-3 bg-canvas-bg rounded border border-ui-border flex justify-between items-center">
                <span className="text-xs text-ui-fg-muted truncate">https://xcalidraw.com/c/123...</span>
                <span className="text-xs text-indigo-500 font-medium ml-2">Copy</span>
              </div>
            </RoughCard>
          </RevealSection>
          <RevealSection delayMs={100} className="flex-1 w-full order-2 md:order-2">
            <h3 className="font-excalifont text-4xl text-ink mb-4">Share and collaborate.</h3>
            <p className="font-sans text-lg text-ui-fg-muted">
              Generate a shareable link in one click. Choose whether visitors can edit the canvas or just view it.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* Feature 3: Auth */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 relative">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <RevealSection delayMs={0} className="flex-1 w-full order-2 md:order-1">
            <h3 className="font-excalifont text-4xl text-ink mb-4">Easy authentication.</h3>
            <p className="font-sans text-lg text-ui-fg-muted">
              Sign in securely using your Google or GitHub account, or stick to a standard email and password.
            </p>
          </RevealSection>
          <RevealSection delayMs={100} className="flex-1 w-full order-1 md:order-2">
            <RoughCard className="bg-ui-bg p-8 flex flex-col gap-4">
              <RoughButton variant="secondary" className="w-full pointer-events-none flex items-center justify-center gap-2">
                Continue with Google
              </RoughButton>
              <RoughButton variant="secondary" className="w-full pointer-events-none flex items-center justify-center gap-2">
                Continue with GitHub
              </RoughButton>
            </RoughCard>
          </RevealSection>
        </div>
      </section>

      {/* Keyboard Shortcuts Teaser */}
      <section className="w-full max-w-4xl mx-auto px-4 py-24 z-10 relative text-center">
        <RevealSection delayMs={0}>
          <h3 className="font-excalifont text-4xl text-ink mb-4">Move at the speed of thought.</h3>
          <p className="font-sans text-lg text-ui-fg-muted mb-12">
            Keep your hands on the keyboard with intuitive shortcuts.
          </p>
        </RevealSection>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {[
            { key: 'V', label: 'Select' },
            { key: 'P', label: 'Freedraw' },
            { key: 'R', label: 'Rectangle' },
            { key: 'Space', label: 'Pan', wide: true },
            { key: 'Ctrl+Z', label: 'Undo', wide: true }
          ].map((shortcut, idx) => (
            <RevealSection key={shortcut.key} delayMs={(idx + 1) * 100} className="flex flex-col items-center gap-3">
              <RoughCard className={`bg-ui-bg flex items-center justify-center ${shortcut.wide ? 'w-24' : 'w-16'} h-16 !p-0`}>
                <span className="font-sans font-bold text-ink">{shortcut.key}</span>
              </RoughCard>
              <span className="font-excalifont text-sm text-ui-fg-muted">{shortcut.label}</span>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-24 z-10 relative flex flex-col items-center text-center bg-ui-bg/50 border-t border-ui-border backdrop-blur-sm">
        <RevealSection delayMs={0} className="max-w-xl mx-auto px-4 flex flex-col items-center">
          <h2 className="font-excalifont text-4xl md:text-5xl text-ink mb-8">Ready to start sketching?</h2>
          <RoughButton 
            onClick={() => navigate('/login')}
            variant="primary"
            className="text-lg px-8 py-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black"
          >
            Get Started
          </RoughButton>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className="w-full text-center p-8 z-10 relative text-ui-fg-muted font-sans text-sm border-t border-ui-border bg-ui-bg">
        <p>&copy; {new Date().getFullYear()} Xcalidraw</p>
      </footer>
    </DotGridBackground>
  );
};
