import { getAllDevices } from './data/device.js'
import { getAllGyms, getAllRaids } from './data/gym.js'
import { getAllPokestops } from './data/pokestop.js'
import { getAllPokemon } from './data/pokemon.js'
import { getAllSpawnpoints } from './data/spawnpoint.js'
import { getAllPortals } from './data/portal.js' 
import { getAllWeather } from './data/weather.js'
import { getAllS2Cells } from './data/s2Cell.js'
import { getAllSubmissionCells } from './data/submissionCells.js'

class Query {

  static getAllDevices() {
    return getAllDevices
  }

  static getAllGyms() {
    return getAllGyms
  }

  static getAllPokestops() {
    return getAllPokestops
  }

  static getAllPokemon() {
    return getAllPokemon
  }

  static getAllPortals() {
    return getAllPortals
  }

  static getAllRaids() {
    return getAllRaids
  }

  static getAllS2Cells() {
    return getAllS2Cells
  }

  static getAllSpawnpoints() {
    return getAllSpawnpoints
  }

  static getAllSubmissionCells() {
    return getAllSubmissionCells
  }

  static getAllWeather() {
    return getAllWeather
  }

}

export default Query