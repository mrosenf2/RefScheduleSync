class BGAuthService {

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
    static async GetAuthToken(isInteractive = false) {
        console.trace(`getting AuthToken (interactive:${isInteractive})`);
        return await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 'interactive': isInteractive, }, (authToken, scopes) => {
                if (authToken) {
                    if (isInteractive) {
                        LocalStorageService.SetValue('IsAuthenticated', true);
                    }
                    resolve(authToken);
                } else {
                    console.log(`Warning: Error authorizing for Chrome browser, attemping auth for Edge browser: ${chrome.runtime.lastError.message}`);
                    BGAuthService.Authorize_MSEdge(isInteractive).then((token) => {
                        resolve(token);
                    }).catch(() => {
                        reject('Authorization: ' + chrome.runtime.lastError?.message);
                    });
                };
            });
        });
    }

    /**
     * Edge browsers do not support chrome.identity.getAuthToken, so we need to do it differently 
     * @param {Boolean} isInteractive whether or not authentication UI is displayed to the user
     * @returns {Promise<string>} authentication token
     */
    static Authorize_MSEdge(isInteractive = true) {
        // @ts-ignore
        const redirectURL = chrome.identity.getRedirectURL();
        const clientID = "439216554338-e0hklsngi29ojhg0nc6snfur1nups7ld.apps.googleusercontent.com";
        const scopes = ["https://www.googleapis.com/auth/calendar"];
        let authURL = "https://accounts.google.com/o/oauth2/auth";
        authURL += `?client_id=${clientID}`;
        authURL += `&response_type=token`;
        authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
        authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
        console.log(authURL);
        return new Promise((resolve, reject) => {
            // @ts-ignore
            chrome.identity.launchWebAuthFlow({
                interactive: isInteractive,
                url: authURL
            }, (resp) => {
                if (resp) {
                    resolve((new URLSearchParams(resp.split("#")[1])).get("access_token"));
                } else (
                    // @ts-ignore
                    reject(new Error('getAuthToken: ' + chrome.runtime.lastError.message))
                );
            });


        });

    }
}



