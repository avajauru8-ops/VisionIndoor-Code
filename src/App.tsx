/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminIntegration from './pages/admin/AdminIntegration';
import AdminTotems from './pages/admin/AdminTotems';
import AdminWidgets from './pages/admin/AdminWidgets';

import AgencyDashboard from './pages/agency/AgencyDashboard';
import AgencyTotems from './pages/agency/AgencyTotems';
import AgencyPlaylists from './pages/agency/AgencyPlaylists';
import AgencyPlaylistScreens from './pages/agency/AgencyPlaylistScreens';
import AgencyPlaylistView from './pages/agency/AgencyPlaylistView';
import AgencyTotemSettings from './pages/agency/AgencyTotemSettings';
import AgencyMedia from './pages/agency/AgencyMedia';
import AgencyListas from './pages/agency/AgencyListas';
import AgencyListaEdit from './pages/agency/AgencyListaEdit';
import AgencyNews from './pages/agency/AgencyNews';
import AgencyProfile from './pages/agency/AgencyProfile';
import AgencyMediaKit from './pages/agency/AgencyMediaKit';
import AgencyContracts from './pages/agency/AgencyContracts';
import AutoStartHelp from './pages/help/AutoStartHelp';

import WidgetClima from './pages/widgets/WidgetClima';
import WidgetLoteria from './pages/widgets/WidgetLoteria';
import WidgetYoutube from './pages/widgets/WidgetYoutube';
import WidgetNoticias from './pages/widgets/WidgetNoticias';
import WidgetFrases from './pages/widgets/WidgetFrases';
import WidgetHoraCerta from './pages/widgets/WidgetHoraCerta';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/widget/clima" element={<WidgetClima />} />
          <Route path="/widget/loteria" element={<WidgetLoteria />} />
          <Route path="/widget/youtube" element={<WidgetYoutube />} />
          <Route path="/widget/noticias" element={<WidgetNoticias />} />
          <Route path="/widget/frases" element={<WidgetFrases />} />
          <Route path="/widget/horacerta" element={<WidgetHoraCerta />} />
          
          <Route path="/" element={<Layout />}>
             <Route index element={<Navigate to="/login" replace />} />
             
             {/* Admin Routes */}
             <Route path="admin" element={<AdminDashboard />} />
             <Route path="admin/users" element={<AdminUsers />} />
             <Route path="admin/settings" element={<AdminSettings />} />
             <Route path="admin/integration" element={<AdminIntegration />} />
             <Route path="admin/totems" element={<AdminTotems />} />
             <Route path="admin/widgets" element={<AdminWidgets />} />
             
             {/* Agency Routes */}
             <Route path="agency" element={<AgencyDashboard />} />
             <Route path="agency/totems" element={<AgencyTotems />} />
             <Route path="agency/totems/:id" element={<AgencyTotemSettings />} />
             <Route path="agency/arquivos" element={<AgencyMedia />} />
             <Route path="agency/listas" element={<AgencyListas />} />
             <Route path="agency/listas/:id" element={<AgencyListaEdit />} />
             <Route path="agency/news" element={<AgencyNews />} />
             <Route path="agency/profile" element={<AgencyProfile />} />
             <Route path="agency/media-kit" element={<AgencyMediaKit />} />
             <Route path="agency/contracts" element={<AgencyContracts />} />
             <Route path="agency/help/autostart" element={<AutoStartHelp />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
