class CalendarService {

    constructor() {
        /**
         * ID of desired calendar
         */
        this.calID = "1hjk892r88cncfm8ctgp07r00g@group.calendar.google.com";
        this.isInit = false;
        this.authToken = '';
        this.APIURL_get_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=2000&timeMin={startTime}';
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
        console.trace();
        try {
            let token = await AuthService.GetAuthToken();
            this.isInit = true;
            this.authToken = token;
            let minDate = new Date();
            minDate.setFullYear(new Date().getFullYear() - 1);
            this.APIURL_get_events = this.APIURL_get_events.replace('{calendarId}', encodeURIComponent(this.calID));
            this.APIURL_get_events = this.APIURL_get_events.replace('{startTime}', minDate.toISOString());
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
    async getEvents() {
        console.trace(this.isInit);
        if (!this.isInit) {
            return null;
        }
        let token = await AuthService.GetAuthToken();
        return new Promise((resolve, reject) => {
            $.ajax(this.APIURL_get_events, {
                headers: { 'Authorization': 'Bearer ' + token },
                success: (data) => {
                    console.log(data);
                    if (data.nextPageToken) {
                        console.warn("not all events retrieved");
                    }
                    resolve(data.items);

                }, error: (response) => {
                    console.log(response);
                    reject(response);
                }
            });
        });

    }

    /**
     * @param {HWRGame} gameObj
     */
    addGame(gameObj) {
        console.trace(gameObj);
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
        console.trace();
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