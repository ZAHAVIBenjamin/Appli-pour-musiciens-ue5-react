import { Outlet } from 'react-router'

// Panneau provisoire : affiche l'outil de la face active, par-dessus la scène 3D.
// Plus tard, chaque outil sera projeté sur sa face du cube (partie 3D, E + I).
// <Outlet /> = l'emplacement où le routeur affiche l'outil qui correspond à l'adresse.
export default function ToolPanel() {
  return (
    <section className="tool-panel">
      <Outlet />
    </section>
  )
}
