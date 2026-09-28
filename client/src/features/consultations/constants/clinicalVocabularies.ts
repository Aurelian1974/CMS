/**
 * Vocabulare clinice pentru câmpurile de tip listă din Examenul Clinic.
 * Valorile se salvează ca text în ConsultationExam, deci orice modificare aici
 * trebuie să rămână compatibilă cu valorile deja înregistrate.
 */
export const STARE_GENERALA_OPTIONS = ['Bună', 'Relativ bună', 'Satisfăcătoare', 'Medie', 'Alterată', 'Rea', 'Gravă'] as const

export const TEGUMENTE_OPTIONS = ['Normale', 'Normal colorate', 'Palide', 'Subicterice', 'Cianotice', 'Icterice', 'Eritematoase'] as const

export const MUCOASE_OPTIONS = ['Roz', 'Normal colorate', 'Palide', 'Icterice', 'Uscate'] as const

export const EDEME_OPTIONS = ['Absente', 'Ușoare', 'Moderate', 'Severe', 'Prezente membre inferioare', 'Generalizate', 'Periferice'] as const

export const GANGLIONI_OPTIONS = ['Nepalpabili', 'Palpabili, nedureroși', 'Palpabili, dureroși', 'Adenopatii', 'Normali', 'Măriți regional', 'Măriți generalizat'] as const
