import { FINT_ADDRESS_BLOCK } from "../config.js"
import type { MockFintSchool } from "../types/fint/fint-mock.js"
import type { FintElevforhold, FintSkole } from "../types/fint/fint-school-with-students.js"

type StaticElevforhold = {
  skolenummer: string
  elevforhold: Array<FintElevforhold | null>
}

const staticElevforhold: StaticElevforhold[] = [
  {
    skolenummer: "55074744", // Mordor VGS
    elevforhold: [
      {
        elev: {
          systemId: {
            identifikatorverdi: "a-demo-123456789"
          },
          elevnummer: {
            identifikatorverdi: "a-demo-123456789"
          },
          feidenavn: {
            identifikatorverdi: "a-demo-123456789@fylke.no"
          },
          person: {
            bostedsadresse: {
              adresselinje: ["A-DEMO 1"]
            },
            navn: {
              fornavn: "A-DEMO",
              mellomnavn: null,
              etternavn: "Snorkelberg"
            },
            fodselsnummer: {
              identifikatorverdi: "12345678901"
            }
          }
        },
        hovedskole: true,
        systemId: {
          identifikatorverdi: "f243e7cd-68ec-4142-b5fc-7956c3082bb9"
        },
        gyldighetsperiode: {
          start: "2022-08-15T00:00:00Z",
          slutt: null
        },
        klassemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "baf2aff1-9a25-4e3a-a0a3-c69d27392507"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "1077JAU",
              systemId: {
                identifikatorverdi: "b7364946-f903-45fd-af6d-4013eba07068"
              },
              trinn: {
                navn: "VG1077",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        undervisningsgruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6d2932db-faed-496d-bbfe-e8ec0cadf4f6"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "NOR1380",
              systemId: {
                identifikatorverdi: "162a2ea5-3387-421d-9f0c-6d465eea5f2e"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        kontaktlarergruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6c4d943e-b069-497b-a252-51a599f9d3ef"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "412JAU",
              systemId: {
                identifikatorverdi: "d67496ce-f498-4c73-a48a-9b711f571730"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      {
        elev: {
          systemId: {
            identifikatorverdi: "a-demo-234567890"
          },
          elevnummer: {
            identifikatorverdi: "a-demo-234567890"
          },
          feidenavn: {
            identifikatorverdi: "a-demo-234567890@fylke.no"
          },
          person: {
            bostedsadresse: {
              adresselinje: [FINT_ADDRESS_BLOCK]
            },
            navn: {
              fornavn: "A-DEMO",
              mellomnavn: null,
              etternavn: "Bananbukse"
            },
            fodselsnummer: {
              identifikatorverdi: "23456789012"
            }
          }
        },
        hovedskole: true,
        systemId: {
          identifikatorverdi: "c1eaf8ed-fd80-47e3-b133-6b5f7c4b5364"
        },
        gyldighetsperiode: {
          start: "2022-08-15T00:00:00Z",
          slutt: null
        },
        klassemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "baf2aff1-9a25-4e3a-a0a3-c69d27392507"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "1077JAU",
              systemId: {
                identifikatorverdi: "b7364946-f903-45fd-af6d-4013eba07068"
              },
              trinn: {
                navn: "VG1077",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        undervisningsgruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6d2932db-faed-496d-bbfe-e8ec0cadf4f6"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "NOR1380",
              systemId: {
                identifikatorverdi: "162a2ea5-3387-421d-9f0c-6d465eea5f2e"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        kontaktlarergruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6c4d943e-b069-497b-a252-51a599f9d3ef"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "412JAU",
              systemId: {
                identifikatorverdi: "d67496ce-f498-4c73-a48a-9b711f571730"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      {
        elev: {
          systemId: {
            identifikatorverdi: "a-demo-345678901"
          },
          elevnummer: {
            identifikatorverdi: "a-demo-345678901"
          },
          feidenavn: {
            identifikatorverdi: "a-demo-345678901@fylke.no"
          },
          person: {
            bostedsadresse: {
              adresselinje: ["A-DEMO 3"]
            },
            navn: {
              fornavn: "A-DEMO",
              mellomnavn: null,
              etternavn: "Tøffelhausen"
            },
            fodselsnummer: {
              identifikatorverdi: "34567890123"
            }
          }
        },
        hovedskole: true,
        systemId: {
          identifikatorverdi: "8c1674b6-8a65-432a-98d8-c24ad4c58904"
        },
        gyldighetsperiode: {
          start: "2020-08-15T00:00:00Z",
          slutt: null
        },
        klassemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "baf2aff1-9a25-4e3a-a0a3-c69d27392507"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "1077JAU",
              systemId: {
                identifikatorverdi: "b7364946-f903-45fd-af6d-4013eba07068"
              },
              trinn: {
                navn: "VG1077",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        undervisningsgruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6d2932db-faed-496d-bbfe-e8ec0cadf4f6"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "NOR1380",
              systemId: {
                identifikatorverdi: "162a2ea5-3387-421d-9f0c-6d465eea5f2e"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ],
        kontaktlarergruppemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "6c4d943e-b069-497b-a252-51a599f9d3ef"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "412JAU",
              systemId: {
                identifikatorverdi: "d67496ce-f498-4c73-a48a-9b711f571730"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "515f7d5c-2449-424b-a472-95d2364245b8"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a962532-ad0a-4aff-8087-fcce1bfd1534"
                    },
                    feidenavn: {
                      identifikatorverdi: "karoline.strand.aas@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Karoline Strand",
                        mellomnavn: null,
                        etternavn: "Aas"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  }
]

export const getStaticMockFintSchools = (schools: MockFintSchool[]): FintSkole[] => {
  return schools.map((school: MockFintSchool) => {
    return {
      elevforhold: staticElevforhold.find((ef: StaticElevforhold) => ef.skolenummer === school.schoolNumber)?.elevforhold ?? [],
      navn: school.name,
      skolenummer: {
        identifikatorverdi: school.schoolNumber
      }
    }
  })
}
