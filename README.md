# elevoppfolging-server-jobs
Elevoppfølging server side jobs

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





