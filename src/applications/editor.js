import ExtraTalesCore from "../core.js";
import ExtraTalesCollateral from "./collateral.js";

export default class ExtraTalesEditor extends Application {
    // constructor(options={}) {
    //      super(options);
    // }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["dnd5e"],
            id: 'extra-tales-editor',
            classes:["pf2e-extraordinary-tales"],
            template: "modules/pf2e-extraordinary-tales/templates/apps/editor.hbs",
            width: 720,
            height: "auto",
            title: "Extraorindary Tales"
        });
    }

    async getData() {
        const data = {}

        data.isGM = game.user.isGM;

        data.username = game.user.name;

        // data.self = game.user.character ?? false;
        data.self = [];


        // data.characters = game.actors.filter(a => a.type == 'character');

        
        

        data.personalxp = {}
        data.collateralxp = {};
        data.personaluse = {};
        data.collateraluse = {};
        data.collateralready = {};
        data.aidrecieved = {}
        data.aidprovided = {}
        data.heropoints = {};
        data.characters = [];
        for(let u of game.users.values()) {
            if (u.character) {
                data.characters.push(u.character);
            }
        }
        

        if (data.isGM) {
            for(let u of game.users.values()) {
                if (u.character) {
                    data.self.push(u.character);
                }
            }
        }
        else {
            if (game.user.character) {
            data.self = [game.user.character]
            }
        }

        for(let c of data.characters) {
            // console.log(c.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0);
            data.personalxp[c.id] = c.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0;
            data.collateralxp[c.id] = c.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0;

            data.personaluse[c.id] = ExtraTalesCore.getUsagesFromXP(data.personalxp[c.id]);
            data.collateraluse[c.id] = ExtraTalesCore.getUsagesFromXP(data.collateralxp[c.id]);

            data.collateralready[c.id] = c.getFlag('pf2e-extraordinary-tales', 'collateralready') ?? false;
            data.heropoints[c.id] = c.system.resources.heroPoints.value ?? 0;
        }

        // for (let c of data.characters) {
        //     data.aidrecieved[c.id] = game.messages
        //     // .filter(m => Date.now() - m.timestamp < 1000 * 60 * 60 * 24)
        //     .filter(m => Date.now() - m.timestamp < 1000 * 60 * 60 * 2400)
        //     .filter(m => {
        //         let aid = m.getFlag("pf2e-extraordinary-tales", "aid") ?? {}
        //         return aid[c.id] ?? false
        //     })
        //     .map(m => game.users.get(m.user)?.character?.id ?? "error")

        //     data.aidprovided[c.id] = game.messages
        //     .filter(m => Date.now() - m.timestamp < 1000 * 60 * 60 * 24)
        //     .filter(m => m.user == game.users.find(u => u.character.id == c.id))
        //     .map(m => {
        //         let aid = m.getFlag("pf2e-extraordinary-tales", "aid") ?? {}
        //         return Object.keys(aid);
        //     })
        // }
        
        // console.log(data.aidrecieved, data.aidprovided)

        // console.log(data);

        return data;
    }

    async close(options={}) {
        // console.log("REMOVING HOOKS", this._fn)
        Hooks.off('updateActor', this._fn);
        super.close(options);
    }

    activateListeners(html) {
        if (!this._fn) {
            // Update the window when data changes
            this._fn = Hooks.on('updateActor', (doc, change, options, userId) => {
                if (change?.flags?.['pf2e-extraordinary-tales'] ?? false) {
                    this.render(true);
                }
                if (change?.system?.resources?.heroPoints ?? false) {
                    this.render(true);
                }
            });
        }

        html.on('click', '[data-action]', async (ev) => {
            let action = ev.currentTarget.dataset.action;
            let xp = ev.currentTarget.dataset.xp;
            let id = ev.currentTarget.closest('[data-actor-id]').dataset.actorId;
            let actor = game.actors.get(id);

            if (action == "increase") {
                let val = parseInt(actor.getFlag('pf2e-extraordinary-tales', xp) ?? 0);
                await actor.setFlag('pf2e-extraordinary-tales', xp, val + 1)
            }
            if (action == "decrease") {
                let val = parseInt(actor.getFlag('pf2e-extraordinary-tales', xp) ?? 0);
                await actor.setFlag('pf2e-extraordinary-tales', xp, val - 1)
            }
            if (action == "edit") {
                this.editDialog(xp, actor);
            }
            if (action == "use") {
                this.useDialog(xp, actor);
            }
            if (action == "heropointincrease") {
                let heroPointCount = actor.system.resources.heroPoints.value;
                await actor.update({
                    "system.resources.heroPoints.value": Math.clamped(heroPointCount + 1, 0, 3),
                });
            }
            if (action == "heropointdecrease") {
                let heroPointCount = actor.system.resources.heroPoints.value;
                await actor.update({
                    "system.resources.heroPoints.value": Math.clamped(heroPointCount - 1, 0, 3),
                });
            }
            await actor.setFlag('pf2e-extraordinary-tales', 'personaluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0)))
            await actor.setFlag('pf2e-extraordinary-tales', 'collateraluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0)))

        })
    }

    usePersonalDialog(actor) {
        ExtraTalesCore.promptPersonalXP(actor);

        // let xpRemaining = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0);
        // let usesRemaining = ExtraTalesCore.getUsagesFromXP(xpRemaining);

        // let usesAfter = usesRemaining - 1;
        // let xpAfter = Math.floor(xpRemaining * 0.5);

        // let collateral = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        // let collateralAfter = collateral + 2;

        // let d = new Dialog({
        //     title: `Use Personal XP Ability`,
        //     content: `<p>Are you sure?</p><p>${usesRemaining} uses available.</p>`,
        //     buttons: {
        //         one: {
        //             icon: '<i class="fas fa-check"></i>',
        //             label: `Use Personal Ability`,
        //             callback: () => {
        //                 ExtraTalesCore.usePersonalXP(actor);
        //             }
        //         },
        //         two: {
        //             icon: '<i class="fas fa-times"></i>',
        //             label: "Cancel",
        //             callback: () => {}
        //         }
        //     },
        //     default: "two",
        //     render: html => {},
        //     close: html => {}
        // });
        // d.render(true);
    }

    useCollateralDialog(actor) {
        ExtraTalesCore.promptCollateralXP(actor);

        // let xpRemaining = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        // let usesRemaining = ExtraTalesCore.getUsagesFromXP(xpRemaining);

        // let usesAfter = usesRemaining - 1;
        // let xpAfter = Math.floor(xpRemaining * 0.5);

        // let d = new Dialog({
        //     title: `Use Collateral XP Ability`,
        //     content: "<p>Are you sure?</p><p>The Collateral XP ability will activate after all party members have opted in.</p>",
        //     buttons: {
        //         one: {
        //             icon: '<i class="fas fa-check"></i>',
        //             label: `Use Collateral Ability`,
        //             callback: () => {
        //                 actor.setFlag('pf2e-extraordinary-tales', 'collateralready', true)
        //                 new ExtraTalesCollateral(actor).render(true);
        //             }
        //         },
        //         two: {
        //             icon: '<i class="fas fa-times"></i>',
        //             label: "Cancel",
        //             callback: () => {}
        //         }
        //     },
        //     default: "two",
        //     render: html => {},
        //     close: html => {}
        // });
        // d.render(true);
    }

    useDialog(xp, actor) {
        if (xp == "collateralxp") {
            this.useCollateralDialog(actor);
        }
        else {
            this.usePersonalDialog(actor);
        }
        // let label = "Personal";
        // if (xp == 'collateralxp') label = "Collateral"

        // let d = new Dialog({
        //     title: `Use ${label} XP Ability`,
        //     content: "<p>Are you sure?</p><p>You currently have X uses of LABEL abilities. After using this ability, you will have Y uses remaining and Z LABEL xp remaining.</p>",
        //     buttons: {
        //         one: {
        //             icon: '<i class="fas fa-check"></i>',
        //             label: `Use ${label} Ability`,
        //             callback: () => {}
        //         },
        //         two: {
        //             icon: '<i class="fas fa-times"></i>',
        //             label: "Cancel",
        //             callback: () => {}
        //         }
        //     },
        //     default: "two",
        //     render: html => {},
        //     close: html => {}
        // });
        // d.render(true);
    }

    editDialog(xp, actor) {
        let label = "Personal";
        if (xp == 'collateralxp') label = "Collateral"

        let setval = 0;

        let d = new Dialog({
            title: `Edit ${label} XP Value`,
            content: `<p><input type="text" style="text-align:center"></p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: `Save Changes`,
                    callback: () => {
                        actor.setFlag('pf2e-extraordinary-tales', xp, setval)
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Discard Changes",
                    callback: () => {}
                }
            },
            default: "two",
            render: html => {
                html.find('input').val(actor.getFlag('pf2e-extraordinary-tales', xp) ?? 0);

                html.on('input', 'input', (ev) => {
                    setval = ev.currentTarget.value;
                })
            },
            close: html => {}
        });
        d.render(true);

    }
    
}