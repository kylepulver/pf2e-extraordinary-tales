import ExtraTalesAid from "./applications/aid.js";
import ExtraTalesCombat from "./applications/combat.js";
import ExtraTalesEditor from "./applications/editor.js";
import ExtraTalesEzUi from "./applications/ez-ui.js";
import ExtraTalesCore from "./core.js";
import ExtraTalesTokenOverlay from "./token-overlay.js";
import ExtraTalesTemplateOverlay from "./template-overlay.js";

const MODULE_ID = 'pf2e-extraordinary-tales';

// Make animations faster
for (let name of ["slideUp", "slideDown", "fadeIn", "fadeOut"]) {
    $.prototype[name] = (function () {
        const cached = $.prototype[name];
        return function () {
            if (Number.isInteger(arguments[0])) {
                arguments[0] = Math.floor(arguments[0] / 5);
            }
            const p = cached.apply(this, arguments);
            return p;
        };
    })();
}

Hooks.on('init', () => {
    console.log("Extraordinary Tales: Initialized");
    ExtraTalesCore.initialize();
    // libWrapper.register(
    //     MODULE_ID,
        
    // )
    
    getTemplate("modules/pf2e-extraordinary-tales/templates/roll-card.hbs")
    Handlebars.registerHelper("prettyformula", (value) => {
        let result = value.replace(/\*/gmi, '×')
        result = result.split('[')[0].trim();
        let f = result.match(/^\((.+?)\)$/mi);
        if (f !== null) {
            result = f[1];
        }
        return result;
    })

    let icondata = {
        fortitude: "fa-regular fa-heart",
        reflex: "fa-solid fa-bolt",
        will: "fa-solid fa-brain",
        "land speed": "fa-solid fa-shoe-prints",
        "fly speed": "fa-solid fa-feather",
        "burrow speed": "fa-solid fa-shovel",
        "swim speed": "fa-solid fa-water",
        "climb speed": "fa-solid fa-pickaxe"
    }
    Handlebars.registerHelper("icon", (value) => {
        if (!value.toLowerCase)return value;
        if (icondata.hasOwnProperty(value.toLowerCase().trim())) {
            return `<i class="${icondata[value.toLowerCase().trim()]}"></i>`;
        }
        return value;
    })
    
})

Hooks.on("ready", () => {
    // game.pf2e.ModifierType["HEROIC"] = "heroic";
    // game.pf2e.ModifierType["ESCALATION"] = "escalation";
    // game.pf2e.ModifierType["ADJUSTMENT"] = "adjustment";
    TooltipManager.TOOLTIP_ACTIVATION_MS = 1;
    $.fn.tooltipster("setDefaults", {
        delay: 0,
    })

    if (game.user.character) {
        if (game.user.character.getFlag("pf2e-extraordinary-tales", "collateralready")) {
            game.user.character.setFlag("pf2e-extraordinary-tales", "collateralready", false)
        }
    }

    // game.pf2e.check.prototype.rerollFromMessage
    game.pf2e.Check.rerollFromMessage = async (message, { heroPoint = false, keep = "new" }={}) => {
        if (!(message.isAuthor || game.user.isGM)) {
            ui.notifications.warn("You don't have permission to reroll from this chat message.");
            return
        }
        // force fortune effect for hero point
        if (heroPoint) {
            keep = "best"
        }
        const actor = game.actors.get(message.speaker.actor ?? "");
        // console.log(message);
        // let roll = message.rolls[0].clone();
        // let reroll = await roll.reroll();
        // console.log(reroll);
        // let rolls = message.rolls;
        // rolls.push(reroll);
        let newroll = await new Roll("d20").roll()
        await game.dice3d.showForRoll(newroll, message.author, false, message.whisper, message.blind, message.id, message.speaker);
        let roll = message.rolls[0];
        let die = roll.dice[0];
        die.results.push(newroll.dice[0].results[0]);

        die.results.filter((v, i, a) => i < a.length - 1).forEach(v => v.active = false)

        let r0 = die.results[die.results.length - 2]
        let r1 = die.results[die.results.length - 1]
        if (keep == "new") {
        }
        if (keep == "best") {
            r1.active = r1.result > r0.result;
            
            // die.results.forEach((v, i, a) => v.active = parseInt(v.result) > parseInt(a[a.length-1].result))
        }
        if (keep == "worst") {
            r1.active = r1.result < r0.result;
            
            // die.results.forEach((v, i, a) => v.active = parseInt(v.result) < parseInt(a[a.length-1].result))
        }
        // roll.isReroll = true;
        // console.log(roll);
        r0.active = !r1.active;

        if (heroPoint == true) {
            if (actor) {
                const heroPointCount = actor.heroPoints?.value ?? 0;
                if (heroPointCount) {
                    await actor.update({
                        "system.resources.heroPoints.value": Math.clamped(heroPointCount - 1, 0, 3),
                    });
                } else {
                    ui.notifications.warn(game.i18n.format("PF2E.RerollMenu.WarnNoHeroPoint", { name: actor.name }));
                    return;
                }
            } else {
                ui.notifications.error(game.i18n.localize("PF2E.RerollMenu.ErrorNoActor"));
                return;
            }
        }

        roll._total = roll._evaluateTotal();
        // message.rolls.push(roll);
        // console.log(message);
        message.setFlag("pf2e", "context.isReroll", true);
        message.update({"rolls": duplicate(message.rolls)})
        // message.update({"rolls": duplicate(message.rolls)},  {diff: false, recursive: false, noHook: true})
        // message.setFlag("pf2e-extraordinary-tales", "updated", Date.now());
    }

    new ExtraTalesEzUi().render(true);

})

