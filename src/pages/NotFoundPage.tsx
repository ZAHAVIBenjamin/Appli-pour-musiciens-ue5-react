import { Link, useNavigate } from 'react-router'

// Page 404 : affichée pour toute adresse qui ne correspond à aucune face (route « * » dans App)
export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div>
      <h2>404 : cette face n'existe pas</h2>
      <p>Le cube n'a que six faces.</p>
      {/* navigate(-1) : comme le bouton Précédent du navigateur */}
      <button onClick={() => navigate(-1)}>Retour</button>{' '}
      <Link to="/accordeur">Aller à l'accordeur</Link>
    </div>
  )
}
