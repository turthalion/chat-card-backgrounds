function shouldOverrideMessage(message) {
    const setting = game.settings.get("df-chat-cards", "displaySetting");
    if (setting !== "none") {
        const user = game.users.get(message.user);
        if (user) {
            const isSelf = user.data._id === game.user.data._id;
            const isGM = user.isGM;

            if ((setting === "allCards")
                || (setting === "self" && isSelf)
                || (setting === "selfAndGM" && (isSelf || isGM))
                || (setting === "gm" && isGM)
                || (setting === "player" && !isGM)
            ) {
                return true;
            }
        }
    }
    return false;
}

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

    game.settings.register("df-chat-cards", "cardStyle", {
        name: "Card style",
        hint: "Configure how the card will highlight the player colour.",
        scope: "client",
        config: true,
        default: "header",
        type: String,
        choices: {
            "header": "Change the colour of the header.",
            "underline": "Underline the title text with the player's colour.",
            "topBar": "Coloured bar at the top of the message."
        }
    });

    game.settings.register("df-chat-cards", "borderOverride", {
        name: "Override border",
        hint: "Enables border colour override. This will colour the border of the chat card with the player's colour.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("df-chat-cards", "insertSpeakerImage", {
        name: "Insert Speaker Image",
        hint: "Adds the image of the speaker to the chat card.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });
});

Hooks.once("setup", function () {
    Handlebars.registerHelper("getSpeakerImage", function (message) {
        const speaker = message.speaker;
        if (speaker) {
            if (speaker.token) {
                const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
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
        }
        
        return "icons/svg/mystery-man.svg";
    });

    Handlebars.registerHelper("showSpeakerImage", function (message) {
        const insertSpeakerImage = game.settings.get("df-chat-cards", "insertSpeakerImage");
        if (!insertSpeakerImage) {
            return false;
        }

        const speaker = message.speaker;
        if (!speaker) {
            return false;
        } else {
            let bHasImage = false;
            if (speaker.token) {
                const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
                if (token) {
                    bHasImage = bHasImage || token.data.img != null;
                }
            }

            if (speaker.actor) {
                const actor = Actors.instance.get(speaker.actor);
                if (actor) {
                    bHasImage = bHasImage || actor.data.img != null;
                }
            }

            if (!bHasImage) {
                return false;
            }
        }

        return shouldOverrideMessage(message);
    });

    Handlebars.registerHelper("useVideoForSpeakerImage", function (message) {
        const speaker = message.speaker;
        if (!speaker) {
            return false;
        } else {
            let imageName = "";
            if (speaker.token) {
                const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
                if (token) {
                    imageName = token.data.img;
                }
            }

            if (!imageName && speaker.actor) {
                const actor = Actors.instance.get(speaker.actor);
                if (actor) {
                    imageName = actor.data.img;
                }
            }

            return imageName?.endsWith("webm") || imageName?.endsWith("mp4") || imageName?.endsWith("ogg") || false;
        }

        return false;
    });

    Handlebars.registerHelper("getBorderStyle", function (message, foundryBorder) {
        const borderOverride = game.settings.get("df-chat-cards", "borderOverride");
        if (borderOverride && shouldOverrideMessage(message)) {
            const user = game.users.get(message.user);
            return `border-color: ${user.data.color}`;
        }

        if (foundryBorder) {
            return `border-color: ${foundryBorder}`;
        }
        return "";
    });

    Handlebars.registerHelper("getHeaderStyle", function (message) {
        if (shouldOverrideMessage(message)) {
            const user = game.users.get(message.user);

            const cardStyle = game.settings.get("df-chat-cards", "cardStyle");
            if (cardStyle !== "header") {
                return "";
            }

            const hexColor = user.data.color.replace("#", "");
            var r = parseInt(hexColor.substr(0,2),16);
            var g = parseInt(hexColor.substr(2,2),16);
            var b = parseInt(hexColor.substr(4,2),16);
            var yiq = ((r*299)+(g*587)+(b*114))/1000;
            const textColor = (yiq >= 128) ? '#333' : '#E7E7E7';

            return `background-color:${user.data.color}; color: ${textColor};`;
        }
        return "";
    });

    Handlebars.registerHelper("getTitleStyle", function (message) {
        if (shouldOverrideMessage(message)) {
            const user = game.users.get(message.user);

            const cardStyle = game.settings.get("df-chat-cards", "cardStyle");
            if (cardStyle === "underline") {
                return `box-shadow: inset 0px -2px 0 ${user.data.color};`;
            } else if (cardStyle === "topBar") {
                return "";
            }
            
            const hexColor = user.data.color.replace("#", "");
            var r = parseInt(hexColor.substr(0,2),16);
            var g = parseInt(hexColor.substr(2,2),16);
            var b = parseInt(hexColor.substr(4,2),16);
            var yiq = ((r*299)+(g*587)+(b*114))/1000;
            const textColor = (yiq >= 128) ? '#333' : '#E7E7E7';

            return `color: ${textColor};`;
        }
        return "";
    });

    Handlebars.registerHelper("getUserColor", function (message) {
        if (shouldOverrideMessage(message)) {
            const user = game.users.get(message.user);
            return user.data.color;
        }
        return "";
    });

    Handlebars.registerHelper("getCardStyle", function () {
        const cardStyle = game.settings.get("df-chat-cards", "cardStyle");
        return cardStyle;
    });
});
