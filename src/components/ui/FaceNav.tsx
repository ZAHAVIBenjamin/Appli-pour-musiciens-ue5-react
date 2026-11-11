import { NavLink } from 'react-router'
import { FACES } from '../../data/faces'

// Barre de navigation : un lien par face du cube.
// NavLink change l'adresse sans recharger la page, et ajoute la classe « active »
// au lien de la face affichée (voir index.css).
export default function FaceNav() {
  return (
    <nav className="face-nav">
      {FACES.map((face) => (
        <NavLink key={face.id} to={face.path}>
          {face.label}
        </NavLink>
      ))}
    </nav>
  )
}
