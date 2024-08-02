/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
// @ts-check
const router = require('express').Router()
const { log, HELPERS } = require('@rm/logger')
const { Db } = require('../../../services/state')

router.get('/', async (req, res) => {
  try {
    res.status(200).json(await Db.models.User.query())
    log.info(HELPERS.api, 'api/v1/users')
  } catch (e) {
    log.error(HELPERS.api, 'api/v1/sessions', e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

router.get('/export', async (req, res) => {
  try {
    /** @type {import('@rm/types').FullUser[]} */
    const users = await Db.models.User.query()

    const badges = {}

    /** @type {import('@rm/types').FullGymBadge[]} */
    const rawBadges = await Db.models.Badge.query()
    // eslint-disable-next-line no-unused-vars
    rawBadges.forEach(({ userId, id, ...rest }) => {
      if (!badges[userId]) {
        badges[userId] = []
      }
      badges[userId].push(rest)
    })

    const backups = {}
    /** @type {import('@rm/types').FullBackup[]} */
    const rawBackups = await Db.models.Backup.query()

    // eslint-disable-next-line no-unused-vars
    rawBackups.forEach(({ userId, id, ...rest }) => {
      if (!backups[userId]) {
        backups[userId] = []
      }
      backups[userId].push(rest)
    })

    const data = users.map(({ id, ...rest }) => ({
      ...rest,
      badges: badges[id] || [],
      backups: backups[id] || [],
    }))
    res.status(200).json(data)
    log.info(HELPERS.api, 'api/v1/users')
  } catch (e) {
    log.error(HELPERS.api, 'api/v1/users/export', e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

router.post('/import', async (req, res) => {
  try {
    const { body } = req
    const bodyArray = Array.isArray(body) ? body : [body]

    /**
     * @param {import('@rm/types').User} user
     * @returns {Promise<import('@rm/types').FullUser>}
     */
    const getUser = async (user) => {
      if (user.username) {
        const found = await Db.models.User.query().select().findOne({
          username: user.username,
        })
        if (found) return found
      }
      if (user.discordId) {
        const found = await Db.models.User.query().select().findOne({
          discordId: user.discordId,
        })
        if (found) return found
      }
      if (user.telegramId) {
        const found = await Db.models.User.query().select().findOne({
          telegramId: user.telegramId,
        })
        if (found) return found
      }
      return Db.models.User.query().insert(user)
    }

    for (const { backups, badges, ...user } of bodyArray) {
      const userEntry = await getUser(user)

      log.info(
        HELPERS.api,
        'Inserted User',
        userEntry.id,
        userEntry.username || userEntry.discordId || userEntry.telegramId,
      )

      if (badges) {
        for (const badge of badges) {
          await Db.models.Badge.query().insert({
            ...badge,
            userId: userEntry.id,
          })
        }
      }
      if (backups) {
        for (const backup of backups) {
          await Db.models.Backup.query().insert({
            ...backup,
            userId: userEntry.id,
          })
        }
      }
    }
    res.status(200).json({ status: 'success' })
    log.info(HELPERS.api, 'api/v1/users/import')
  } catch (e) {
    log.error(HELPERS.api, 'api/v1/users/import', e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const user = await Db.models.User.query().findById(req.params.id)
    res.status(200).json(user || { status: 'error', reason: 'User Not Found' })
    log.info(HELPERS.api, `api/v1/users/${req.params.id}`)
  } catch (e) {
    log.error(HELPERS.api, `api/v1/users/${req.params.id}`, e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

router.get('/discord/:id', async (req, res) => {
  try {
    const user = await Db.models.User.query()
      .where('discordId', req.params.id)
      .first()
    res.status(200).json(user || { status: 'error', reason: 'User Not Found' })
    log.info(HELPERS.api, `api/v1/users/discord/${req.params.id}`)
  } catch (e) {
    log.error(HELPERS.api, `api/v1/users/discord/${req.params.id}`, e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

router.get('/telegram/:id', async (req, res) => {
  try {
    const user = await Db.models.User.query()
      .where('telegramId', req.params.id)
      .first()
    res.status(200).json(user || { status: 'error', reason: 'User Not Found' })
    log.info(HELPERS.api, `api/v1/users/telegram/${req.params.id}`)
  } catch (e) {
    log.error(HELPERS.api, `api/v1/users/telegram/${req.params.id}`, e)
    res.status(500).json({ status: 'error', reason: e.message })
  }
})

module.exports = router
