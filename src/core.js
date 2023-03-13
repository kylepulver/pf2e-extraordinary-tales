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

    static promptCollateralXP(actor) {
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
                    callback: () => {
                        actor.setFlag('pf2e-extraordinary-tales', 'collateralready', true)
                        new ExtraTalesCollateral(actor).render(true);
                        // execute the function for every other user
                        for(let u of game.users) {
                            if (u.isGM) continue;
                            if (u.isSelf) continue;
                            ExtraTalesCore.socket.executeAsUser(ExtraTalesCore.promptCollateralXP, u.id, u.character);
                        }
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

    static usePersonalXP(actor) {
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

        actor.setFlag('pf2e-extraordinary-tales', 'personalxp', xpto)
        actor.setFlag('pf2e-extraordinary-tales', 'collateralxp', colxpto)

        ChatMessage.create({
            content: `<strong>${actor.name}</strong> uses Personal XP!<br /> Personal XP (${xp}) <i class="fa-solid fa-arrow-right"></i> (${xpto})<br /> Collateral XP (${colxp}) <i class="fa-solid fa-arrow-right"></i> (${colxpto})}`
        })
        // Math.floor(Math.log(xp) / Math.log(2))
    }

    static setCollateralStatus(actor, value) {

    }

    static useCollateralXP(actor) {
        let xp = parseInt(actor.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0);
        let xpto = Math.floor(xp * 0.5);
        actor.setFlag('pf2e-extraordinary-tales', 'collateralxp', xpto)
        ChatMessage.create({
            content: `<strong>${actor.name}</strong> uses Collateral XP!<br />Collateral XP (${xp}) <i class="fa-solid fa-arrow-right"></i> (${xpto})`
        })

    }

    
}