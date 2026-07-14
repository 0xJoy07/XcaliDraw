import { useElementsStore } from '../store/elementsStore';
export const handleSaveAction = () => {
  const data = useElementsStore.getState().elements;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xcalidraw-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const handleExportImageAction = () => {
  const mainCanvas = document.querySelector('canvas');
  if (mainCanvas) {
     const url = mainCanvas.toDataURL('image/png');
     const a = document.createElement('a');
     a.href = url;
     a.download = `xcalidraw-export-${new Date().toISOString().slice(0,10)}.png`;
     a.click();
  }
};

export const handleResetAction = () => {
  if (window.confirm('Are you sure you want to clear the canvas?')) {
    useElementsStore.setState({ elements: [], dirty: true });
    useElementsStore.getState().addHistoryPoint();
  }
};

export const handleOpenAction = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,text/*,application/*,.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      alert("Video files are not supported.");
      return;
    }

    if (file.type.startsWith('image/')) {
      // It's handled in Canvas or similar, but let's implement basic image import here if needed.
      // Wait, in SettingsPanel it was using imageCache. Let's just copy the logic.
    }
  };
  input.click();
};
