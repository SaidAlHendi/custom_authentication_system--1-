// utils/errorHandler.ts

/**
 * Extrahiert nur deine eigene Fehlernachricht aus Convex-Fehlern
 * @param error - Der Fehler von Convex
 * @returns Bereinigte Fehlernachricht
 */
export function getCleanErrorMessage(error: any): string {
  if (!error) {
    return 'Ein unerwarteter Fehler ist aufgetreten.'
  }

  const message = error.message || error.toString()
  console.log('Original error message:', message) // Debug log

  // Für ConvexError (wenn du ConvexError verwendest)
  if (error.data?.message) {
    return error.data.message
  }

  // Methode 1: Extrahiere nur den Text zwischen "Uncaught Error: " und " at "
  const uncaughtErrorMatch = message.match(/Uncaught Error:\s*(.+?)\s+at\s/)
  if (uncaughtErrorMatch) {
    return uncaughtErrorMatch[1].trim()
  }

  // Methode 2: Wenn kein " at " vorhanden, nimm alles nach "Uncaught Error: "
  const simpleUncaughtMatch = message.match(/Uncaught Error:\s*(.+?)$/)
  if (simpleUncaughtMatch) {
    return simpleUncaughtMatch[1].trim()
  }

  // Methode 3: Entferne schrittweise alle Convex-spezifischen Teile
  let cleanMessage = message
    .replace(/^\[CONVEX.*?\]\s*/, '') // Entfernt [CONVEX ...]
    .replace(/\[Request ID:.*?\]\s*/, '') // Entfernt [Request ID: ...]
    .replace(/Server Error\s*/, '') // Entfernt "Server Error"
    .replace(/Uncaught Error:\s*/, '') // Entfernt "Uncaught Error: "
    .replace(/\s+at\s+handler.*$/s, '') // Entfernt " at handler..." bis Ende
    .replace(/\s+Called by client.*$/s, '') // Entfernt " Called by client..."
    .trim()

  return cleanMessage || 'Ein unerwarteter Fehler ist aufgetreten.'
}

/**
 * Wrapper für Convex Mutations mit automatischer Fehlerbehandlung
 * @param mutationFn - Die Convex Mutation Funktion
 * @param args - Argumente für die Mutation
 * @returns Promise mit bereinigten Fehlern
 */
export async function callWithCleanErrors<T>(
  mutationFn: (args: any) => Promise<T>,
  args: any
): Promise<T> {
  try {
    return await mutationFn(args)
  } catch (error) {
    const cleanMessage = getCleanErrorMessage(error)
    throw new Error(cleanMessage)
  }
}

// Deutsche Fehlermeldungen für häufige Fälle
const germanErrorMessages: Record<string, string> = {
  'Invalid session': 'Ungültige Sitzung. Bitte loggen Sie sich erneut ein.',
  'Access denied': 'Zugriff verweigert.',
  'Object not found': 'Objekt nicht gefunden.',
  'User not found': 'Benutzer nicht gefunden.',
  'Invalid email or password': 'Ungültige E-Mail oder Passwort.',
  'Current password is incorrect': 'Das aktuelle Passwort ist falsch.',
  'Account is not active': 'Das Konto ist nicht aktiv.',
  'Only admin can set this status':
    'Nur Administratoren können diesen Status setzen.',
  'Object is completed and cannot be edited':
    'Das Objekt ist abgeschlossen und kann nicht bearbeitet werden.',
  'Cannot edit completed object':
    'Abgeschlossene Objekte können nicht bearbeitet werden.',
  'Cannot edit released object':
    'Freigegebene Objekte können nicht bearbeitet werden.',
  'Cannot edit object under review':
    'Objekte in Überprüfung können nicht bearbeitet werden.',
}

/**
 * Übersetzt englische Fehlermeldungen ins Deutsche
 * @param message - Die Fehlernachricht
 * @returns Deutsche Übersetzung oder Original
 */
export function translateErrorMessage(message: string): string {
  return germanErrorMessages[message] || message
}

/**
 * Kombiniert Clean Error Handler mit deutscher Übersetzung
 * @param error - Der Fehler von Convex
 * @returns Bereinigte deutsche Fehlernachricht
 */
export function getGermanErrorMessage(error: any): string {
  const cleanMessage = getCleanErrorMessage(error)
  return translateErrorMessage(cleanMessage)
}
