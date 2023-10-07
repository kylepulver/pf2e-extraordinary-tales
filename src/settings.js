Hooks.once("init", () => {
    // game.settings.register("pf2e-alignment-damage", "alignmentConfig", {
    //     scope: "world",
    //     config: true,
    //     name: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.name"),
    //     hint: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.hint"),
    //     type: String,
    //     default: "default",
    //     choices: {
    //         all: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.all"),
    //         nonMatching: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.nonMatching"),
    //         default: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.default"),
    //         none: game.i18n.localize("pf2e-alignment-damage.settings.alignmentConfig.none"),
    //     }
    // });
    game.settings.register("pf2e-extraordinary-tales", "simplePlayerControls", {
        name: "Simple Player Controls",
        hint: "Replace the default control panel on the left with a different panel that only displays the essentials.",
        icon: "fas fa-cog",
        scope: "client",
        config: true,
        default: true,
        type: Boolean,
        // onChange: rule => window.location.reload(),
    });

    game.settings.register("pf2e-extraordinary-tales", "automaticallyShowStrikeNames", {
        name: "Automatically Show Strike Names",
        hint: "Automatically show Hidden Strike names from NPCs to Players",
        icon: "fas fa-cog",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });

});

