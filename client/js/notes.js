// https://gist.github.com/adactio/be3fb1e7c15a47a90f87c7df11158e2e
window.onload=function(){
    (function (win, doc) {
        if (!win.localStorage) return;
        var textarea = doc.getElementById('memopad');
        var item = null;

        var unloadEvent;
        if ('onpagehide' in win) {
            unloadEvent = 'pagehide'; // for modern browsers
        } else {
            unloadEvent = 'beforeunload'; // for older browsers
        }

        // update textarea with saved value, if exists
        item = win.localStorage.getItem("notes");
        if (item) {
            var data = JSON.parse(item);
            textarea.value = data.content;
        }

        // stores current value of the textarea, or deletes it if blank
        function updateStorage() {
            if (textarea.value) {
                item = JSON.stringify({'content': textarea.value});
                win.localStorage.setItem("notes", item);
            } else {
                win.localStorage.removeItem("notes");
            }
            //  event listener is no longer needed now, so remove it
             win.removeEventListener(unloadEvent, updateStorage);
        }

        // once key is pressed just once once inside the textarea,
        // run the storage function when the page is unloaded
        textarea.addEventListener('keyup', function() {
            win.addEventListener(unloadEvent, updateStorage);
            win.setInterval(updateStorage, 60000);
        }, {'once': true});

    }(this, this.document));
}