import LocalStorageService from "../services/LocalStorageService.js";
import ParsedGame from "../ScheduledGame.js";
import BGAuthService from "./auth.js";


export default class BGCalendarService {

    constructor() {
        /**
         * ID of desired calendar
         */
        this.calID = "";
        this.isInit = false;
        this.APIURL_get_calendars = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
        this._APIURL_get_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=2000&timeMin={timeMin}&timeMax={timeMax}';
        this._APIURL_add_event = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events';
        this._APIURL_update_del_event = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}';
    }



    /** @type {BGCalendarService} */
    instance = null;
    static async GetInstance() {
        if (this.instance == null) {
            this.instance = new BGCalendarService();
            await this.instance.init();
        }
        return this.instance;
    }


    async init() {
        this.calID = (await LocalStorageService.GetValue('SelectedCalendar'))?.id;
        LocalStorageService.addListener('SelectedCalendar', async (newValue) => {
            this.calID = newValue?.id;
        });


        this.isInit = true;
    };

    /**
     * @param {string} url
     */
    insertCalId(url) {
        return url.replace('{calendarId}', encodeURIComponent(this.calID))
    }

    get APIURL_add_events() {
        return this.insertCalId(this._APIURL_add_event);
    }

    get APIURL_update_del_event() { 
        return this.insertCalId(this._APIURL_update_del_event);
    }

    get APIURL_get_events() {
        return this.insertCalId(this._APIURL_get_events);
    }

    /**
     * returns promise, parameter on success is list of calendar events
     * @returns {Promise<Calendar[]>}
     */
    async getCalendars() {
        let data = await this.Get(this.APIURL_get_calendars);
        return data.items;
    }

    /**
     * returns promise, parameter on success is list of calendar events
     * @returns {Promise<CalendarEvent[]>}
     */
    async getEvents(minDate, maxDate) {
        console.log('getEvents');
        if (!this.isInit) {
            console.warn('GetEvents called before init');
            return null;
        }

        if (!this.calID) {
            throw "Calendar ID not selected"
        }

        let url = this.getAPIURL_get_events(minDate, maxDate);

        let data = await this.Get(url);
        // console.table(data.items)
        if (data.items) {
            return data.items;
        } else {
            throw data.error;
        }


    }

    /**
     * @param {RequestInfo} url
     */
    async Get(url) {
        let token = await BGAuthService.GetAuthToken();
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
            .replace('{timeMin}', timeMin.toISOString())
            .replace('{timeMax}', timeMax.toISOString());
    }

    async put_post(method, url, data) {
        try {
            let token = await BGAuthService.GetAuthToken();
            const response = await fetch(url, {
                method,
                cache: 'no-cache',
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data) // body data type must match "Content-Type" header
            });
            let resp = await response.json();
            return { ok: response.ok, data: resp };

        } catch (error) {
            console.error(error);
            return { ok: false, data: error };
        }
    }
    
    async Post(url, data) {
        return this.put_post('POST', url, data);
    }

    async Put(url, data) {
        return this.put_post('PUT', url, data);
    }

    /**
     * @param {RequestInfo} url
     */
    async Delete(url) {
        try {
            let token = await BGAuthService.GetAuthToken();
            const response = await fetch(url, {
                method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
                // mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            return { ok: response.ok };

        } catch (error) {
            console.error(error);
            return { ok: false, data: error };
        }
    }

    /**
     * @param {ParsedGame} serializedGameObj
     */
    async addGame(serializedGameObj) {
        console.log("adding game", serializedGameObj);
        if (!this.isInit) {
            return null;
        }

        if (!serializedGameObj.startDate) {
            throw 'unable to add game: no start date specified'
        }

        // gameObj is serialized before being passed to this function.
        let gameObj = ParsedGame.Deserialize(serializedGameObj);
        let data = this.getRequestBody(gameObj);

        try {
            const response = await this.Post(this.APIURL_add_events, data);
            console.log({ response });
            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    /**
     * @param {ParsedGame} serializedGameObj
     */
    async updateGame(serializedGameObj) {
        console.log("updating game", serializedGameObj);
        if (!this.isInit) {
            return null;
        }

        if (!serializedGameObj.startDate) {
            throw 'unable to update game: no start date specified';
        }

        // gameObj is serialized before being passed to this function.
        const gameObj = ParsedGame.Deserialize(serializedGameObj);
        const data = this.getRequestBody(gameObj);

        const url = this.APIURL_update_del_event.replace('{eventId}', encodeURIComponent(gameObj.CalendarEvent.id));
        try {
            const response = await this.Put(url, data);
            console.log({ response });
            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    /**
     * @param {ParsedGame} gameObj
     */
    getRequestBody(gameObj) {
        return {
            "start": {
                "dateTime": gameObj.startDate
            },
            "end": {
                "dateTime": gameObj.endDate
            },
            "summary": `${gameObj.level} - ${gameObj.location}`,
            "location": `${gameObj.address}`,
            "description": gameObj.getEventDescription(),
            "extendedProperties": {
                "private": {
                    "assignment_id": gameObj.gameID,
                    "extension_id": "pgdajjngmjfhnoghgoddckkikijklaib"
                }
            }
        };
    }

    /**
     * @param {ParsedGame} serializedGameObj
     */
    async remGame(serializedGameObj) {
        let gameObj = ParsedGame.Deserialize(serializedGameObj);
        if (!gameObj.canDelete) {
            throw 'unable to remove game: will not remove events unless they are created by this extension.';
        }

        let eventID = gameObj.CalendarEvent.id;
        console.log("removing game", eventID);
        if (!this.isInit) {
            return null;
        }
        const url = this.APIURL_update_del_event.replace('{eventId}', encodeURIComponent(eventID));
        try {
            const response = await this.Delete(url);
            console.log({ response });
            return response.ok;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

}