/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ChatContainer } from './components/chat/ChatContainer';
import { ProjectsView } from './features/projects/ProjectsView';
import { LibraryView } from './features/files/LibraryView';
import { AgentsView } from './features/agents/AgentsView';
import { PromptsView } from './features/prompts/PromptsView';
import { ToolsView } from './features/tools/ToolsView';
import { ModelsView } from './features/models/ModelsView';
import { ModelCompareView } from './features/models/ModelCompareView';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/chat/:id" element={<ChatContainer />} />
          <Route path="/compare" element={<ModelCompareView />} />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/agents" element={<AgentsView />} />
          <Route path="/prompts" element={<PromptsView />} />
          <Route path="/tools" element={<ToolsView />} />
          <Route path="/models" element={<ModelsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
