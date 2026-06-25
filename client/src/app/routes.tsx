// client/src/app/routes.tsx

import { Routes, Route, Link } from 'react-router-dom';

// Layout
import Navbar from '../shared/components/Navbar';
import Footer from '../shared/components/Footer';

// Shared
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

// Events
import { EventsPage } from '../features/events/pages/EventsPage';
import { EventDetailPage } from '../features/events/pages/EventDetailPage';
import { EventsApiPlayground } from '../features/events/pages/EventsApiPlayground';
import { EventForm } from '../features/events/components/EventForm';

// Reservations
import { ReservationsPage } from '../features/reservations/pages/ReservationsPage';

// Profile
import { ProfilePage } from '../features/profile/pages/ProfilePage';

export const AppRoutes = () => {
  return (
    <div className="app-wrapper">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* ========================================= */}
          {/* RUTAS PÚBLICAS */}
          {/* ========================================= */}

          <Route path="/" element={<EventsPage />} />

          <Route path="/events/:id" element={<EventDetailPage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          {/* ========================================= */}
          {/* HERRAMIENTAS DE DESARROLLO / PLAYGROUND */}
          {/* ========================================= */}

          <Route path="/debug/events" element={<EventsApiPlayground />} />

          {/* ========================================= */}
          {/* RUTAS PROTEGIDAS (requieren autenticación) */}
          {/* ========================================= */}

          <Route element={<ProtectedRoute />}>
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* ========================================= */}
          {/* RUTAS SOLO PARA ORGANIZADORES */}
          {/* ========================================= */}

          <Route element={<ProtectedRoute requiredRole="ORGANIZADOR" />}>
            <Route path="/events/create" element={<EventForm />} />
            <Route path="/events/:id/edit" element={<EventForm />} />
          </Route>

          {/* ========================================= */}
          {/* 404 - PÁGINA NO ENCONTRADA */}
          {/* ========================================= */}

          <Route
            path="*"
            element={
              <div className="not-found-page">
                <h1>404</h1>
                <h2>Página no encontrada</h2>
                <p>Lo sentimos, la página que buscas no existe.</p>
                <Link to="/" className="btn">
                  Volver al inicio
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};