'use strict';
class CalendarService {

    constructor() {
        /**
         * ID of desired calendar
         */
        this.calID = "1hjk892r88cncfm8ctgp07r00g@group.calendar.google.com";
        this.isInit = false;
        this.authToken = '';
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
            let token = await AuthService.GetAuthToken();
            let resp = await fetch(url, {
                method: 'get',
                headers: { 'Authorization': 'Bearer ' + token },
            });
            let data = await resp.json();
            console.table(data.items)
            return data.items;
        } catch (error) {
            console.error(error);
            return [];
        }

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

    /**
     * @param {ScheduledGame} gameObj
     */
    addGame(gameObj) {
        console.log("adding game", gameObj);
        if (!this.isInit) {
            return null;
        }
        return new Promise((resolve, reject) => {
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
            $.ajax({
                url: this.APIURL_add_events,
                type: "POST",
                headers: { 'Authorization': 'Bearer ' + this.authToken, 'Content-type': 'application/json' },
                data: JSON.stringify(data),
                success: function (data) {
                    console.log(data);
                    resolve(true);

                }, error: function (response) {
                    console.error(response);
                    reject(response);
                }
            });
        });
    };

    remGame(eventID) {
        console.log("removing game", eventID);
        if (!this.isInit) {
            return null;
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.APIURL_del_event.replace('{eventId}', encodeURIComponent(eventID)),
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