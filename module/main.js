function shouldOverrideMessage(message) {
    const setting = game.settings.get("chat-card-backgrounds", "displaySetting");
    if (setting !== "none") {
        const sender = getSenderUser(message);
        if (sender) {
            const isSelf = sender.id === game.user.id;
            const isGM = sender.isGM;

            if ((setting === "allCards"
                || (setting === "self" && isSelf)
                || (setting === "selfAndGM" && (isSelf || isGM))
                || (setting === "gm" && isGM)
                || (setting === "player" && !isGM))) {
                  return true;
            }
        }
    }
    return false;
}

function getSenderUser(message) {
  // v13: prefer the "author" getter (User document)
  if (message.author) return message.author;

  // fallback: if only raw source was passed
  const userId = message.user?.id ?? message.user ?? message.author ?? message._source?.author;
  return game.users.get(userId) ?? null;
}

Hooks.once('init', async function () {
    CONFIG.ChatMessage.template = "modules/chat-card-backgrounds/templates/base-chat-message.html";

    game.settings.register("chat-card-backgrounds", "displaySetting", {
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

    game.settings.register("chat-card-backgrounds", "cardStyle", {
        name: "Card style",
        hint: "Configure how the card will highlight the player colour.",
        scope: "client",
        config: true,
        default: "header",
        type: String,
        choices: {
            "header": "Colour the header",
            "underline": "Underline title text",
            "topBar": "Coloured bar at top"
        }
    });

    game.settings.register("chat-card-backgrounds", "borderOverride", {
        name: "Override border",
        hint: "Enables border colour override. This will colour the border of the chat card with the player's colour.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("chat-card-backgrounds", "insertSpeakerImage", {
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
                    return token.texture.src
                }
            }

            if (speaker.actor) {
                const actor = game.actors.get(speaker.actor);
                if (actor) {
                    return actor.img;
                }
            }
        }

        return "icons/svg/mystery-man.svg";
    });

    Handlebars.registerHelper("showSpeakerImage", function(message) {
        const insertSpeakerImage = game.settings.get("chat-card-backgrounds", "insertSpeakerImage");
        if (!insertSpeakerImage) return false;

        const speaker = message.speaker;
        if (!speaker) return false;

        let bHasImage = false;

        if (speaker.token) {
            const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
            if (token) bHasImage = bHasImage ||= !!token.texture.src;
        }

        if (speaker.actor) {
            const actor = game.actors.get(speaker.actor);
            if (actor) bHasImage = bHasImage ||= !!actor.img;
        }

        if (!bHasImage) return false;

        return shouldOverrideMessage(message);
    });

    Handlebars.registerHelper("useVideoForSpeakerImage", function(message) {
        const speaker = message.speaker;
        if (!speaker) return false;

        let img = "";
        if (speaker.token) {
            const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
            if (token) img = token.texture.src;
        }

        if (!img && speaker.actor) {
            const actor = game.actors.get(speaker.actor);
            if (actor) img = actor.img;
        }

        return img?.endsWith("webm") || img?.endsWith("mp4") || img?.endsWith("ogg") || false;
    });

    Handlebars.registerHelper("getBorderStyle", function(message, foundryBorder) {
        const borderOverride = game.settings.get("chat-card-backgrounds", "borderOverride");
        if (borderOverride && shouldOverrideMessage(message)) {
            const sender = getSenderUser(message);
            return sender ? `border-color: ${sender.color}` : "";
        }
        if (foundryBorder) return `border-color: ${foundryBorder}`;
        return "";
    });

    Handlebars.registerHelper("getHeaderStyle", function(message) {
        if (shouldOverrideMessage(message)) {
            const sender = getSenderUser(message);
            if (!sender) return "";

            const cardStyle = game.settings.get("chat-card-backgrounds", "cardStyle");
            if (cardStyle !== "header") return "";

            const hexColor = String(sender.color ?? "#000000").replace("#", "");
            const r = parseInt(hexColor.substr(0, 2), 16);
            const g = parseInt(hexColor.substr(2, 2), 16);
            const b = parseInt(hexColor.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114))/1000;
            const textColor = (yiq >= 128) ? '#333' : '#E7E7E7';

            return `background-color:${sender.color}; color: ${textColor};`;
        }
        return "";
    });

    Handlebars.registerHelper("getTitleStyle", function(message) {
        if (!shouldOverrideMessage(message)) return "";

        const sender = getSenderUser(message);
        if (!sender) return "";

        const cardStyle = game.settings.get("chat-card-backgrounds", "cardStyle");

        if (cardStyle === "underline") {
            return `box-shadow: inset 0px -2px 0 ${sender.color}`;
        } else if (cardStyle === "topBar") {
            return ""; // handled in template span
        }

        // header fallback
        const hexColor = String(sender.color ?? "#000000").replace("#", "");
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        const textColor = (yiq >= 128) ? '#333' : '#E7E7E7';

        return `color: ${textColor}`;
    });

    Handlebars.registerHelper("getUserColor", function (message) {
        if (shouldOverrideMessage(message)) {
            const sender = getSenderUser(message);
            return sender?.color ?? "";
        }
        return "";
    });

    Handlebars.registerHelper("getCardStyle", function () {
        return game.settings.get("chat-card-backgrounds", "cardStyle");
    });
});

Hooks.on("renderChatMessage", (message, html, data) => {
  console.log("Message doc:", message);
  console.log("Template data:", data);
});
