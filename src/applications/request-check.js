export default class ExtraTalesRequestCheck extends FormApplication {
    constructor(object={}, options={}) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            id: 'extra-tales-request-check',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/request-check.hbs",
            width: 500,
            height: "auto",
            title: "Request Check"
        });
    }

    async getData() {
        const data = {}

        data.isGM = game.user.isGM;

        data.types = {
            perception: "perception",
            fortitude: "fortitude",
            reflex: "reflex",
            will: "will", 
            acrobatics: "acrobatics",
            arcana: "arcana",
            athletics: "athletics",
            crafting: "crafting",
            deception: "deception",
            diplomacy: "diplomacy",
            intimidation: "intimidation",
            medicine: "medicine",
            nature: "nature",
            occultism: "occultism",
            performance: "performance",
            religion: "religion",
            society: "society",
            stealth: "stealth",
            survival: "survival",
            thievery: "thievery",
            other: "other"
        }

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
        console.log(formData);

        let secretText = "";
        if (formData.secret === true) {
            secretText = "secret,"
        }
        let label = "";
        if (formData.label) {
            label = `{${formData.label}}`
        }
        let desc = "";
        if (formData.description ) {
            desc = formData.description;
        }
        let traits = formData.traits || '';
        let basic = "";
        if (formData.basic === true) {
            basic = `|basic:true`
        }
        let dc = formData.dc || 10;
        let damaging = ""
        if (formData.damaging === true) {
            damaging = `damaging-effect,`
        }
        let checkText = `@Check[type:${formData.type}|dc:${dc}|traits:${damaging}${secretText}${traits}${basic}]${label}`;
        // if (formData.description) {
        //     checkText += `<div style="font-size:1rem">${formData.description}</div>`
        // }
        // 
        // this.object.setFlag('pf2e-extraordinary-tales', 'aid', formData);
        ChatMessage.create({
            user: game.user._id,
            speaker: { alias: "Requested Check"},
            content: checkText,
            flavor: desc,
            flags: {
                "core.canPopout": true,
            },
        });
    }

    activateListeners(html) {

    }
}