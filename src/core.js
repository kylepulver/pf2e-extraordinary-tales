import ExtraTalesCollateral from "./applications/collateral.js";

export default class ExtraTalesCore {
    static initialize() {

    }

    static socket;

    static promptPersonalXP(actor) {

        let xpRemaining = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0);

        if (!xpRemaining) {
            Dialog.prompt({
                title: "Extraordinary Tales Message",
                content: `<p>You do not have any Personal XP to spend.</p>`
            }).render(true);
            return;
        }
        let usesRemaining = ExtraTalesCore.getUsagesFromXP(xpRemaining);

        let usesAfter = usesRemaining - 1;
        let xpAfter = Math.floor(xpRemaining * 0.5);

        let collateral = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        let collateralAfter = collateral + 2;

        let d = new Dialog({
            title: `Use Personal XP Ability`,
            content: `<p>Are you sure?</p><p>${usesRemaining} uses available from ${xpRemaining} Personal XP.</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: `Use Personal Ability`,
                    callback: () => {
                        ExtraTalesCore.usePersonalXP(actor);
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {}
                }
            },
            default: "two",
            render: html => {},
            close: html => {}
        });
        d.render(true);
    }

    static socketCollateral(data) {

    }

    static promptCollateralXP(actor) {
        if (!actor) {
            actor = game.user.character ?? false;
        }
        if (actor === false) {
            console.log("No actor")
            return;
        }
        // console.log("Prompt Collateral", actor);
        let xpRemaining = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);

        if (!xpRemaining) {
            Dialog.prompt({
                title: "Extraordinary Tales Message",
                content: `<p>You do not have any Collateral XP to spend.</p>`
            }).render(true);
            return;
        }

        let usesRemaining = ExtraTalesCore.getUsagesFromXP(xpRemaining);

        let usesAfter = usesRemaining - 1;
        let xpAfter = Math.floor(xpRemaining * 0.5);

        let d = new Dialog({
            title: `Use Collateral XP Ability`,
            content: "<p>Are you sure?</p><p>The Collateral ability will activate after all heroes have opted in.</p>",
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: `Use Collateral Ability`,
                    callback: async () => {
                        actor.setFlag('pf2e-extraordinary-tales', 'collateralready', true)
                        new ExtraTalesCollateral(actor).render(true);
                        ExtraTalesCore.socket.executeForUsers(
                            ExtraTalesCore.promptCollateralXP,
                            game.users.filter(u => u.character && !u.isSelf && !u.character?.getFlag("pf2e-extraordinary-tales", "collateralready")).map(u => u.id)
                            )
                        // execute the function for every other user
                        // for(let u of game.users) {
                        //     if (u.isGM) continue;
                        //     if (u.isSelf) continue;
                        //     if (!u.character) continue;
                        //     await ExtraTalesCore.socket.executeAsUser(ExtraTalesCore.promptCollateralXP, u.id, u.character);
                        // }
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {}
                }
            },
            default: "two",
            render: html => {},
            close: html => {}
        });
        d.render(true);
    }

    static getUsagesFromXP(xp) {
        if (parseInt(xp) < 1) return 0;
        return Math.floor(Math.log(xp) / Math.log(2)) + 1;
    }

    static async usePersonalXP(actor) {
        let xp = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0);
        
        if (!xp) {
            Dialog.prompt({
                title: "Extraordinary Tales Error",
                content: `<p>You do not have any XP to spend.</p>`
            }).render(true);
            return;
        }

        let xpto = Math.floor(xp * 0.5);
        
        let colxp = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        let colxpto = colxp + 2;

        await actor.setFlag('pf2e-extraordinary-tales', 'personalxp', xpto)
        await actor.setFlag('pf2e-extraordinary-tales', 'collateralxp', colxpto)

        await actor.setFlag('pf2e-extraordinary-tales', 'personaluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0)))
        await actor.setFlag('pf2e-extraordinary-tales', 'collateraluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0)))

        ChatMessage.create({
            content: `<div>Personal XP (${xp}) <i class="fa-solid fa-arrow-right"></i> (${xpto})</div><div style="opacity:0.6">Collateral XP (${colxp}) <i class="fa-solid fa-arrow-right"></i> (${colxpto})</div>`
        })
        // Math.floor(Math.log(xp) / Math.log(2))
    }

    static setCollateralStatus(actor, value) {

    }

    static async useCollateralXP(actor) {
        let xp = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        let xpto = Math.floor(xp * 0.5);
        await actor.setFlag('pf2e-extraordinary-tales', 'collateralxp', xpto)
        ChatMessage.create({
            content: `<div>Collateral XP (${xp}) <i class="fa-solid fa-arrow-right"></i> (${xpto})</div>`
        })

        await actor.setFlag('pf2e-extraordinary-tales', 'personaluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0)))
        await actor.setFlag('pf2e-extraordinary-tales', 'collateraluses', ExtraTalesCore.getUsagesFromXP(parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0)))

    }

    
}