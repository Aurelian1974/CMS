/**
 * Celulă fallback pentru valori null/undefined în grid-uri.
 * Înlocuiește <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
 * repetat în fiecare cellRenderer din paginile cu grid.
 */
export const NullCell = () => (
  <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
)
