'use strict';


class Calendar {
    
    /** @type {string} */
    kind;

    /** @type {string} */
    etag;

    /** @type {string} */
    id;

    /** @type {string} */
    summary;

    /** @type {string} */
    timeZone;

    /** @type {string} */
    colorId;

    /** @type {string} */
    backgroundColor;

    /** @type {string} */
    foregroundColor;

    /** @type {string} */
    accessRole;

    /** @type {string} */
    defaultReminders;    
}

class CalendarService {

    constructor() {
        /**
         * ID of desired calendar
         */
        this.calID = "1hjk892r88cncfm8ctgp07r00g@group.calendar.google.com";
        this.isInit = false;
        this.authToken = '';
        this.APIURL_get_calendars = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
        this.APIURL_get_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=2000&timeMin={timeMin}&timeMax={timeMax}';
        this.APIURL_add_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events';
        this.APIURL_del_event = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}';
    }

    static async GetInstance() {
        let instance = new CalendarService();
        await instance.init();
        return instance;
    }


    /**
     * Inits calendar API with up to date auth token
     */
    async init() {
        try {
            let token = await AuthService.GetAuthToken();
            this.isInit = true;
            this.authToken = token;
            this.APIURL_add_events = this.APIURL_add_events.replace('{calendarId}', encodeURIComponent(this.calID));
            this.APIURL_del_event = this.APIURL_del_event.replace('{calendarId}', encodeURIComponent(this.calID));

        } catch (err) {
            console.log(`could not obtain token: ${err}`);
            this.authToken = null;
            this.isInit = true;
        }
    };

    /**
     * returns promise, parameter on success is list of calendar events
     * @returns {Promise<Calendar[]>}
     */
    async getCalendars() {
        let data = await this.Get(this.APIURL_get_calendars)
        return data.items;
    }

    /**
     * returns promise, parameter on success is list of calendar events
     * @returns {Promise<any[]>}
     */
    async getEvents(minDate, maxDate) {
        let isInit = this.isInit;
        console.log({isInit});
        if (!this.isInit) {
            return null;
        }
        let url = this.getAPIURL_get_events(minDate, maxDate);

        try {
            let data = await this.Get(url);
            // console.table(data.items)
            return data.items;
        } catch (error) {
            console.error(error);
            return [];
        }

    }

    async Get(url) {
        let token = await AuthService.GetAuthToken();
        let resp = await fetch(url, {
            method: 'get',
            headers: { 'Authorization': 'Bearer ' + token },
        });
        let data = await resp.json();
        return data;
    }

    getAPIURL_get_events(minDate, maxDate) {
        let timeMin = new Date(minDate);
        timeMin.setDate(timeMin.getDate() - 7);
        let timeMax = new Date(maxDate);
        timeMax.setDate(timeMax.getDate() + 7);

        return this.APIURL_get_events
            .replace('{calendarId}', encodeURIComponent(this.calID))
            .replace('{timeMin}', timeMin.toISOString())
            .replace('{timeMax}', timeMax.toISOString());
    }

    async Post(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                // mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Authorization': 'Bearer ' + this.authToken,
                    'Content-Type': 'application/json'
                },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify(data) // body data type must match "Content-Type" header
            });
            let resp = await response.json();
            return {ok: response.ok, data: resp}

        } catch (error) {
            console.log(error);
            return { ok: false, data: error }
        }
    }

    /**
     * @param {ScheduledGame} gameObj
     */
    async addGame(gameObj) {
        console.log("adding game", gameObj);
        if (!this.isInit) {
            return null;
        }

        let startDate = gameObj.date;
        let endDate = moment(startDate).add(gameObj.time_hrs * 60 + gameObj.time_mins, 'minutes').format();
        let data = {
            "start": {
                "dateTime": startDate
            },
            "end": {
                "dateTime": endDate
            },
            "summary": `${gameObj.level} - ${gameObj.location}`,
            "location": `${gameObj.address}`,
            "description": gameObj.eventDescription
        };

        try {
            const response = await this.Post(this.APIURL_add_events, data)
            console.log(response);
            return response.ok;
        } catch (error) {
            console.log(error);
            return error;
        }
        
        
    };

    remGame(eventID) {
        console.log("removing game", eventID);
        if (!this.isInit) {
            return null;
        }
        const url = this.APIURL_del_event.replace('{eventId}', encodeURIComponent(eventID))
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: "DELETE",
                headers: { 'Authorization': 'Bearer ' + this.authToken },
                success: (data) => {
                    console.log(data);
                    resolve(true);

                }, error: (response) => {
                    console.error(response);
                    reject(response);
                }
            });
        });

    };

}