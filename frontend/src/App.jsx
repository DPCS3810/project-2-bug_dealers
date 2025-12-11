import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Editor from './pages/Editor';
import Share from './pages/Share';
import AlbumDetail from './pages/AlbumDetail';
import Search from './pages/Search';
import GoogleCallback from './pages/GoogleCallback';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="editor/:id" element={<Editor />} />
          <Route path="album/:id" element={<AlbumDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="share/:token" element={<Share />} />
          <Route path="auth/callback" element={<GoogleCallback />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
