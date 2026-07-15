import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Book, Code, PenTool, Layers, Database, GitPullRequest, Map as MapIcon, ArrowLeft } from 'lucide-react';
import { Installation } from './pages/Installation';
import { ProjectStructure } from './pages/ProjectStructure';
import { RunningAndBuilding } from './pages/RunningAndBuilding';
import { ArchitectureOverview } from './pages/ArchitectureOverview';
import { RenderPipeline } from './pages/RenderPipeline';
import { SpatialIndexing } from './pages/SpatialIndexing';
import { StateManagement } from './pages/StateManagement';
import { CoordinateSystems } from './pages/CoordinateSystems';
import { Selection } from './pages/Selection';
import { MoveAndResize } from './pages/MoveAndResize';
import { TextEditing } from './pages/TextEditing';
import { LaserTool } from './pages/LaserTool';
import { CanvasRoot } from './pages/CanvasRoot';
import { SidebarDocs } from './pages/SidebarDocs';
import { ToolbarDocs } from './pages/ToolbarDocs';
import { SharedUI } from './pages/SharedUI';
import { ElementSchema } from './pages/ElementSchema';
import { AppStateSchema } from './pages/AppStateSchema';
import { CodeStyle } from './pages/CodeStyle';
import { AddingNewTool } from './pages/AddingNewTool';
import { AddingNewElementType } from './pages/AddingNewElementType';
import { DebuggingTips } from './pages/DebuggingTips';
import { Roadmap } from './pages/Roadmap';
import { DocsIndex } from './pages/DocsIndex';

const NAV_GROUPS = [
  {
    title: 'Getting Started',
    icon: Book,
    links: [
      { to: 'getting-started/installation', label: 'Installation' },
      { to: 'getting-started/project-structure', label: 'Project Structure' },
      { to: 'getting-started/running-and-building', label: 'Running & Building' },
    ]
  },
  {
    title: 'Architecture',
    icon: Layers,
    links: [
      { to: 'architecture/overview', label: 'Overview' },
      { to: 'architecture/render-pipeline', label: 'Render Pipeline' },
      { to: 'architecture/spatial-indexing', label: 'Spatial Indexing' },
      { to: 'architecture/state-management', label: 'State Management' },
      { to: 'architecture/coordinate-systems', label: 'Coordinate Systems' },
    ]
  },
  {
    title: 'Core Systems',
    icon: Code,
    links: [
      { to: 'core-systems/selection', label: 'Selection' },
      { to: 'core-systems/move-and-resize', label: 'Move & Resize' },
      { to: 'core-systems/text-editing', label: 'Text Editing' },
      { to: 'core-systems/laser-tool', label: 'Laser Tool' },
    ]
  },
  {
    title: 'Components',
    icon: PenTool,
    links: [
      { to: 'components/canvas-root', label: 'Canvas Root' },
      { to: 'components/sidebar', label: 'Sidebar' },
      { to: 'components/toolbar', label: 'Toolbar' },
      { to: 'components/shared-ui', label: 'Shared UI' },
    ]
  },
  {
    title: 'Data Model',
    icon: Database,
    links: [
      { to: 'data-model/element-schema', label: 'Element Schema' },
      { to: 'data-model/app-state-schema', label: 'App State Schema' },
    ]
  },
  {
    title: 'Contributing',
    icon: GitPullRequest,
    links: [
      { to: 'contributing/code-style', label: 'Code Style' },
      { to: 'contributing/adding-new-tool', label: 'Adding a New Tool' },
      { to: 'contributing/adding-element-type', label: 'Adding Element Type' },
      { to: 'contributing/debugging-tips', label: 'Debugging Tips' },
    ]
  },
  {
    title: 'Roadmap',
    icon: MapIcon,
    links: [
      { to: 'roadmap', label: 'Future Roadmap' },
    ]
  }
];

export const DocsLayout = () => {
  return (
    <div className="flex h-screen bg-black text-white font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-black border-r border-white/10 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black-hover">
          <div className="font-semibold flex items-center gap-2">
            <Book size={18} className="text-white" />
            <span>Developer Docs</span>
          </div>
        </div>
        
        <div className="p-4 pb-2">
          <NavLink 
            to="/" 
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black-hover px-3 py-2 rounded-md"
          >
            <ArrowLeft size={16} />
            Back to App
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                <group.icon size={14} />
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={`/docs/${link.to}`}
                      className={({ isActive }) => 
                        `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive 
                            ? 'bg-gray-100 dark:bg-gray-800 text-white font-medium' 
                            : 'text-gray-400 hover:text-white dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2d2d2d]/50'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-black">
        <div className="max-w-4xl mx-auto py-12 px-8 lg:px-12">
          <Routes>
            <Route index element={<DocsIndex />} />
            
            <Route path="getting-started/installation" element={<Installation />} />
            <Route path="getting-started/project-structure" element={<ProjectStructure />} />
            <Route path="getting-started/running-and-building" element={<RunningAndBuilding />} />
            
            <Route path="architecture/overview" element={<ArchitectureOverview />} />
            <Route path="architecture/render-pipeline" element={<RenderPipeline />} />
            <Route path="architecture/spatial-indexing" element={<SpatialIndexing />} />
            <Route path="architecture/state-management" element={<StateManagement />} />
            <Route path="architecture/coordinate-systems" element={<CoordinateSystems />} />
            
            <Route path="core-systems/selection" element={<Selection />} />
            <Route path="core-systems/move-and-resize" element={<MoveAndResize />} />
            <Route path="core-systems/text-editing" element={<TextEditing />} />
            <Route path="core-systems/laser-tool" element={<LaserTool />} />
            
            <Route path="components/canvas-root" element={<CanvasRoot />} />
            <Route path="components/sidebar" element={<SidebarDocs />} />
            <Route path="components/toolbar" element={<ToolbarDocs />} />
            <Route path="components/shared-ui" element={<SharedUI />} />
            
            <Route path="data-model/element-schema" element={<ElementSchema />} />
            <Route path="data-model/app-state-schema" element={<AppStateSchema />} />
            
            <Route path="contributing/code-style" element={<CodeStyle />} />
            <Route path="contributing/adding-new-tool" element={<AddingNewTool />} />
            <Route path="contributing/adding-element-type" element={<AddingNewElementType />} />
            <Route path="contributing/debugging-tips" element={<DebuggingTips />} />
            
            <Route path="roadmap" element={<Roadmap />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/docs" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
