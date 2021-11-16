/**
 * @callback myCallback
 * @param {{ok: boolean, data?: any, err?: any}} resp
 */

/**
 * @typedef {{ method: serviceName; params: any; }} RequestMessage
 */

/**
 * @typedef { ""
 * | "auth.interactive"
 * | "auth.silent"
 * | "auth.clearAllCachedAuthTokens"
 * | "auth.switchAccount"
 * | "calendar.getCalendars"
 * | "calendar.getEvents"
 * | "calendar.addGame"
 * | "calendar.removeGame"
 * } serviceName
 */