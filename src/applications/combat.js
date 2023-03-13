export default class ExtraTalesCombat extends Application {
    constructor(actor, options={}) {
        super(options);
        this.actor = actor;
    }

    static get defaultOptions() {
        
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            popOut: false,
            id: 'extra-tales-combat',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/combat.hbs",
            // width: 720,
            height: "auto"
        });
    }
}
