import { en, Faker, nb_NO } from "@faker-js/faker"

export const norwegianFaker = new Faker({
  locale: [nb_NO, en]
})
