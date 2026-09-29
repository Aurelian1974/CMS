// Token-ul de asociere cu fiscal bridge-ul de pe PC-ul curent (primit de la bridge la asocierea făcută de administrator).
// Stă în localStorage intenționat: e o setare a stației (ca o imprimantă asociată), nu un credențial
// al utilizatorului — funcționează doar împreună cu serviciul care ascultă pe 127.0.0.1 al acestui PC,
// iar bridge-ul acceptă doar originea ValyanClinic (CORS). Nu are legătură cu sesiunea / JWT-ul.
const STORAGE_KEY = 'valyan.fiscalBridge.token'

export const getBridgeToken = (): string | null => localStorage.getItem(STORAGE_KEY)

export const setBridgeToken = (token: string) => localStorage.setItem(STORAGE_KEY, token.trim())

export const clearBridgeToken = () => localStorage.removeItem(STORAGE_KEY)
