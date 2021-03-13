class AuthService {

    /** @type {string} */
    static AuthToken;

    /**
     * determines if user is signed in or not based on if auth token is produced
     * @param {bool} isInteractive whether or not authentication UI is displayed to the user
     * @returns {Promise<string>} authentication token
     */
    static GetAuthToken(isInteractive = false) {
        return new Promise((resolve, reject) => {
            console.trace();
            if (AuthService.AuthToken) {
                resolve(AuthService.AuthToken);
            } else {
                chrome.identity.getAuthToken({ 'interactive': isInteractive }, function (authToken) {
                    console.log(authToken);
                    if (authToken) {
                        resolve(authToken);
                    } else {
                        console.log(`Warning: Error authorizing for Chrome browser, attemping auth for Edge browser: ${chrome.runtime.lastError.message}`);
                        AuthService.Authorize_MSEdge(isInteractive).then((token) => {
                            resolve(token);
                        }).catch(() => {
                            reject(new Error('Authorization: ' + chrome.runtime.lastError?.message));
                        });
                    };
                });
            }

        });
    }

    /**
     * Edge browsers do not support chrome.identity.getAuthToken, so we need to do it differently 
     * @param {bool} isInteractive whether or not authentication UI is displayed to the user
     * @returns {Promise<string>} authentication token
     */
    static Authorize_MSEdge(isInteractive = true) {
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
            chrome.identity.launchWebAuthFlow({
                interactive: isInteractive,
                url: authURL
            }, (resp) => {
                if (resp) {
                    resolve((new URLSearchParams(resp.split("#")[1])).get("access_token"));
                } else (
                    reject(new Error('getAuthToken: ' + chrome.runtime.lastError.message))
                );
            });


        });

    }
}



