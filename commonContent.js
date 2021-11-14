class Common {
    /**
     * @param {(addOnClick: boolean, promptAddGames: boolean) => void} syncCallback
     */
    static async SignInSyncHandler(syncCallback) {
        try {
            const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
            if (isSignedIn) {
                syncCallback(false, true);
            } else {
                AuthService.AuthInteractive().then(() => {
                    syncCallback(false, false);
                }).catch((err) => {
                    console.warn('Auth failed:', err);
                })
            }
        } catch (err) {
            console.error(err);
        }
    }

    static CreateElementSignInSync(isSignedIn) {
        let txtIsSignedIn = document.createElement("p");
        if (isSignedIn) {
            txtIsSignedIn.innerHTML = "Sync";
            txtIsSignedIn.title = "Click to refresh checkboxes";
        } else {
            txtIsSignedIn.innerHTML = "Sign in to Sync";
            txtIsSignedIn.title = "Sign In";
        }
        return txtIsSignedIn;
    }
}