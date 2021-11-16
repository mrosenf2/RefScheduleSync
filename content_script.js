(async () => {
    console.log('content_script');
    const src = chrome.runtime.getURL('main.js');
    const contentScript = await import(src);
    console.log({contentScript});
    contentScript.default.init();
})();