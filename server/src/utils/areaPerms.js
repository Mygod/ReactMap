// @ts-check
const config = require('@rm/config')
const { default: pointInPolygon } = require('@turf/boolean-point-in-polygon')
const { point } = require('@turf/helpers')

/**
 * @param {string[]} roles
 * @returns {string[]}
 */
function areaPerms(roles) {
  const areaRestrictions = config.getSafe('authentication.areaRestrictions')
  const areas = config.getSafe('areas')

  const perms = []
  for (let i = 0; i < roles.length; i += 1) {
    for (let j = 0; j < areaRestrictions.length; j += 1) {
      if (areaRestrictions[j].roles.includes(roles[i])) {
        const restriction = areaRestrictions[j]

        // Handle traditional area restrictions
        if (restriction.areas && restriction.areas.length) {
          for (let k = 0; k < restriction.areas.length; k += 1) {
            if (areas.names.has(restriction.areas[k])) {
              perms.push(restriction.areas[k])
            } else if (areas.withoutParents[restriction.areas[k]]) {
              perms.push(...areas.withoutParents[restriction.areas[k]])
            }
          }
        }

        // Handle parent-based restrictions
        if (restriction.parent && restriction.parent.length) {
          for (let p = 0; p < restriction.parent.length; p += 1) {
            const parentName = restriction.parent[p]

            // Find all areas that fall within this parent
            if (areas.polygons[parentName]) {
              const parentPolygon = areas.polygons[parentName]

              // Check each area to see if it's within the parent
              areas.names.forEach((areaKey) => {
                if (areaKey !== parentName && areas.polygons[areaKey]) {
                  const areaPolygon = areas.polygons[areaKey]

                  // Get a point from the area to test if it's within the parent
                  let testPoint
                  if (areaPolygon.type === 'Polygon') {
                    // Get the first coordinate of the polygon
                    testPoint = point(areaPolygon.coordinates[0][0])
                  } else if (areaPolygon.type === 'MultiPolygon') {
                    // Get the first coordinate of the first polygon
                    testPoint = point(areaPolygon.coordinates[0][0][0])
                  }

                  if (testPoint && pointInPolygon(testPoint, parentPolygon)) {
                    perms.push(areaKey)
                  }
                }
              })

              // Also include the parent itself
              perms.push(parentName)
            } else if (areas.withoutParents[parentName]) {
              // Fallback to the existing parent handling
              perms.push(...areas.withoutParents[parentName])
            }
          }
        }

        // If neither areas nor parent are specified, allow all areas
        if (
          (!restriction.areas || !restriction.areas.length) &&
          (!restriction.parent || !restriction.parent.length)
        ) {
          return []
        }
      }
    }
  }
  return [...new Set(perms)]
}

module.exports = { areaPerms }
