/**
 * @callback myCallback
 * @param {{body?: any, err?: any}} resp
 */




// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY));
// }

let background = {

  listenForRequests_: function () {

    let listen = async (request, /** @type {myCallback} */ opt_callback) => {
      let method = request.method;
      let params = request.params;
      let cal = await BGCalendarService.GetInstance();
      switch (method) {
        case 'auth.interactive':
          BGAuthService.GetAuthToken(true).then((result) => {
            opt_callback({ body: result });
          }, (err) => {
            console.log(err);
            opt_callback({ err: err.message });
          });
          break;

        case 'auth.silent':
          BGAuthService.GetAuthToken(false).then(
            function (result) {
              opt_callback({ body: result });
            }, function (err) {
              opt_callback({ err: err.message });
            }
          );
          break;

        case 'calendar.getCalendars':
          cal.getCalendars().then(function (result) {
            opt_callback({ body: result });
          }, function (err) {
            console.log(err);
            opt_callback({ err: err.message });
          });
          break;
        case 'calendar.getEvents':
          cal.getEvents(params.minDate, params.maxDate).then(function (result) {
            opt_callback({ body: result });
          }, function (err) {
            console.log(err);
            opt_callback({ err: err.message });
          });
          break;
        case 'calendar.addGame':
          cal.addGame(params.game).then(
            function (result) {
              opt_callback({ body: result });
            }, function (err) {
              console.log(err);
              opt_callback({ err: err.message });
            }
          );
          break;
        case 'calendar.removeGame':
          cal.remGame(params.game.calId).then(
            function (result) {
              opt_callback({ body: result });
            }, function (err) {
              console.log(err);
              opt_callback({ err: err.message });
            }
          );
          break;
        
      }
    };
    // @ts-ignore
    chrome.extension.onMessage.addListener((request, sender, opt_callback) => {

      listen(request, opt_callback);

      // Indicates to Chrome that a pending async request will eventually issue
      // the callback passed to this function.
      return true;
    });
  }

};






background.listenForRequests_();