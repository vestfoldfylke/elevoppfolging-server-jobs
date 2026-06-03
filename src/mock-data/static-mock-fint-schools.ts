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
              identifikatorverdi: "123456789012"
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
      }
    ]
  },
  {
    skolenummer: "33362297", // Hobbitun VGS
    elevforhold: [
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
              identifikatorverdi: "234567890123"
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
              identifikatorverdi: "f803cc35-d190-49df-b108-ef5017607be0"
            },
            gyldighetsperiode: {
              start: "2020-08-15T00:00:00Z",
              slutt: "2022-08-15T00:00:00Z"
            },
            klasse: {
              navn: "1913STB",
              systemId: {
                identifikatorverdi: "039715c5-7fbc-4867-b4eb-67cbdcf33ba6"
              },
              trinn: {
                navn: "VG1913",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "e69a37a8-9f48-4c82-b326-282645cec981"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "4b3bc7b0-d2e5-4938-949e-c5e97dcb6c9e"
                    },
                    feidenavn: {
                      identifikatorverdi: "vilde.johannessen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Vilde",
                        mellomnavn: null,
                        etternavn: "Johannessen"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "8b2c8a8e-8ac1-44e1-8e15-698c7552d18a"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "5d668bba-1dc6-4b9c-833e-b40bf9422396"
                    },
                    feidenavn: {
                      identifikatorverdi: "mathias.kleven.skoglund.i@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Mathias Kleven Skoglund",
                        mellomnavn: null,
                        etternavn: "I"
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
              identifikatorverdi: "619c2473-e724-47ea-a67f-f996158a8566"
            },
            gyldighetsperiode: {
              start: "2123-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "GYM445",
              systemId: {
                identifikatorverdi: "ec1ba10a-5113-4e22-8ea5-3666144fdf39"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "4140d168-1053-488a-b91c-8e30cecf440e"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "bb71cae8-78cd-4eba-b90a-4c12ba4efdc5"
                    },
                    feidenavn: {
                      identifikatorverdi: "even.christiansen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Even",
                        mellomnavn: null,
                        etternavn: "Christiansen"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "9d320579-fdef-4ee6-b1cc-d343b610b0a7"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "a27fd057-cd34-48f8-a89a-bfc50044caed"
                    },
                    feidenavn: {
                      identifikatorverdi: "markus.pettersen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Markus",
                        mellomnavn: null,
                        etternavn: "Pettersen"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "cedf0545-9312-4a01-8a98-4b5dc97b0c63"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "GYM895",
              systemId: {
                identifikatorverdi: "a8cf3527-197f-4b4d-abda-33b1f5b97e80"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "26b1ee56-6599-4c1b-919e-50d5a27fcfc2"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "2ac87924-a9eb-4237-a0a8-1d871fcd1ca9"
                    },
                    feidenavn: {
                      identifikatorverdi: "mathilde.karlsen.sr.@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Mathilde Karlsen",
                        mellomnavn: null,
                        etternavn: "Sr."
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "5c93a3ee-8a80-49fb-8faa-216d70b21852"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "GYM301",
              systemId: {
                identifikatorverdi: "1b8f532e-a707-479b-89ec-d6b5c4ebbd61"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "973c7043-3bd5-4e1d-858d-eb6cc82fa658"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "673b3240-d03b-447b-b127-40804a9a752e"
                    },
                    feidenavn: {
                      identifikatorverdi: "alexander.svendsen.sørlie@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Alexander Svendsen",
                        mellomnavn: null,
                        etternavn: "Sørlie"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "908d1930-c2ec-4889-bb42-bf5a4726d7ca"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "06b38990-6c61-40e7-9789-d4f71b5098ea"
                    },
                    feidenavn: {
                      identifikatorverdi: "tuva.løken@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Tuva",
                        mellomnavn: null,
                        etternavn: "Løken"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "1eb25d10-8549-4bb7-b612-b75e9884ac47"
            },
            gyldighetsperiode: {
              start: "2020-08-15T00:00:00Z",
              slutt: "2022-08-15T00:00:00Z"
            },
            undervisningsgruppe: {
              navn: "MAT1941",
              systemId: {
                identifikatorverdi: "f698e497-0fa1-4383-88e6-ac538c73cec3"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "280ee333-edf6-4462-ac97-1667c1a37664"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "5eedea32-446c-4c21-82fe-6d5426c42bb8"
                    },
                    feidenavn: {
                      identifikatorverdi: "sara.stensrud.solli@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Sara Stensrud",
                        mellomnavn: null,
                        etternavn: "Solli"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "ddd0e5b0-8870-4740-b708-2e34c61a9273"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "4beadf1b-79bc-45cb-b44c-69d3567f0bdf"
                    },
                    feidenavn: {
                      identifikatorverdi: "sindre.smedsrud.olstad@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Sindre Smedsrud",
                        mellomnavn: null,
                        etternavn: "Olstad"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "61424887-7343-4e4a-be05-eb611c9636f4"
            },
            gyldighetsperiode: {
              start: "2020-08-15T00:00:00Z",
              slutt: "2022-08-15T00:00:00Z"
            },
            undervisningsgruppe: {
              navn: "LØK1892",
              systemId: {
                identifikatorverdi: "583b7f8f-11ce-4f1e-b07e-14ec9930d802"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "de128e22-6f31-48ac-bd36-038fa9b51efb"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "b59bd04e-fcac-4042-948d-2fe997787ad6"
                    },
                    feidenavn: {
                      identifikatorverdi: "elias.hagen.sr.@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Elias Hagen",
                        mellomnavn: null,
                        etternavn: "Sr."
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "ecfb6a94-545f-4bff-a8ce-0263f9f757cc"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "863d54b5-32fd-409e-bc5c-1c5e6f8c4ce9"
                    },
                    feidenavn: {
                      identifikatorverdi: "synne.huseby.svendsen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Synne Huseby",
                        mellomnavn: null,
                        etternavn: "Svendsen"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "e9eff236-fd10-4f70-b769-29c939c6b197"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "36df3d26-be6b-41fc-aaac-b6a844006efd"
                    },
                    feidenavn: {
                      identifikatorverdi: "ida.finstad@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Ida",
                        mellomnavn: null,
                        etternavn: "Finstad"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "e370b552-1cda-4570-980e-4e1e06cca726"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "MAT1655",
              systemId: {
                identifikatorverdi: "a6711d4d-2675-4e7f-b3b5-34b15b142885"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "35698092-89a6-42ea-b3ee-f2bb36fe5731"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "72251dd0-5bf3-4f3b-8ef1-8d899c2bffb3"
                    },
                    feidenavn: {
                      identifikatorverdi: "sindre.østby@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Sindre",
                        mellomnavn: null,
                        etternavn: "Østby"
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
              identifikatorverdi: "f9e498ae-33ac-4a60-aa64-421f86b5d46f"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "936TUT",
              systemId: {
                identifikatorverdi: "a646e535-ec05-4dec-a2b2-f5859cef04d8"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "40f1bd61-22f3-4990-9db6-2390f6e5a975"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7bcb5ea0-9fea-4920-b345-2bcf421c6c62"
                    },
                    feidenavn: {
                      identifikatorverdi: "dr..johannes.olstad@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Dr. Johannes",
                        mellomnavn: null,
                        etternavn: "Olstad"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "8fcd9ad7-318c-43ba-b8a0-76b365c3bce1"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "e693cb2b-5401-4d1f-b05a-3e3ccda7e70c"
                    },
                    feidenavn: {
                      identifikatorverdi: "prof..camilla.eriksen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Prof. Camilla",
                        mellomnavn: null,
                        etternavn: "Eriksen"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "b479c3c0-f54b-4597-9b59-e6e76ccc60cc"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "b6e86da2-8a06-4c68-a5c6-93f2bf848258"
                    },
                    feidenavn: {
                      identifikatorverdi: "mia.karlsen.berge@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Mia Karlsen",
                        mellomnavn: null,
                        etternavn: "Berge"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "2fe0a63c-ff22-4e1f-9ebb-bed64cf5b284"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "cd7c8813-3bd2-4ebb-9641-e23e5b72517d"
                    },
                    feidenavn: {
                      identifikatorverdi: "dr..sandra.martinsen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Dr. Sandra",
                        mellomnavn: null,
                        etternavn: "Martinsen"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "2cc52509-2f5c-4618-a810-dbd7e9c35539"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "1743BAB",
              systemId: {
                identifikatorverdi: "29a7fc5d-a813-4712-aacd-4f978d3dac00"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "554d4f30-1c05-445a-99e4-12bfe71ddd71"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "0065e378-37e1-4eac-85f5-d7ac60d98efa"
                    },
                    feidenavn: {
                      identifikatorverdi: "emilie.nilsen.kvarme@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Emilie Nilsen",
                        mellomnavn: null,
                        etternavn: "Kvarme"
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
  },
  {
    skolenummer: "17616906", // Gondor VGS
    elevforhold: [
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
          slutt: "2022-08-15T00:00:00Z"
        },
        klassemedlemskap: [
          {
            systemId: {
              identifikatorverdi: "484f6b3c-4c1f-4fb3-82c4-d817c9d521c2"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "420SUP",
              systemId: {
                identifikatorverdi: "472846e5-dcb3-4285-bc40-2e9a984d5a44"
              },
              trinn: {
                navn: "VG420",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "6e0c0453-ab7b-4e6a-ba7c-162e01ac2fc5"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "04383d9e-a923-4132-9e2c-7e57765724ac"
                    },
                    feidenavn: {
                      identifikatorverdi: "prof..sunniva.ødegård.solberg@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Prof. Sunniva Ødegård",
                        mellomnavn: null,
                        etternavn: "Solberg"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "c7d7f4bc-69dd-440d-a61d-ce3195db47c8"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "1947SUP",
              systemId: {
                identifikatorverdi: "439d437b-e771-4a46-98a2-7aa9abc71883"
              },
              trinn: {
                navn: "VG1947",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "f0db8a26-79c9-4bd6-b164-be81d2ff22cf"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "e53fe6d8-5dd4-4998-a36b-d6da6f2e42b9"
                    },
                    feidenavn: {
                      identifikatorverdi: "dr..sunniva.nygård@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Dr. Sunniva",
                        mellomnavn: null,
                        etternavn: "Nygård"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "bff350d8-bc90-499d-8a0a-b7c9daed2d2d"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            klasse: {
              navn: "1125BAB",
              systemId: {
                identifikatorverdi: "bfad8044-a8d8-401b-8a7a-944ee10d7953"
              },
              trinn: {
                navn: "VG1125",
                grepreferanse: ["VGS"]
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "f1b83739-8a04-4d1e-a86b-12fe52d3a8fc"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "c4e69a1d-5394-453f-a31e-3d66428ba9ee"
                    },
                    feidenavn: {
                      identifikatorverdi: "vilde.carlsen.evensen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Vilde Carlsen",
                        mellomnavn: null,
                        etternavn: "Evensen"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "12bc925d-ddcd-4b96-9562-c63ad01f0052"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "8c3be1e2-4fbb-44b1-814b-5877a4d79df5"
                    },
                    feidenavn: {
                      identifikatorverdi: "mikkel.sæther.vedvik.ii@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Mikkel Sæther Vedvik",
                        mellomnavn: null,
                        etternavn: "II"
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
              identifikatorverdi: "071b455a-da38-4779-a97b-73507913493b"
            },
            gyldighetsperiode: {
              start: "2123-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "SAMF1685",
              systemId: {
                identifikatorverdi: "58303567-c2f4-40e3-97a5-4c93b735818d"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "a08783cc-100a-43c9-8c09-532d007a70ca"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "936c559e-45c0-4a14-87c5-fdecc591ceef"
                    },
                    feidenavn: {
                      identifikatorverdi: "dr..tiril.johannessen@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Dr. Tiril",
                        mellomnavn: null,
                        etternavn: "Johannessen"
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            systemId: {
              identifikatorverdi: "f537f742-0e73-43f2-80b1-18cfaa4a4836"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            undervisningsgruppe: {
              navn: "NOR25",
              systemId: {
                identifikatorverdi: "e3d55d8e-67bc-439c-8177-247eea4c2560"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "47fc7af8-4de1-4c74-9980-6725cc49239f"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "7a65fedc-d5b4-4af6-92d6-11e15aa58fd1"
                    },
                    feidenavn: {
                      identifikatorverdi: "emma.sørlie@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Emma",
                        mellomnavn: null,
                        etternavn: "Sørlie"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "7aeab8ed-e492-4833-aff1-7189d190753a"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "603b4e81-775b-4d3c-8bab-ba6a0988c1a2"
                    },
                    feidenavn: {
                      identifikatorverdi: "daniel.løken@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Daniel",
                        mellomnavn: null,
                        etternavn: "Løken"
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
              identifikatorverdi: "5b61f685-1417-4718-a758-23f156debdff"
            },
            gyldighetsperiode: {
              start: "2022-08-15T00:00:00Z",
              slutt: null
            },
            kontaktlarergruppe: {
              navn: "1034STB",
              systemId: {
                identifikatorverdi: "c4f944bb-c5fd-4593-b9c8-2c95124a6d84"
              },
              undervisningsforhold: [
                {
                  systemId: {
                    identifikatorverdi: "6d103a3e-1bb6-40cd-98ad-837298cc8043"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "125d6fcd-e1b0-47d9-b3b8-dcfae3ec73ed"
                    },
                    feidenavn: {
                      identifikatorverdi: "isak.berntsen.sr.@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Isak Berntsen",
                        mellomnavn: null,
                        etternavn: "Sr."
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "a4ca087f-70d0-4d5d-a802-356b327960a4"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "c72f376b-4ed6-4f82-b6c9-80ec39ed9a08"
                    },
                    feidenavn: {
                      identifikatorverdi: "helene.solli.bjørnstad@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Helene Solli",
                        mellomnavn: null,
                        etternavn: "Bjørnstad"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "4cca6b7c-65ce-44dc-b196-bd6e9c6ddb1c"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "f7c25791-fd31-45fe-9138-816c19e02ce5"
                    },
                    feidenavn: {
                      identifikatorverdi: "mia.østby@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Mia",
                        mellomnavn: null,
                        etternavn: "Østby"
                      }
                    }
                  }
                },
                {
                  systemId: {
                    identifikatorverdi: "0a769f66-62a0-4b48-b72c-47f3484d2502"
                  },
                  skoleressurs: {
                    systemId: {
                      identifikatorverdi: "1c143897-868b-4115-ae1b-0b6e1fcd8364"
                    },
                    feidenavn: {
                      identifikatorverdi: "vilde.nygård.vedvik@fylke.no"
                    },
                    person: {
                      navn: {
                        fornavn: "Vilde Nygård",
                        mellomnavn: null,
                        etternavn: "Vedvik"
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
