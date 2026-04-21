function shouldOverrideMessage(message) {
    const setting = game.settings.get("chat-card-backgrounds", "displaySetting");
    if (setting !== "none") {
        const user = message.author;
        if (user) {
            const isSelf = user.id === game.user.id;
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
            "header": "Change the colour of the header.",
            "underline": "Underline the header with the player's colour.",
            "topBar": "Coloured bar at the top of the message.",
            "message": "Change entire message background.",
            "none": "No player colour highlight within the card itself."
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
        name: "Insert user avatar image",
        hint: "Adds the image of the user to the chat card when speaking as the user.",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });
});

Hooks.once("setup", function () {
    Hooks.on("renderChatMessageHTML", (message, element) => {
        if (!shouldOverrideMessage(message)) return;

        const user = message.author;
        if (!user) return;

        const accent = user.color?.css || user.flags?.core?.color;
        if (!accent) return;

        // Compute readable text color
        const hex = accent.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        const text = yiq >= 128 ? "#333" : "#E7E7E7";

        // We always want this property regardless of mode
        element.style.setProperty("--ccb-accent", accent);

        // Clear previous mode classes
        element.classList.remove(
            "ccb-border",
            "ccb-header",
            "ccb-underline",
            "ccb-topbar",
            "ccb-message"
        );

        // Check if border is to be styled
        const borderOverride = game.settings.get("chat-card-backgrounds", "borderOverride");
        element.classList.toggle("ccb-border", borderOverride);

        // Apply card style mode
        const mode = game.settings.get("chat-card-backgrounds", "cardStyle");

        switch (mode) {
            case "header":
                element.classList.add("ccb-header");
                element.style.setProperty("--ccb-text", text);
                break;

            case "underline":
                element.classList.add("ccb-underline");
                element.style.removeProperty("--ccb-text", text);
                break;

            case "topBar":
                element.classList.add("ccb-topbar");
                element.style.removeProperty("--ccb-text", text);
                break;

            case "message":
                element.classList.add("ccb-message");
                element.style.setProperty("--ccb-text", text);
                break;

            case "none":
            default:
                element.style.removeProperty("--ccb-text", text);
                break;
        }

        const showUserAvatar = game.settings.get("chat-card-backgrounds", "insertSpeakerImage");
        if (!showUserAvatar) return;

        // Only when speaking as USER
        if (message.speaker?.token) return;

        if (!user?.avatar) return;

        const header = element.querySelector(".message-header");
        if (!header) return;

        // Avoid duplicates
        if (header.querySelector(".portrait.user-avatar")) return;

        // Build portrait
        const portrait = document.createElement("div");
        portrait.classList.add("portrait", "user-avatar");

        const img = document.createElement("img");
        img.src = user.avatar;
        img.alt = user.name;
        img.setAttribute("inert", "");

        portrait.appendChild(img);

        // Match PF2e spacing rules
        header.classList.add("with-image");

        // Insert at the front
        header.prepend(portrait);
    });
});
