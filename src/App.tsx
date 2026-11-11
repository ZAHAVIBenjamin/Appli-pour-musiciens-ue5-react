import { Navigate, Route, Routes } from 'react-router'
import { FACES } from './data/faces'
import Layout from './components/ui/Layout'
import NotFoundPage from './pages/NotFoundPage'

// Les routes de l'appli : à chaque adresse, l'outil à afficher.
// Toutes les routes sont DANS la route Layout : le cube et la barre restent affichés,
// seul l'outil (à l'emplacement <Outlet /> du panneau) change.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Adresse « / » : on redirige vers l'accordeur (replace : pas d'étape en plus dans l'historique) */}
        <Route index element={<Navigate to="/accordeur" replace />} />

        {/* Une route par face, fabriquée à partir de la liste FACES */}
        {FACES.map((face) => (
          <Route key={face.id} path={face.path} element={<face.Tool />} />
        ))}

        {/* « * » : toutes les autres adresses → page 404 (le cube et la barre restent affichés) */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
