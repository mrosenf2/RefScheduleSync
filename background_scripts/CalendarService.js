'use strict';

import LocalStorageService from "../services/LocalStorageService.js";
import ScheduledGame from "../ScheduledGame.js";
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
        this._APIURL_add_events = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events';
        this._APIURL_del_event = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}';
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
            this.calID = newValue.id;
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
        return this.insertCalId(this._APIURL_add_events);
    }

    get APIURL_del_event() { 
        return this.insertCalId(this._APIURL_del_event);
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

    async Post(url, data) {
        try {
            let token = await BGAuthService.GetAuthToken();
            const response = await fetch(url, {
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                // mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify(data) // body data type must match "Content-Type" header
            });
            let resp = await response.json();
            return { ok: response.ok, data: resp };

        } catch (error) {
            console.error(error);
            return { ok: false, data: error };
        }
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
     * @param {ScheduledGame} gameObj
     */
    async addGame(gameObj) {
        console.log("adding game", gameObj);
        if (!this.isInit) {
            return null;
        }

        let startDate = new Date(gameObj.startDate);
        let endDate = new Date(gameObj.endDate);
        if (!endDate.getTime()) {
            // add 1hr 20mins to start by default
            endDate = new Date(startDate.getTime() + 1 * 60 * 60 * 1000 + 20 * 60 * 1000);
        }
        let data = {
            "start": {
                "dateTime": startDate
            },
            "end": {
                "dateTime": endDate
            },
            "summary": `${gameObj.level} - ${gameObj.location}`,
            "location": `${gameObj.address}`,
            "description": gameObj.eventDescription,
            "extendedProperties": {
                "private": {
                    "created_by": "extension"
                }
            }
        };

        try {
            const response = await this.Post(this.APIURL_add_events, data);
            console.log({ response });
            return response;
        } catch (error) {
            console.error(error);
            return error;
        }


    };

    /**
     * @param {string | number | boolean} eventID
     */
    async remGame(eventID) {
        console.log("removing game", eventID);
        if (!this.isInit) {
            return null;
        }
        const url = this.APIURL_del_event.replace('{eventId}', encodeURIComponent(eventID));
        try {
            const response = await this.Delete(url);
            console.log({ response });
            return response.ok;
        } catch (error) {
            console.error(error);
            return error;
        }
    };

}