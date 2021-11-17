import LocalStorageService from "../services/LocalStorageService.js";

export default class BGAuthService {

    /** @type {string} */
    static AuthToken;

    static async ClearAllCachedAuthTokens() {
        return await new Promise((resolve, reject) => {
            chrome.identity.clearAllCachedAuthTokens(() => {
                console.log('clearAllCachedAuthTokens');
                resolve(true);
            });

        });
    }

    /**
     * determines if user is signed in or not based on if auth token is produced
     * @param {Boolean} isInteractive whether or not authentication UI is displayed to the user
     * @returns {Promise<string>} authentication token
     */
    static GetAuthToken(isInteractive = false) {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 'interactive': isInteractive, }, (authToken) => {
                if (authToken) {
                    isInteractive && LocalStorageService.SetValue('IsSignedIn', true);
                    resolve(authToken);
                } else {
                    console.warn(`Warning: Error authorizing for Chrome browser, attemping auth for Edge browser: ${chrome.runtime.lastError.message}`);
                    resolve(BGAuthService.AuthorizeUsingRedirect(isInteractive));
                };
            });
        })
    }

    /**
     * Edge browsers do not support chrome.identity.getAuthToken, so we need to do it differently 
     * @param {Boolean} isInteractive whether or not authentication UI is displayed to the user
     * @returns {Promise<string>} authentication token
     */
    static AuthorizeUsingRedirect(isInteractive = true) {
        const redirectURL = chrome.identity.getRedirectURL();
        const clientID = "439216554338-e0hklsngi29ojhg0nc6snfur1nups7ld.apps.googleusercontent.com";
        const scopes = ["https://www.googleapis.com/auth/calendar"];
        let authURL = "https://accounts.google.com/o/oauth2/auth";
        authURL += `?client_id=${clientID}`;
        authURL += `&response_type=token`;
        authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
        authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
        // authURL += `&prompt=select_account`;

        /** @type {chrome.identity.WebAuthFlowOptions} */
        const options = {
            interactive: isInteractive,
            url: authURL
        };

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(options, (resp) => {
                if (resp) {
                    isInteractive && LocalStorageService.SetValue('IsSignedIn', true);
                    const token = (new URLSearchParams(resp.split("#")[1])).get("access_token");
                    resolve(token);
                } else (
                    reject('getAuthToken: ' + chrome.runtime.lastError.message)
                );
            });


        });

    }
}



