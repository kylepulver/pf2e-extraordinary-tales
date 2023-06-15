export default class ExtraTalesConfigure extends FormApplication {
    constructor(object={}, options={}) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            id: 'extra-tales-configure',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/configure.hbs",
            width: 480,
            title: "Configuration",
            height: "auto"
        });
    }

    async getData() {
        const data = {}

        data.isGM = game.user.isGM;

        data.username = game.user.name;

        data.config = game.user.getFlag("pf2e-extraordinary-tales", "config") ?? {}
        // console.log(data.config);

        data.config.hideSections = data.config.hideSections ?? {};

        data.config.hideSections.saveList = data.config.hideSections.saveList ?? false;
        data.config.hideSections.skillList = data.config.hideSections.skillList ?? false;
        data.config.hideSections.recoveryActions = data.config.hideSections.recoveryActions ?? false;
        data.config.hideSections.skillActions = data.config.hideSections.skillActions ?? false;
        data.config.hideSections.toggleValues = data.config.hideSections.toggleValues ?? false;
        data.config.hideSections.attackList = data.config.hideSections.attackList ?? false;
        data.config.hideSections.freeActions = data.config.hideSections.freeActions ?? false;
        data.config.hideSections.reactions = data.config.hideSections.reactions ?? false;
        data.config.hideSections.actions = data.config.hideSections.actions ?? false;
        data.config.hideSections.spellList = data.config.hideSections.spellList ?? false;
        data.config.hideSections.passiveAbilities = data.config.hideSections.passiveAbilities ?? false;
        data.config.hideSections.equipmentList = data.config.hideSections.equipmentList ?? false;

        data.config.chat = data.config.chat ?? {};
        data.config.chat.defaultCards = data.config.chat.defaultCards ?? false;

        // data.config.hideSections.customChat = data.config.hideSections.customChat ?? false;

        // might be able to like specify the default thing and then uhhh merge object or something from the flag?

        this._config = data.config;

        return data;
    }

    async _updateObject(event, formData) {
        // console.log(formData);
        // game.user.setFlag("pf2e-extraordinary-tales", "config", foundry.utils.expandObject(formData))
        game.user.setFlag("pf2e-extraordinary-tales", "config", formData)
            // this.object.setFlag('pf2e-extraordinary-tales', 'aid', formData);
    }

    activateListeners(html) {

    }
}