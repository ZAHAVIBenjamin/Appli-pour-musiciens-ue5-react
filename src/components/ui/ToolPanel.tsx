import { Outlet } from 'react-router'

// Panneau de l'outil actif : collé sur la face active du cube (voir Cube.tsx, EI-07).
// <Outlet /> = l'emplacement où le routeur affiche l'outil qui correspond à l'adresse.
export default function ToolPanel() {
  return (
    <section className="tool-panel">
      <Outlet />
    </section>
  )
}