Hooks.once("socketlib.ready", () => {
	ExtraTalesCore.socket = socketlib.registerModule("pf2e-extraordinary-tales");
	// socket.register("hello", showHelloMessage);
	// socket.register("add", add);
    ExtraTalesCore.socket.register("promptCollateral", ExtraTalesCore.promptCollateralXP)
});

Hooks.on('getChatLogPF2eEntryContext', (obj, items) => {

    // console.log(items);
    // console.log(items.find(i => i.name == "PF2E.RerollMenu.HeroPoint"));

    // Make hero points keep the higher result
    // let heropointitem = items.find(i => i.name == "PF2E.RerollMenu.HeroPoint");
    // heropointitem.callback = async li => {
    //     const message = game.messages.get(li.data("messageId"), {strict:true});
    //     const actor = game.actors.get(message.speaker.actor ?? "");
    //     if (actor) {
    //         const heroPointCount = actor.heroPoints?.value ?? 0
    //         if (heroPointCount) {
    //             game.pf2e.Check.rerollFromMessage(message, { keep: "best"});

    //             await actor.update({
    //             "system.resources.heroPoints.value": Math.clamped(heroPointCount - 1, 0, 3),
    //             });
    //         }
    //         else {
    //             ui.notifications.warn(game.i18n.format("PF2E.RerollMenu.WarnNoHeroPoint", { name: actor.name }));
    //             return;
    //         }
    //     }
    // }

    items.push({
        name: "Mark as Aid",
        icon: "<i class=\"fa-solid fa-handshake\"></i>",
        callback: li => {
            const message = game.messages.get(li.data("messageId"));
            new ExtraTalesAid(message).render(true)
        }
    },{
        name: "Reveal Details",
        icon: "<i class=\"fa-solid fa-eye\"></i>",
        condition: li => {
            return game.user.isGM;
            const message = game.messages.get(li.data("messageId"));

        },
        callback: li => {
            if (!game.user.isGM) return;

            const message = game.messages.get(li.data("messageId"));
            // new ExtraTalesAid(message).render(true)
            let val = message.getFlag("pf2e-extraordinary-tales", "revealed") ?? false;
            message.setFlag("pf2e-extraordinary-tales","revealed", !val )
            console.log("message reveal state now ", !val)
        }
    })

    return items;
})

// Hooks.on('renderChatLogPF2e', (app, html, data) => {

//     html.append(`<div style="flex: 0 0;margin:0 6px"><button type="submit" id="extra-tales-button">Extraordinary Tales</div></div>`);

//     html.on('click',  '#extra-tales-button', () => {
//     let t = new ExtraTalesEditor().render(true);


// })
// })

Hooks.on('chatMessage', (obj, message, data) => {
    // console.log("chat message", obj,message, data);

    let cancel = false;

    try {
        if (Roll.validate(message)) {
            let r = new Roll(message)
            // r.evaluate();
            r.toMessage();
            cancel = true;
        }
    }
    catch(e) {
    }
    if (cancel) return false;

    return true;
})

Hooks.on("renderHeadsUpDisplay", async (app, html, data) => {
    html.append('<template id="token-overlay"></template>');
    canvas.hud.tokenOverlay = new ExtraTalesTokenOverlay();

    html.append('<template id="template-overlay"></template>');
    canvas.hud.templateOverlay = new ExtraTalesTemplateOverlay();

});

Hooks.on("updateToken", (a, b, c, d) => {
    if (canvas.hud.tokenOverlay)
        canvas.hud.tokenOverlay.clear();
});

Hooks.on("deleteToken", (a, b, c, d) => {
    if (canvas.hud.tokenOverlay)
        canvas.hud.tokenOverlay.clear();
});

