// src/main/database/sql.d.ts
// Permite importar arquivos .sql como string crua via Vite (`?raw`),
// inlinando o conteúdo no bundle do Main Process.
declare module '*.sql?raw' {
  const content: string
  export default content
}
