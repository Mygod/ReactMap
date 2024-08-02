// @ts-check
const path = require('path')
const router = require('express').Router()

const { log, HELPERS } = require('@rm/logger')
const { Db, Event } = require('../../../services/initialization')

const queryObj = /** @type {const} */ ({
  pokemon: { model: 'Pokemon', category: 'pokemon' },
  quests: { model: 'Pokestop', category: 'pokestops' },
  raids: { model: 'Gym', category: 'gyms' },
  nests: { model: 'Nest', category: 'nests' },
})

/** @param {string} category */
const resolveCategory = (category) => {
  switch (category) {
    case 'gym':
    case 'gyms':
    case 'raid':
    case 'raids':
      return 'raids'
    case 'pokestop':
    case 'pokestops':
    case 'quest':
    case 'quests':
      return 'quests'
    case 'pokemon':
    case 'pokemons':
      return 'pokemon'
    default:
      return 'all'
  }
}

/** @param {boolean} compare */
const getAll = async (compare) => {
  const available = compare
    ? await Promise.all([
        Db.getAvailable('Pokemon'),
        Db.getAvailable('Pokestop'),
        Db.getAvailable('Gym'),
        Db.getAvailable('Nest'),
      ])
    : [
        Event.available.pokemon,
        Event.available.pokestops,
        Event.available.gyms,
        Event.available.nests,
      ]
  return Object.fromEntries(
    Object.keys(queryObj).map((key, i) => [key, available[i]]),
  )
}

router.get(['/', '/:category'], async (req, res) => {
  try {
    const { model, category } =
      queryObj[resolveCategory(req.params.category)] || {}
    const { current, equal } = req.query

    if (model && category) {
      const available =
        current !== undefined
          ? await Db.getAvailable(model)
          : Event.available[category]
      available.sort((a, b) => a.localeCompare(b))

      if (equal !== undefined) {
        const compare =
          current !== undefined
            ? Event.available[category]
            : await Db.getAvailable(model)
        compare.sort((a, b) => a.localeCompare(b))
        res.status(200).json(available.every((item, i) => item === compare[i]))
      } else {
        res.status(200).json(available)
      }
    } else {
      const available = await getAll(!!current)
      Object.values(available).forEach((c) =>
        c.sort((a, b) => a.localeCompare(b)),
      )

      if (equal !== undefined) {
        const compare = await getAll(!current)
        Object.values(compare).forEach((c) =>
          c.sort((a, b) => a.localeCompare(b)),
        )

        res
          .status(200)
          .json(
            Object.keys(available).every((cat) =>
              available[cat].every((item, j) => item === compare[cat][j]),
            ),
          )
      } else {
        res.status(200).json(available)
      }
    }
    log.info(HELPERS.api, `api/v1/${path.parse(__filename).name}`)
  } catch (e) {
    log.error(HELPERS.api, `api/v1/${path.parse(__filename).name}`, e)
    res.status(500).json({ status: 'ServerError', reason: e.message })
  }
})

router.put('/:category', async (req, res) => {
  try {
    const { model, category } =
      queryObj[resolveCategory(req.params.category)] || {}

    if (model && category) {
      await Event.setAvailable(category, model, Db)
    } else {
      await Promise.all([
        Event.setAvailable('pokemon', 'Pokemon', Db),
        Event.setAvailable('pokestops', 'Pokestop', Db),
        Event.setAvailable('gyms', 'Gym', Db),
        Event.setAvailable('nests', 'Nest', Db),
      ])
    }
    log.info(
      HELPERS.api,
      `api/v1/${path.parse(__filename).name} - updated availabled for ${
        category || 'all'
      }`,
    )
    res
      .status(200)
      .json({ status: `updated available for ${category || 'all'}` })
  } catch (e) {
    log.error(HELPERS.api, `api/v1/${path.parse(__filename).name}`, e)
    res.status(500).json({ status: 'ServerError', reason: e.message })
  }
})

module.exports = router
