Hooks.once('init', async function () {
    CONFIG.ChatMessage.template = "modules/df-chat-cards/templates/base-chat-message.html";

    game.settings.register("df-chat-cards", "displaySetting", {
        name: "Display setting",
        hint: "Configure which cards should receive custom styling, and which ones should be left as default. Changing this may require you to refresh your window.",
        scope: "client",
        config: true,
        default: "allCards",
        type: String,
        choices: {
            "allCards": "Affect every message.",
            "selfAndGM": "Affect own messages and GM messages.",
            "self": "Only affect own messages.",
            "gm": "Only affect GM messages.",
            "player": "Only affect player messages.",
            "none": "Don't affect any messages."
        }
    });
});

Hooks.once("setup", function () {
    Handlebars.registerHelper("userColor", function (userId, isBackground) {
        const setting = game.settings.get("df-chat-cards", "displaySetting");
        if (setting === "none") {
            return null;
        }

        const user = game.users.get(userId);
        if (setting === "self" && user.data._id !== game.user.data._id) {
            return null;
        } else if (setting === "selfAndGM" && user.data._id !== game.user.data._id && !user.isGM) {
            return null;
        } else if (setting === "gm" && !user.isGM) {
            return null;
        } else if (setting === "player" && user.isGM) {
            return null;
        }

        const userColor = user?.data?.color;
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

    Handlebars.registerHelper("isStyled", function (userId) {
        const setting = game.settings.get("df-chat-cards", "displaySetting");
        if (setting === "none") {
            return false;
        }

        const user = game.users.get(userId);
        if (setting === "self" && user.data._id !== game.user.data._id) {
            return false;
        } else if (setting === "selfAndGM" && user.data._id !== game.user.data._id && !user.isGM) {
            return false;
        } else if (setting === "gm" && !user.isGM) {
            return false;
        } else if (setting === "player" && user.isGM) {
            return false;
        }
        return true;
    });
});