Hooks.on("renderTokenHUD", (token, b, c, d) => {
    if (canvas.hud.tokenOverlay)
        canvas.hud.tokenOverlay.render();
    // canvas.hud.tokenOverlay.bind(token);
});


Hooks.on("hoverToken", (token, hovered) => {
    if (!canvas.hud.tokenOverlay) return;
    if (hovered) {
        canvas.hud.tokenOverlay.bind(token);

    } else {
        canvas.hud.tokenOverlay.clear();
    }
});

Hooks.on("deleteMeasuredTemplate", (a, b, c, d) => {
    if (canvas.hud.templateOverlay)
    canvas.hud.templateOverlay.clear();
})

Hooks.on("updateMeasuredTemplate", (a, b, c, d) => {
    if (canvas.hud.templateOverlay)
    canvas.hud.templateOverlay.clear();
})

Hooks.on("hoverMeasuredTemplate", (t, hovered) => {

    if (hovered) {
        canvas.hud.templateOverlay.bind(t);

    } else {
        canvas.hud.templateOverlay.clear();
    }
});

Hooks.on(`renderChatMessage`, async (app, html, data) => {
    // console.log("render chat message", app, html, data);

    let actor = app.token?.actor ?? app.actor ?? false;

    console.log(app)
    let etconfig = game.user.getFlag("pf2e-extraordinary-tales", "config") ?? {};
    if (!etconfig.chat?.defaultCards && app.rolls?.length) {
        
        let rendered = await renderTemplate("modules/pf2e-extraordinary-tales/templates/roll-card.hbs", app)
        html.find(".dice-roll").html(rendered)
    }


    let revealState = app.getFlag("pf2e-extraordinary-tales", "revealed") ?? false;

    // console.log(app);
// console.log(html.find('.card-content'));

    if (!app.user.isGM) {
        // messages not created by GM are never unrevealed
        revealState = true;
    }
    if (!html.find('.card-content').length) {
        // messages that are not chat info cards are never unrevealed
        revealState = true;
    }

    let reveal = revealState;
    // console.log(actor, game.users.filter(i => i.character?.id == actor.id));
    // if (app.getFlag("pf2e-extraordinary-tales", "revealed") == true) {
    //     reveal = true;
    // }
    if (actor) {
        if (game.users.filter(i => i.character && i.character.id == actor.id).length) {
            reveal = true;
            revealState = true; // if
        }
        if (actor.testUserPermission(game.user, 2)) {
            reveal = true;
        }
    }

    if (reveal) {
      
    }
    else {
        html.find('.card-header h3').first().html("Ability")
        html.find('.card-content').html("")
        html.find('.card-footer').html("");
        html.find('.card-header img').remove();
        html.find('.card-header h4').remove();
        
    }

    if (game.user.isGM) {
        if (!revealState) {
            html.append(`<div style="text-align:center;text-transform:uppercase;font-size:90%;opacity:0.75">Content hidden for players.</div>`);
        }
    }

    let aid = app.getFlag('pf2e-extraordinary-tales','aid') ?? false;


    if (aid !== false) {
        let append = ``;
        for(let k in aid) {
            if (aid[k]) {
                let actor = game.actors.get(k);
                append += `<span class="tag tag_transparent">Aiding ${actor.name}</span>`;
            }
        }
        if (append) {
            html.append(`<div class="tags">${append}</div>`)
        }

    }
    
    return;

    let template = "roll";
    data.extratales = {};
    if (data.message.rolls.length) {
        let rollobj = Roll.fromJSON(data.message.rolls);
        console.log(rollobj);
        data.extratales.roll = rollobj;
        let instances = rollobj.instances ?? [];
        if (instances.length) {
            data.extratales.instances = instances;
            template = "instances";
        }
        else {
            template = "roll";
        }

    }
    else {
        template = "message";
    }

    
    data.pf2e = app.flags.pf2e;
    
    console.log(data);
    renderTemplate(`modules/pf2e-extraordinary-tales/templates/chat/${template}.hbs`, data).then(result => {
        html.html(result);

        html.on('click', 'button.full-damage', (ev) => {
            applyDamageFromMessage({
                message: data.message,
                multiplier: 1,
                addend: 0,
                promptModifier: ev.shiftKey,
                rollIndex: index,
            });
        })
    })
})

// Hooks.on('renderActorSheetPF2e', (app, html, data) => {
//     console.log("render actor sheet");
//     console.log(app, html, data);
// })

