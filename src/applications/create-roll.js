export default class ExtraTalesCreateRoll extends FormApplication {
    constructor(object={}, options={}) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            id: 'extra-tales-create-roll',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/create-roll.hbs",
            width: 500,
            height: "auto",
            title: "Create Roll"
        });
    }

    async getData() {
        const data = {}

        data.isGM = game.user.isGM;

        // data.characters = game.users.filter(u => u.character).map(u => u.character);

        // data.aid = this.object.getFlag('pf2e-extraordinary-tales','aid') ?? false;
        // if (data.aid === false) {
        //     data.aid = {};
        //     for(let c of data.characters) {
        //         data.aid[c.id] = false;
        //     }
        // }

        return data;
    }

    async _updateObject(event, formData) {
        // this.object.setFlag('pf2e-extraordinary-tales', 'aid', formData);
    }

    activateListeners(html) {

    }
}