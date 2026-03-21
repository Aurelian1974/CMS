/**
 * Fișier de setup global pentru teste Vitest.
 * Rulat automat înainte de fiecare fișier de test (configurat în vitest.config.ts).
 *
 * - Importă @testing-library/jest-dom pentru matchers suplimentari pe DOM
 *   (toBeVisible, toBeInTheDocument, toHaveTextContent, etc.)
 * - Cleanup-ul după fiecare test este gestionat automat de @testing-library/react
 *   cu globals: true în vitest.config.ts
 */
import '@testing-library/jest-dom';