Hooks.on("createChatMessage", (msg, options, user) => {
    // console.log("create chat message", msg, options, user);
    if (msg.isAuthor) {
     
    } else {
        if (!game.user.isGM) {
            if (msg.data.whisper?.includes(game.user.id)) {
                if (msg.data.content.trim()) {
                    new Dialog({
                        title: "Information",
                        buttons: {},
                        content: `<div style="font-size:150%;user-select:all;">${msg.data.content}</div>`,
                    }).render(true);
                }
            }
        }
    }
});

Hooks.on('updateCombat', (a, b, c, d) => {
    if (!game.user.isGM) {
        return;
    }

    // console.log(a, b, c, d);
    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales','escalation') ?? 0);
    // console.log("UPDATE COMBAt")
    // console.log(game.combat.combatants);
    for (let c of game.combat.combatants) {
        // console.log(c);
        let t = canvas.tokens.get(c.tokenId);
        // console.log(t)
        // console.log(t.actor);
        let a = t.actor;
        if (a) {
            a.setFlag('pf2e-extraordinary-tales', 'escalation', esc)
        }
    }
})

Hooks.on('renderCombatTracker', (app, html, data) => {
    // console.log("render combat tracker")

    // console.log(app, html, data);

    if (!game.combat) {
        return;
    }

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales','escalation') ?? 0);

    let appendhtml = $(`<div class="flexrow" style="font-size:85%"><div>Escalation</div><div>${esc}</div><div><button type="button" data-action="escup">+</button></div><div><button type="button" data-action="escdown">-</button></div></div>`);

    appendhtml.on('click','button', (ev) => {
        if (!game.user.isGM) {
            return;
        }

        let act = ev.currentTarget.dataset.action;
        if (act == "escup") {
            game.combat.setFlag('pf2e-extraordinary-tales','escalation', esc + 1)
            ChatMessage.create( {
                content: `Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc + 1})`
            })
        }
        if (act == "escdown") {
            game.combat.setFlag('pf2e-extraordinary-tales','escalation', esc - 1)
            ChatMessage.create( {
                content: `Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc - 1})`
            })
        }
    })


    // let rendered = new ExtraTalesCombat().render();
    // console.log(rendered);
    html.find('.encounters').after(appendhtml)
})


/*
thoughts:
hero point reroll:
override the function in pf2e on the prototype?

spell counteract:
need to just add it in the tipster


spell attack:
same as above

exploration interface:
just need to do a pass on the html
change to hover over, click to add

ez ui exploration actions:
need to query the compendium and the macros n stuff

token overlay icons:
need to just get teh condition images in the template

strike info:
format the data into html

config:
set up some way to choose what to hide or show
have things check their status from the config
store the config in a user flag instead of settings

damage chat card:
on render chat message
replace some things with own template

damage adjustment window:
add right click menu option
create interface window
apply damage from there

prompt rolls from other players
look at how the one macro does it
socketlib to send the roll function
maybe the function just calls roll on own character?? yeah thats it

todo:

- more strike info (melee / ranged)

- ez ui: spell attack map
- token overlay: status icons
- ez ui: multiple tokens selected show common elements
- ez ui: filter content
- ez ui: headers
- ez ui: config via template??
- ez-ui: prompt roll from player
- ez ui: icons
- ez ui: prompt for exploration activites
- ez ui: open sheet to specific tab
- ez ui: scroll position on re-render
- template: tied to chat card
- template: tied to item
- damage: scuff damage
- damage: damage editor
- chat: replace dice and damage style
- chat: apply CF, F, S, CS effects from GM
- chat: reminder pins from GM
- chat: might not need mystify from pf2e workbench
- chat: damage application window
- chat: click to minimize card (hover minimized thing to see chat card)
- pf2e: heroic harmony effect
- pf2e: secret check easier
- sidebar: hover over actors for preview
- journal: investigate simultaneous editing
- macros: alternate macro list (disable hotbar)
- extra tales: track aid
- mystify names: unidentified, unknown, unfamiliar, monster, creature, etc

- Attemped, but difficult:
- pf2e: hero point keep the better result

- OK config: hide unwanted things
- OK chat: show reveal detail status
- OK ez ui: exploration actions
- OK exploration: better interface
- OK ez ui: spell attacks
- OK ez ui: spell counteract
- OK chat: malleable rolls (append note)
- OK ez ui: extra tales spending buttons
- OK extra tales: open up collateral prompt for all players when 1 is spent
- OK ez ui: passive abilities listed
- OK combat: show token icons
- OK combat: hover token sync
- OK combat: click to find token (gm)
- OK combat: controls for gm
- OK combat: end turn button
- OK extra tales: automatically approve when 0 collateral
- OK token magic: effects prompt (mass edit??)
- OK template: hover over for notes

*/