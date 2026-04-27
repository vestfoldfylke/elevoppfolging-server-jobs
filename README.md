# elevoppfolging-server-jobs
Elevoppfølging server side jobs

## Setup

Opprett en .env-fil i rotmappen, og legg inn følgende variabler:

```env
# Set to "true" to enable mock FINT data mode
MOCK_FINT=
# Path to a .json file containing mock FINT data (required if MOCK_FINT is true)
MOCK_FINT_DATA_PATH=
# Application name (default: "elevoppfolging-server-jobs")
APP_NAME=
# Set to "true" to use a mock database client
MOCK_DB=
# Set to "true" to use a mock Entra client
MOCK_ENTRA=
# Suffix for Feide usernames (default: "fylke.no")
FEIDENAME_SUFFIX=
# MongoDB connection string (required for production)
MONGODB_CONNECTION_STRING=
# MongoDB database name (default: "elevoppfolging")
MONGODB_DB_NAME=
# Azure App Registration ID for the frontend (required unless MOCK_ENTRA is true)
FRONTEND_APP_REGISTRATION_ID=

# Generer en FINT Bearer token og lim inn når generering av typer trengs
FINT_GENERATE_TYPES_MANUAL_KEY=
```

## Brukersynkronisering
- Henter alle elevene fra FINT via skoler
- Henter alle eksisterende appStudents fra db
- Henter alle enterprise app users
- Henter alle eksisterende appUsers fra db
- Henter alle accessEntries fra db
- Henter alle schools fra db
- En appStudent inneholder eleven, alle elevforholdene, underliggende klasser, undervinsinggrupper, faggrupper, kontaktlærergrupper, og alle lærere under der igjen.
- Går gjennom alle elever fra FINT, og oppretter/oppdaterer appStudents, før vi replacer hele collection med appStudents med nye data.
- Vi beholder alle elever i appStudents (sletter ingen elever automatisk), selv om de har blitt borte fra FINT. Men setter de til active false hvis de ikke har noen aktive elevforhold lenger.
- Før vi oppdaterer elever basert på FINT-data wiper vi alle AUTOMATISKE elevforhold (altså de som kommer fra FINT), men vi beholder manuelle elevforhold (som er opprettet av brukere i apppen, rådgivere ellerno)
- Hvis en elev er opprettet manuelt, men plutselig dukker opp i FINT (med samme fnr), setter vi alle manuelle elevforhold til inaktivt på de manuelle skolene, der det har nå kommet et elevforhold på tilsvarende skole i FINT 
- Setter IKKE manuelle elevforhold til aktive igjen hvis eleven forsvinner fra FINT

TODO: utvide readme
