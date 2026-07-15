import { useElementsStore } from '../store/elementsStore';
const STROKE_COLORS = [
  { value: 'transparent', label: 'None' },
  { value: '#1e1e1e', label: 'Black' },
  { value: '#e03131', label: 'Red' },
  { value: '#2f9e44', label: 'Green' },
  { value: '#1971c2', label: 'Blue' },
  { value: '#f08c00', label: 'Orange' },
  { value: '#9c36b5', label: 'Purple' },
  { value: '#e8590c', label: 'Vermilion' },
  { value: '#ffffff', label: 'White' },
];

const BG_COLORS = [
  { value: 'transparent', label: 'None' },
  { value: '#fff9db80', label: 'Yellow tint' },
  { value: '#ffd8a880', label: 'Peach tint' },
  { value: '#ffc9c980', label: 'Red tint' },
  { value: '#d3f9d880', label: 'Green tint' },
  { value: '#a5d8ff80', label: 'Blue tint' },
  { value: '#e5dbff80', label: 'Purple tint' },
  { value: '#1e1e1e80', label: 'Dark' },
  { value: '#ffffff80', label: 'White' },
];
const StylePreview = ({ roughness }: { roughness: number }) => {
  if (roughness === 0) {
    return (
      <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="8" x2="32" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (roughness === 1) {
    return (
      <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 9 Q10 6 18 8 Q26 10 32 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    );
  }
  return (
    <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8 L9 5 L13 11 L18 5 L22 11 L27 5 L32 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};
const ColorSwatch = ({
  color, selected, onClick, title,
}: {
  color: string; selected: boolean; onClick: () => void; title: string;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md relative overflow-hidden ${
      selected ? 'border-indigo-500 shadow-sm scale-105' : 'border-ui-border'
    }`}
    style={{ backgroundColor: color === 'transparent' ? undefined : color }}
  >
    {color === 'transparent' && (
      <div className="absolute inset-0 bg-white dark:bg-gray-800">
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0/8px 8px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[130%] h-0.5 bg-red-400 rotate-45" />
        </div>
      </div>
    )}
  </button>
);

export const StylePanel = () => {
  const elements = useElementsStore(state => state.elements);
  const appState = useElementsStore(state => state.appState);
  const updateElement = useElementsStore(state => state.updateElement);
  const setAppState = useElementsStore(state => state.setAppState);
  const addHistoryPoint = useElementsStore(state => state.addHistoryPoint);

  const selectedElements = elements.filter(el => appState.selectedElementIds.includes(el.id) && !el.isDeleted);

  const activeStyle: any = selectedElements.length > 0
    ? {
        strokeColor: selectedElements[0].strokeColor,
        backgroundColor: selectedElements[0].backgroundColor,
        strokeWidth: selectedElements[0].strokeWidth,
        roughness: selectedElements[0].roughness,
        fontFamily: selectedElements[0].fontFamily,
        fontSize: selectedElements[0].fontSize,
        textAlign: selectedElements[0].textAlign,
      }
    : appState.currentItemStyle;

  const updateStyle = (key: string, value: string | number) => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(el => updateElement(el.id, { [key]: value }));
      addHistoryPoint();
    } else {
      setAppState({ currentItemStyle: { ...appState.currentItemStyle, [key]: value } });
    }
  };

  const isShapeTool = ['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'freedraw', 'text'].includes(appState.activeTool);
  if (selectedElements.length === 0 && !isShapeTool) return null;

  const isText = appState.activeTool === 'text' || selectedElements.some(el => el.type === 'text');

  const STROKE_WIDTHS = [
    { value: 1, label: 'S' },
    { value: 2, label: 'M' },
    { value: 4, label: 'L' },
  ];

  const ROUGHNESSES = [
    { value: 0, label: 'Clean' },
    { value: 1, label: 'Hand' },
    { value: 2, label: 'Rough' },
  ];

  const FONT_FAMILIES = [
    { value: 'sans-serif', label: 'Sans' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Mono' },
  ];

  const FONT_SIZES = [
    { value: 16, label: 'S' },
    { value: 20, label: 'M' },
    { value: 28, label: 'L' },
    { value: 36, label: 'XL' },
  ];

  const TEXT_ALIGNS = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];

  return (
    <div className="absolute left-4 top-20 bg-ui-bg border border-ui-border rounded-xl shadow-lg p-4 w-60 z-10 text-sm flex flex-col gap-4 select-none">

      {/* Stroke Color */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Stroke</span>
        <div className="flex gap-1.5 flex-wrap">
          {STROKE_COLORS.map(({ value, label }) => (
            <ColorSwatch
              key={`stroke-${value}`}
              color={value}
              selected={activeStyle.strokeColor === value}
              onClick={() => updateStyle('strokeColor', value)}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Background</span>
        <div className="flex gap-1.5 flex-wrap">
          {BG_COLORS.map(({ value, label }) => (
            <ColorSwatch
              key={`bg-${value}`}
              color={value}
              selected={activeStyle.backgroundColor === value}
              onClick={() => updateStyle('backgroundColor', value)}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Stroke Width</span>
        <div className="flex gap-1.5 bg-ui-bg-hover p-1 rounded-lg">
          {STROKE_WIDTHS.map(({ value, label }) => (
            <button
              key={`width-${value}`}
              title={`${label} (${value}px)`}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 rounded-md transition-all ${
                activeStyle.strokeWidth === value
                  ? 'bg-ui-bg shadow-sm text-indigo-500'
                  : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => updateStyle('strokeWidth', value)}
            >
              <div className="bg-current rounded-full" style={{ width: 16, height: value === 1 ? 1.5 : value === 2 ? 3 : 5 }} />
              <span className="text-[9px] font-medium opacity-60">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Line Style (roughness) */}
      {!isText && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Style</span>
          <div className="flex gap-1.5 bg-ui-bg-hover p-1 rounded-lg">
            {ROUGHNESSES.map(({ value, label }) => (
              <button
                key={`roughness-${value}`}
                title={label}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-md transition-all ${
                  activeStyle.roughness === value
                    ? 'bg-ui-bg shadow-sm text-indigo-500'
                    : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                onClick={() => updateStyle('roughness', value)}
              >
                <StylePreview roughness={value} />
                <span className="text-[9px] font-medium mt-0.5 opacity-70">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Options */}
      {isText && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Font Family</span>
            <div className="flex gap-1.5 bg-ui-bg-hover p-1 rounded-lg">
              {FONT_FAMILIES.map(({ value, label }) => (
                <button
                  key={`font-${value}`}
                  className={`flex-1 py-1 text-xs rounded-md transition-all ${
                    activeStyle.fontFamily === value
                      ? 'bg-ui-bg shadow-sm text-indigo-500'
                      : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ fontFamily: value }}
                  onClick={() => updateStyle('fontFamily', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Font Size</span>
            <div className="flex gap-1.5 bg-ui-bg-hover p-1 rounded-lg">
              {FONT_SIZES.map(({ value, label }) => (
                <button
                  key={`size-${value}`}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    activeStyle.fontSize === value
                      ? 'bg-ui-bg shadow-sm text-indigo-500'
                      : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  onClick={() => updateStyle('fontSize', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-ui-fg-muted uppercase tracking-widest">Alignment</span>
            <div className="flex gap-1.5 bg-ui-bg-hover p-1 rounded-lg">
              {TEXT_ALIGNS.map(({ value, label }) => (
                <button
                  key={`align-${value}`}
                  className={`flex-1 py-1 text-xs rounded-md transition-all ${
                    activeStyle.textAlign === value
                      ? 'bg-ui-bg shadow-sm text-indigo-500'
                      : 'text-ui-fg hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  onClick={() => updateStyle('textAlign', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
