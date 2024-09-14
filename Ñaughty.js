const fs = require("fs");
const login = require("fca-unofficial");
let listener;
function startListening(api) {
    // Start listening and store the listener reference
    listener = api.listenMqtt((err, event) => {
        if (err) return console.error(err);
         api.markAsRead(event.threadID, (err) => {
            if (err) console.error(err);
        });

        switch (event.type) {
            case "message":
                if (event.body === '+stop') {
                    api.sendMessage("Goodbye…", event.threadID);
                    if (listener && typeof listener.stopListening === 'function') {
                        listener.stopListening();
                    }
                } else if (event.body === '+start') {
                    // Optionally inform user that listening is already started
                    api.sendMessage("Already listening…", event.threadID);
                    } else if (event.body === '+uid') {
                        let uid = event.senderID
                        api.sendMessage(uid, event.threadID, event.messageID);
                    } else {
                    api.sendMessage("TEST BOT: " + event.body, event.threadID);
                }
                break;
            case "event":
                console.log(event);
                break;
        }
    });
}

// Log in and start the bot
login({ appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, (err, api) => {
    if (err) return console.error(err);

    api.setOptions({ listenEvents: true });

    // Start listening when the bot starts
    startListening(api);

    // Handle cases where `/start` is sent to restart listening
    api.listenMqtt((err, event) => {
        if (err) return console.error(err);

        if (event.type === "message" && event.body === '+start') {
            if (listener && typeof listener.stopListening === 'function') {
                listener.stopListening();
            }
            // Wait a short time to ensure listener is stopped
            setTimeout(() => {
                startListening(api);
                api.sendMessage("Listening again…", event.threadID);
            }, 1000); // Adjust time as needed
        }
    });
});
