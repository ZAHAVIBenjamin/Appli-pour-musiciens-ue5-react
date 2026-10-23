// Modèle 3D du cube. Chaque face accueillera un outil de /components/tools
// TODO : projeter l'UI sur les faces (drei <Html transform> ou textures Canvas)
export default function Cube() {
  return (
    <mesh>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  )
}
