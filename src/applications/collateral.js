import ExtraTalesCore from "../core.js";

export default class ExtraTalesCollateral extends Application {
    constructor(actor, options={}) {
        super(options);
        this.actor = actor;

        this._fn = Hooks.on('updateActor', (doc, change, options, userId) => {
            if (change?.flags?.['pf2e-extraordinary-tales'] ?? false) {
                this.render(true);
            }
        });
    }

    static get defaultOptions() {
        
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            id: 'extra-tales-collateral',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/collateral.hbs",
            width: 720,
            height: "auto"
        });
    }

    // async id() {

    // }

    async getData() {
        const data = {};

        data.isGM = game.user.isGM;
        data.username = game.user.name;
        data.characters = [];
        data.self = this.actor;
        
        data.collateralready = {};
        data.collateralxp = {};
        data.collateraluses = {};
        for(let u of game.users.values()) {
            if (u.character) {
                data.characters.push(u.character);
            }
        }

        for(let c of data.characters) {
            data.collateralready[c.id] = c.getFlag('pf2e-extraordinary-tales', 'collateralready') ?? false;
            data.collateralxp[c.id] = parseInt(c.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
            data.collateraluses[c.id] = parseInt(c.getFlag('pf2e-extraordinary-tales', 'collateraluses') ?? 0);
        }

        data.allready = true;
        for(let c of data.characters) {
            // consider characters with 0 collateral always ready
            if (data.collateralxp[c.id] && !data.collateralready[c.id]) {
                data.allready = false;
            }
        }

        data.allzero = true;
        for(let c of data.characters) {
            if (data.collateralxp[c.id]) {
                data.allzero = false;
            }
        }

        // If everyone is at zero, no dice
        if (data.allzero)
            data.allready = false;

        this._allready = data.allready;

        return data;
    }

    async close(options={}) {
        this.actor.setFlag('pf2e-extraordinary-tales', 'collateralready', false)
        Hooks.off("updateActor", this._fn);
        return super.close(options);
    }

    activateListeners(html) {
        if (this._allready) {
            setTimeout(() => {
                ExtraTalesCore.useCollateralXP(this.actor);
                this.close();
            }, 1000);
        }

        // something
        html.on('click', 'button', (ev) => {

        });
    }
}