/**
 * @callback myCallback
 * @param {{body: any, err: any}} resp
 */




function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY));
}

let background = {

  listenForRequests_: function () {

    let listen = async (request, /** @type {myCallback} */ opt_callback) => {
      let method = request.method;
      let params = request.params;
      let cal = await CalendarService.GetInstance();
      switch (method) {
        case 'auth.interactive':
          AuthService.GetAuthToken(true).then((result) => {
            opt_callback({ body: result });
          }, (err) => {
            console.log(err);
            opt_callback({ err: err.message });
          });
          break;

        case 'auth.silent':
          AuthService.GetAuthToken(false).then(
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
        case 'console.log':
          throw 'Not Implemented'
          console.log('logging', params.data);
          logData = params.data;
          opt_callback({ body: undefined });
          break;
        case 'console.listen':
          throw 'Not Implemented'
          while (!logData) {
            console.log('waiting...', logData);
            await sleep(150);
          }
          console.log('sending', logData);
          opt_callback({ body: logData });
          logData = undefined;
          break;
      }
    };
    chrome.extension.onMessage.addListener((request, sender, opt_callback) => {

      _ = listen(request, opt_callback);

      // Indicates to Chrome that a pending async request will eventually issue
      // the callback passed to this function.
      return true;
    });
  }

};






background.listenForRequests_();