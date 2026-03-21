import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerLicense } from '@syncfusion/ej2-base'
import { L10n, loadCldr, setCulture, setCurrencyCode } from '@syncfusion/ej2-base'
import * as roGregorian from 'cldr-data/main/ro/ca-gregorian.json'
import * as roNumbers from 'cldr-data/main/ro/numbers.json'
import * as roTimeZones from 'cldr-data/main/ro/timeZoneNames.json'
import * as supplementalNumberingSystems from 'cldr-data/supplemental/numberingSystems.json'
import * as supplementalWeekData from 'cldr-data/supplemental/weekData.json'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ===== Syncfusion CSS — Bootstrap 5 theme (import order matters) =====
import '@syncfusion/ej2-base/styles/bootstrap5.css'
import '@syncfusion/ej2-buttons/styles/bootstrap5.css'
import '@syncfusion/ej2-inputs/styles/bootstrap5.css'
import '@syncfusion/ej2-lists/styles/bootstrap5.css'
import '@syncfusion/ej2-popups/styles/bootstrap5.css'
import '@syncfusion/ej2-navigations/styles/bootstrap5.css'
import '@syncfusion/ej2-calendars/styles/bootstrap5.css'
import '@syncfusion/ej2-dropdowns/styles/bootstrap5.css'
import '@syncfusion/ej2-splitbuttons/styles/bootstrap5.css'
import '@syncfusion/ej2-grids/styles/bootstrap5.css'

import App from './App.tsx'
import './styles/main.scss'

// ===== Licență Syncfusion =====
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE ?? '')

// ===== Cultură română pentru componentele Syncfusion =====
setCulture('ro')
setCurrencyCode('RON')

// ===== Date CLDR pentru română (nume luni, zile, formate) =====
loadCldr(roGregorian, roNumbers, roTimeZones, supplementalNumberingSystems, supplementalWeekData)

// ===== Texte UI în română (L10n) =====
L10n.load({
  ro: {
    datepicker: {
      placeholder: 'zz.ll.aaaa',
      today: 'Azi',
    },
    calendar: {
      today: 'Azi',
    },
    timepicker: {
      placeholder: 'Selectați ora',
    },
    datetimepicker: {
      placeholder: 'zz.ll.aaaa hh:mm',
      today: 'Azi',
    },
    daterangepicker: {
      placeholder: 'Selectați intervalul',
      startLabel: 'De la',
      endLabel: 'Până la',
      applyText: 'Aplică',
      cancelText: 'Anulează',
      selectedDays: 'Zile selectate',
      days: 'Zile',
      today: 'Azi',
    },
    grid: {
      EmptyRecord: 'Nu există date de afișat',
      GroupDropArea: 'Trageți o coloană aici pentru a o grupa',
      UnGroup: 'Dezgrupează',
      EmptyDataSourceError: 'Sursa de date nu trebuie să fie goală la încărcarea inițială',
      Item: 'element',
      Items: 'elemente',
      Search: 'Caută',
      Excelfilter: 'Filtru Excel',
      Matchs: 'Nicio potrivire',
      FilterButton: 'Filtrează',
      ClearButton: 'Șterge',
      SelectAll: 'Selectează tot',
      Blanks: 'Goale',
      True: 'Adevărat',
      False: 'Fals',
    },
    pager: {
      currentPageInfo: '{0} din {1} pagini',
      totalItemsInfo: '({0} elemente)',
      pagerAllDropDown: 'Toate',
      pagerDropDown: 'Elemente pe pagină',
    },
  },
})

// ===== TanStack Query client =====
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ===== Mount =====
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

