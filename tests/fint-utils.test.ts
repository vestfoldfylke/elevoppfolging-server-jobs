import assert from "node:assert"
import { describe, it } from "node:test"
import { FINT_ADDRESS_BLOCK_ADDRESSES } from "../src/config.js"
import { hasStudentBlockedAddress } from "../src/lib/fint/utils.js"
import type { FintElev } from "../src/types/fint/fint-school-with-students.js" // NOTE: v3 and v4 are equal

const generalFintElev: FintElev = {
  systemId: {
    identifikatorverdi: "12345"
  },
  feidenavn: {
    identifikatorverdi: "12345"
  },
  elevnummer: {
    identifikatorverdi: "12345"
  },
  person: {
    navn: {
      fornavn: "Bjarne",
      mellomnavn: "",
      etternavn: "Betjent"
    },
    fodselsnummer: {
      identifikatorverdi: "12345"
    },
    bostedsadresse: {
      adresselinje: ["Sesam Stasjon, 1470 Lørenskog"]
    }
  }
}

describe("fint-utils", () => {
  describe("hasStudentBlockedAddress", () => {
    it("should return false for student with 'adresselinje' set to an actual address", () => {
      const hasBlockedAddress: boolean = hasStudentBlockedAddress(generalFintElev)
      assert.equal(hasBlockedAddress, false, `Student with "adresselinje" '${generalFintElev.person.bostedsadresse?.adresselinje?.[0] ?? "N/A"}' is falsely marked as blocked address`)
    })

    it("should return false for student with 'adresselinje' \"KLIENTADRESSE\"", () => {
      const fintElevWithClientAddress: FintElev = {
        ...generalFintElev,
        person: {
          ...generalFintElev.person,
          bostedsadresse: {
            adresselinje: ["KLIENTADRESSE"]
          }
        }
      }

      const hasBlockedAddress: boolean = hasStudentBlockedAddress(fintElevWithClientAddress)
      assert.equal(hasBlockedAddress, false, `Student with "adresselinje" '${fintElevWithClientAddress.person.bostedsadresse?.adresselinje?.[0] ?? "N/A"}' is falsely marked as blocked address`)
    })

    FINT_ADDRESS_BLOCK_ADDRESSES.forEach((blockAddress: string) => {
      it(`should return true for student with 'adresselinje' "${blockAddress}"`, () => {
        const fintElevWithBlockedAddress: FintElev = {
          ...generalFintElev,
          person: {
            ...generalFintElev.person,
            bostedsadresse: {
              adresselinje: [blockAddress]
            }
          }
        }

        const hasBlockedAddress: boolean = hasStudentBlockedAddress(fintElevWithBlockedAddress)
        assert.equal(hasBlockedAddress, true, `Student with "adresselinje" '${fintElevWithBlockedAddress.person.bostedsadresse?.adresselinje?.[0] ?? "N/A"}' is falsely marked as not blocked address`)
      })
    })
  })
})
