Hooks.once('init', async function () {
    CONFIG.ChatMessage.template = "modules/df-chat-cards/templates/base-chat-message.html";
});

Hooks.once("setup", function () {
    Handlebars.registerHelper("userColor", function (userId, isBackground) {
        const userColor = game.users.get(userId)?.data?.color;
        if (!userColor) {
            return null;
        }
        
        if (isBackground) {
            return userColor;
        }

        const hexColor = userColor.replace("#", "");
        var r = parseInt(hexColor.substr(0,2),16);
        var g = parseInt(hexColor.substr(2,2),16);
        var b = parseInt(hexColor.substr(4,2),16);
        var yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#333' : '#E7E7E7';
    });

    Handlebars.registerHelper("speakerImage", function (speaker) {
        if (!speaker) {
            return "icons/svg/mystery-man.svg";
        }

        if (speaker.token) {
            const token = canvas?.tokens?.get(speaker.token);
            if (token) {
                return token.data.img;
            }
        }

        if (speaker.actor) {
            const actor = Actors.instance.get(speaker.actor);
            if (actor) {
                return actor.data.img;
            }
        }

        return "icons/svg/mystery-man.svg";
    });
});
