/**
 * Namespace for calendar operations
 * @namespace
 */
var cal = {}
/**
 * ID of desired calendar
 */
cal.calID = "1hjk892r88cncfm8ctgp07r00g@group.calendar.google.com"
cal.isInit = false
cal.authToken = ''
cal.APIURL_get_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=2000&timeMin={startTime}'
cal.APIURL_add_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events'
cal.APIURL_del_event = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}'

/**
 * Inits calendar API with up to date auth token
 */
cal.init = function() {
    console.log("calendar.init")
    auth.getAuthToken().then(
        function(token) { //successfully obtained token
            cal.isInit = true
            cal.authToken = token
            let minDate = new Date()
            minDate.setFullYear(new Date().getFullYear() - 1)
            cal.APIURL_get_events = cal.APIURL_get_events.replace('{calendarId}', encodeURIComponent(cal.calID))
            cal.APIURL_get_events = cal.APIURL_get_events.replace('{startTime}', minDate.toISOString())
            cal.APIURL_add_events = cal.APIURL_add_events.replace('{calendarId}', encodeURIComponent(cal.calID))
            cal.APIURL_del_event = cal.APIURL_del_event.replace('{calendarId}', encodeURIComponent(cal.calID))

        }, function(err) { //could not obtain token
            console.log("could not obtain token")
            cal.authToken = null
        }
    )
}

/**
 * returns promise, parameter on success is list of calendar events
 */
cal.getEvents = async function() {
    console.log("cal.getEvents()")    
    if (!cal.isInit) {
        return null
    }    
    let token = await auth.getAuthToken()    
    return new Promise(function(resolve, reject) {
        $.ajax(cal.APIURL_get_events,{
            headers: {'Authorization': 'Bearer ' + token},
            success: function(data){
                console.log(data)
                if(data.nextPageToken) {
                    console.warn("not all events retrieved")
                }
                resolve(data.items);
    
            }, error: function(response) {
                console.log(response)
                reject(response)
            }
        })
    })
    
}
/**
 * @param {arbiterContent.getGameObj} gameObj
 * @param {String} gameObj.date - start date in ISO 8601 format
 * @param {String} gameObj.level
 * @param {String} gameObj.location
 * @param {String} gameObj.home
 * @param {String} gameObj.away
 * @param {String} gameObj.pay
 * @param {String} gameObj.officials
 */
cal.addGame = function(gameObj) {
    console.log("calendar.addGame()")
    if (!cal.isInit) {
        return null
    }
    return new Promise(function(resolve, reject) {
        var startDate = gameObj.date
        var endDate = moment(startDate).add(80, 'minutes').format()
        var desc = JSON.stringify({GameID: gameObj.gameID ,Location: gameObj.location, Home: gameObj.home, Away: gameObj.away, Officials: gameObj.officials, Pay: gameObj.pay}, null, 2).replace(/[^a-zA-Z0-9\$\. \n:&]/g, "").slice(0, -2)
        var data = {
            "start": {
                "dateTime": startDate
            },
            "end": {
                "dateTime": endDate
            },
            "summary": gameObj.level,
            "location": gameObj.address,
            "description": desc
        }
        $.ajax({
            url: cal.APIURL_add_events,
            type: "POST",
            headers: {'Authorization': 'Bearer ' + cal.authToken, 'Content-type': 'application/json'},
            data: JSON.stringify(data),
            success: function(data){
                console.log(data)
                resolve(true);
    
            }, error: function(response) {
                console.log(response)
                reject(response)
            }
        })
    })
}

cal.remGame = function(eventID) {
    console.log("calendar.remGame")
    if (!cal.isInit) {
        return null
    }
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: cal.APIURL_del_event.replace('{eventId}', encodeURIComponent(eventID)),
            type: "DELETE",
            headers: {'Authorization': 'Bearer ' + cal.authToken},        
            success: function(data){
                console.log(data)
                resolve(true);
    
            }, error: function(response) {
                console.log(response)
                reject(response)
            }
        })
    })
    
}

cal.init()