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
- Før vi oppdaterer elever basert på FINT-data wiper vi alle AUTOMATISKE elevforhold (altså de som kommer fra FINT), men vi beholder manuelle elevforhold (som er opprettet av brukere i APP'en, rådgivere eller no)
- Hvis en elev er opprettet manuelt, men plutselig dukker opp i FINT (med samme fnr), setter vi alle manuelle elevforhold til inaktivt på de manuelle skolene, der det har nå kommet et elevforhold på tilsvarende skole i FINT 
- Setter IKKE manuelle elevforhold til aktive igjen hvis eleven forsvinner fra FINT

TODO: utvide readme

## Scripts

### generate-fint-mock-data
Generates FINT-mock data and saves to local file - which is used as source data when running in mock-fint mode

### get-encryption-keys
Gets (and creates if missing) a given number of data encryption keys (see script file)
Must be run before initial startup of elevoppfølging web app for it to work.

requires following values in `./.env`

```bash
AZURE_TENANT_ID="<tenant-id>"
AZURE_CLIENT_ID="<client-id>" # Client (service principal) must have key-vault-administrator role on the key-vault
AZURE_CLIENT_SECRET="<client-secret>"
AZURE_MASTER_KEY_VERSION="<current key version>"
AZURE_MASTER_KEY_NAME="<name of key>"
AZURE_KEY_VAULT_ENDPOINT="https://<your-key-vault>.vault.azure.net/" # or something similar

MONGODB_CONNECTION_STRING="<connection-string>"
MONGODB_DB_NAME="<db-name>"
```

### rewrap-encryption-keys
Decrypts all data encryption keys, and reencrypts them with the new master key

requires following values in `./.env`

```bash
AZURE_TENANT_ID="<tenant-id>"
AZURE_CLIENT_ID="<client-id>" # Client (service principal) must have key-vault-administrator role on the key-vault
AZURE_CLIENT_SECRET="<client-secret>"
AZURE_MASTER_KEY_VERSION="<current key version>"
AZURE_MASTER_KEY_NAME="<name of key>"
AZURE_KEY_VAULT_ENDPOINT="https://<your-key-vault>.vault.azure.net/" # or something similar

MONGODB_CONNECTION_STRING="<connection-string>"
MONGODB_DB_NAME="<db-name>"
```

1. Create a new version of your key in azure key-vault
2. Change value of `AZURE_MASTER_KEY_VERSION` in ./.env to the new version
3. Run script and pray
4. If all good, disable the old master key in key-vault.
5. If not good, pray more
