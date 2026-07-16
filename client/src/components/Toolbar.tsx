import { useElementsStore } from '../store/elementsStore';
import { 
  Lock, Hand, MousePointer2, Square, Diamond, Circle, 
  MoveRight, Minus, Pen, Type, Image as ImageIcon, Eraser,
  Zap
} from 'lucide-react';

export const Toolbar = () => {
  const activeTool = useElementsStore((state) => state.appState.activeTool);
  const setAppState = useElementsStore((state) => state.setAppState);

  const isToolLocked = useElementsStore((state) => state.appState.isToolLocked);
  const addToast = useElementsStore((state) => state.addToast);

  const handleLockToggle = () => {
    const newState = !isToolLocked;
    setAppState({ isToolLocked: newState });
    addToast(newState ? 'Canvas locked (View Only)' : 'Canvas unlocked', newState ? 'info' : 'success');
  };

  const ToolButton = ({ tool, icon: Icon, label, shortcut, active, onClick }: { tool?: any, icon: any, label?: string, shortcut?: string, active?: boolean, onClick?: () => void }) => {
    const isActive = active !== undefined ? active : (tool && activeTool === tool);
    const handleClick = onClick || (() => tool && setAppState({ activeTool: tool }));
    return (
      <button 
        onClick={handleClick}
        title={label ? `${label} ${shortcut ? `(${shortcut})` : ''}` : undefined}
        className={`p-2 flex items-center justify-center rounded-lg transition-colors relative ${
          isActive 
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
            : 'text-ui-fg hover:bg-ui-bg-hover'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        {shortcut && (
          <span className="absolute bottom-0.5 right-0.5 text-[9px] text-ui-fg-muted font-medium select-none pointer-events-none">
            {shortcut}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex w-max items-center gap-1 bg-ui-bg p-1.5 rounded-xl shadow-md border border-ui-border transition-colors mx-auto">
      <ToolButton 
        icon={Lock} 
        label="Lock Canvas (View Only)" 
        active={isToolLocked}
        onClick={handleLockToggle}
      />
      <div className="w-px h-6 bg-ui-border mx-1 transition-colors"></div>
      <ToolButton tool="hand" icon={Hand} label="Hand (Pan)" />
      <ToolButton tool="select" icon={MousePointer2} label="Select" shortcut="1" />
      <ToolButton tool="rectangle" icon={Square} label="Rectangle" shortcut="2" />
      <ToolButton tool="diamond" icon={Diamond} label="Diamond" shortcut="3" />
      <ToolButton tool="ellipse" icon={Circle} label="Ellipse" shortcut="4" />
      <ToolButton tool="arrow" icon={MoveRight} label="Arrow" shortcut="5" />
      <ToolButton tool="line" icon={Minus} label="Line" shortcut="6" />
      <ToolButton tool="freedraw" icon={Pen} label="Draw" shortcut="7" />
      <ToolButton tool="text" icon={Type} label="Text" shortcut="8" />
      <ToolButton tool="image" icon={ImageIcon} label="Image" shortcut="9" />
      <ToolButton tool="eraser" icon={Eraser} label="Eraser" shortcut="0" />
      <ToolButton tool="laser" icon={Zap} label="Laser Pointer" shortcut="l" />
    </div>
  );
};
