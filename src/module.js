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
        "land speed": "fa-solid fa-person-running",
        "fly speed": "fa-solid fa-child-reaching",
        "burrow speed": "fa-solid fa-person-digging",
        "swim speed": "fa-solid fa-person-swimming",
        "climb speed": "fa-solid fa-person-hiking"
    }
    Handlebars.registerHelper("icon", (value) => {
        if (!value.toLowerCase)return value;
        if (icondata.hasOwnProperty(value.toLowerCase().trim())) {
            return `<i class="${icondata[value.toLowerCase().trim()]} fa-fw"></i>`;
        }
        return value;
    })

    Handlebars.registerHelper("dmg_component", (dmg, component) => {
        return dmg.componentTotal(component)
        
    })
    
    Handlebars.registerHelper("scuff_dmg", (msg) => {
        let total = 0;
        for(let i of msg.flags.pf2e.modifiers) {
            if (i.enabled && !i.ignored && i.kind == "modifier") {
                total += i.modifier
            }
        }
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
  
        let rerollhistory = message.getFlag("pf2e-extraordinary-tales", "rerollhistory") ?? [];

        let newroll = await new Roll("d20").roll({async: true})
        let roll = message.rolls[0];
        let die = roll.dice[0];
        die.results.push(newroll.dice[0].results[0]);

        die.results.filter((v, i, a) => i < a.length - 1).forEach(v => v.active = false)

        let r0 = die.results[die.results.length - 2]
        let r1 = die.results[die.results.length - 1]

        if (keep == "new") {
            r1.active = true;
        }
        if (keep == "best") {
            r1.active = r1.result > r0.result;
        }
        if (keep == "worst") {
            r1.active = r1.result < r0.result;
        }
        r0.active = !r1.active;

        if (heroPoint == true) {
            if (actor) {
                const heroPointCount = actor.heroPoints?.value ?? 0;
                if (heroPointCount) {
                    await actor.update({
                        "system.resources.heroPoints.value": Math.clamped(heroPointCount - 1, 0, 3),
                    });
                    ChatMessage.create({
                        content: `<i class="fa-solid fa-star"></i> Hero Points (${heroPointCount}) <i class="fa-solid fa-arrow-right"></i> (${heroPointCount - 1})`
                    })
                } else {
                    ui.notifications.warn(game.i18n.format("PF2E.RerollMenu.WarnNoHeroPoint", { name: actor.name }));
                    return;
                }
            } else {
                ui.notifications.error(game.i18n.localize("PF2E.RerollMenu.ErrorNoActor"));
                return;
            }
        }

        // console.log(message.rolls);

        roll._total = roll._evaluateTotal();
        // await game.dice3d.renderRolls(message, [newroll])
        console.log(message);
        game.dice3d.showForRoll(newroll, message.user, true, null, false, message.id, message.speaker);
        // await game.dice3d.waitFor3DAnimationByMessageID(message.id);
        await message.update({"rolls": duplicate(message.rolls)})
        await message.setFlag("pf2e", "context.isReroll", true);
        // await message.render();
    }

    if (game.user.character) {
        game.user.character.setFlag('pf2e-extraordinary-tales', 'personaluses', ExtraTalesCore.getUsagesFromXP(parseInt(game.user.character.getFlag('pf2e-extraordinary-tales', 'personalxp') ?? 0)))
        game.user.character.setFlag('pf2e-extraordinary-tales', 'collateraluses', ExtraTalesCore.getUsagesFromXP(parseInt(game.user.character.getFlag('pf2e-extraordinary-tales', 'collateralxp') ?? 0)))
    }

    new ExtraTalesEzUi().render(true);
})

Hooks.once("socketlib.ready", () => {
    ExtraTalesCore.socket = socketlib.registerModule("pf2e-extraordinary-tales");

    ExtraTalesCore.socket.register("promptCollateral", ExtraTalesCore.promptCollateralXP)
});

Hooks.on('getChatLogPF2eEntryContext', (obj, items) => {

    items.push({
        name: "Mark as Aid",
        icon: "<i class=\"fa-solid fa-handshake\"></i>",
        callback: li => {
            const message = game.messages.get(li.data("messageId"));
            new ExtraTalesAid(message).render(true)
        }
    },{
        name: "Reveal Details",
        icon: "<i class=\"fa-solid fa-clipboard\"></i>",
        condition: li => {
            return game.user.isGM;
        },
        callback: li => {
            if (!game.user.isGM) return;

            const message = game.messages.get(li.data("messageId"));
            let revealed = message.getFlag("pf2e-extraordinary-tales", "revealed") ?? false;
            let revealedto = message.getFlag("pf2e-extraordinary-tales", "revealedto") ?? [];

            let content = `<form>`;
            for(let u of game.users.filter(u => !u.isGM)) {
                let checked = revealedto.includes(u.id) ? "checked" : "";
                content += `<div class="form-group"><div style="flex: 0 0 2em"><input type="checkbox" name="${u.id}" ${checked}></div><label>${u.character.name} (${u.name}) </label></div>`
            }
            let allchecked = revealed ? "checked" : "";
            content += `<div class="form-group"><div style="flex: 0 0 2em"><input type="checkbox" name="all" ${allchecked}></div><label>All Players</label></div></form>`

            new Dialog({
                title: `Reveal Details`,
                content: content,
                render: html => {
                    html.on('change', '[type="checkbox"]', (ev) => {
                        if (ev.currentTarget.name == "all") {
                            revealed = ev.currentTarget.checked || false;
                        }
                        else {
                            if (ev.currentTarget.checked) {
                                revealedto.push(ev.currentTarget.name)
                            }
                            else {
                                revealedto = revealedto.filter(i => i != ev.currentTarget.name);
                            }
                        }
                    })
                },
                buttons: {
                    button1: {
                        label: "Save",
                        callback: async () => {
                            await message.setFlag("pf2e-extraordinary-tales", "revealed", revealed)
                            await message.setFlag("pf2e-extraordinary-tales", "revealedto", revealedto)
                        },
                        icon: `<i class="fas fa-check"></i>`
                        },
                    button2: {
                        label: "Cancel",
                        callback: () => { },
                        icon: `<i class="fas fa-times"></i>`
                    }
                }
            }).render(true);
        }
    })

    return items;
})

Hooks.on('renderCheckModifiersDialog', (app, html, data) => {
    html.find(".roll-mode-panel option[value=publicroll]").text("Public Roll to All");
    html.find(".roll-mode-panel option[value=gmroll]").text("Public Roll to Self and GM");
    html.find(".roll-mode-panel option[value=selfroll]").text("Test Roll to Self Only");
    html.find(".roll-mode-panel option[value=blindroll]").text("Secret Roll to GM");
})

Hooks.on('renderChatLogPF2e', (app, html, data) => {
    $(".roll-type-select option[value=publicroll]").text("Public Roll to All");
    $(".roll-type-select option[value=gmroll]").text("Public Roll to Self and GM");
    $(".roll-type-select option[value=selfroll]").text("Test Roll to Self Only");
    $(".roll-type-select option[value=blindroll]").text("Secret Roll to GM");

    html.on("click", "[data-outcome]", (ev) => {
        let outcome = ev.currentTarget.dataset.outcome;
        let msgid = $(ev.currentTarget).closest("[data-message-id]").data("messageId");
        let msg = game.messages.get(msgid);
        msg.setFlag("pf2e-extraordinary-tales", "outcome", outcome)
    })

    if (!game.user.isGM) {
        // The timeout is for other modules that mess with this html too
        setTimeout(() => {
                
            html.find(".control-buttons").before(`<div style="flex: 0"><a data-missive title="Message GM" data-tooltip="Send Message to GM"><i class="fas fa-comment"></i></a></div>`)

            html.on('click', '[data-missive]', (ev) => {
                let content = `<textarea style="min-height:20em" autofocus></textarea>`
                let whisper = "";
                new Dialog({
                    title: `Send Message to GM`,
                    content: content,
                    render: html => {
                        html.on('input', 'textarea', (ev) => {
                            whisper = ev.currentTarget.value;
                        })
                    },
                    buttons: {
                        button1: {
                            label: "Send",
                            callback: () => {
                                ChatMessage.create(
                                    {
                                        flavor: "",
                                        speaker: { alias: `To GM (${game.user.name})` },
                                        flags: {
                                            "core.canPopout": true,
                                        },
                                        user: game.user.id,
                                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                                        content: whisper,
                                        whisper: [game.users.find(i => i.isGM).id],
                                    }
                                )
                            },
                            icon: `<i class="fas fa-check"></i>`
                            },
                        button2: {
                            label: "Cancel",
                            callback: () => { },
                            icon: `<i class="fas fa-times"></i>`
                        }
                    }
                }).render(true);
            })
        }, 500);
    }
})

Hooks.on('chatMessage', (obj, message, data) => {
    let cancel = false;

    // todo: if GM, dont speak as PC ever

    let speaker = ChatMessage.getSpeaker();

    if (speaker.actor) {

    }

    

    try {
        if (Roll.validate(message)) {
            let r = new Roll(message)
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

Hooks.on("updateToken", (a, b, c, d) => {
    // console.log("=== update token", a, b, c, d)
    if (a.overlayEffect) {
        a.update({overlayEffect: ""})
    }
})

Hooks.on(`renderChatMessage`, async (obj, html, data) => {

    let actor = obj.token?.actor ?? obj.actor ?? false;

    if (game.user.isGM)
    console.log(obj)

    let etconfig = game.user.getFlag("pf2e-extraordinary-tales", "config") ?? {};
    if (!etconfig.chat?.defaultCards && obj.rolls?.length) {
        
        

        let rendered = await renderTemplate("modules/pf2e-extraordinary-tales/templates/roll-card.hbs", obj)
        html.find(".dice-roll").html(rendered)
    }

    // stop the "privately rolled some dice" message
    // does anyone actually like that?
    // i feel like it's always the first thing that people remove
    // usually with like, "actually private rolls" or whatever
    html.find('.flavor-text').html(await TextEditor.enrichHTML(obj.flavor, {async: true}));


    let revealState = obj.getFlag("pf2e-extraordinary-tales", "revealed") ?? false;



    if (!obj.user.isGM) {
        // messages not created by GM are never unrevealed
        revealState = true;
    }
    if (!html.find('.card-content').length) {
        // messages that are not chat info cards are never unrevealed
        revealState = true;
    }
    
    let reveal = revealState;

    if(game.user.id !== data.author.id && data.message.whisper.length === 1 && data.message.whisper.indexOf(data.author.id) === 0) {
        //Hide Self Rolls
        reveal = false;
        revealState = false;
        html.hide();
    }
    else if (actor) {
        if (game.users.filter(i => i.character && i.character.id == actor.id).length) {
            reveal = true;
            revealState = true;
        }
        if (actor.testUserPermission(game.user, 2)) {
            reveal = true;
        }
        let revealedto = obj.getFlag("pf2e-extraordinary-tales", "revealedto") ?? [];
        if (revealedto.includes(game.user.id)) {
            reveal = true;
        }

    }
    else {
        reveal = true;
        revealState = true;
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

    // note: show tokens of players that can see it
    // reveal for specific people, add a list of allowed user ids
    // 

    if (game.user.isGM) {
        if (!revealState) {
            html.append(`<div style="background:#0002;padding:0.25em;margin:0.25em;text-align:center;font-weight:bold;text-transform:uppercase">Content hidden</div>`);
            let revealedto = obj.getFlag("pf2e-extraordinary-tales", "revealedto") ?? [];
            for(let u of revealedto) {
                let user = game.users.get(u);
                html.append(`<div style="background:#0002;padding:0.25em;margin:0.25em;text-align:center;text-transform:uppercase;font-size:80%">Revealed to ${user.character.name}</div>`);

                // if (game.user.id == u) {

                // }
            }
        }
    }

    if (game.user.isGM ) {

        let $content = html.find('.message-content');
        $content.append(`<div class="hover-reveal hover-gold" style="font-size:85%;line-height:1;padding:0.25em;position:absolute;top:-0.75em;right:0.25em;background:#333;color:#ddd;font-weight:bold;border-radius:3px">
        <div data-outcome="cf" data-tooltip="Critical Failure" style="width:1.25em;text-align:center;display:inline-block">CF</div>
        <div data-outcome="f" data-tooltip="Failure" style="width:1.25em;text-align:center;display:inline-block">F</div>
        <div data-outcome="" data-tooltip="Remove Outcome" style="width:1.25em;text-align:center;display:inline-block">&times;</div>
        <div data-outcome="s" data-tooltip="Success" style="width:1.25em;text-align:center;display:inline-block">S</div>
        <div data-outcome="cs" data-tooltip="Critical Success" style="width:1.25em;text-align:center;display:inline-block">CS</div>
        </div>`)
        $content.addClass("hover-reveal-container");
        $content.css("position", "relative");

    }

    let aid = obj.getFlag('pf2e-extraordinary-tales','aid') ?? false;

    if (aid !== false) {
        let append = ``;
        for(let k in aid) {
            if (aid[k]) {
                let actor = game.actors.get(k);
                append += `<div style="display:flex;align-items:center;gap:0.25em"><img style="max-height:1.25em;max-width:1.25em" src="${actor.prototypeToken.texture.src}"/> Aiding <strong>${actor.name}</strong></div>`;
            }
        }
        if (append) {
            html.append(`<div style="background:#0002;padding:0.25em;margin:0.25em;text-transform:uppercase">${append}</div>`)
        }
    }

    let outcome = obj.getFlag('pf2e-extraordinary-tales','outcome') ?? false;

  

    if (!obj.isContentVisible || obj.blind) {
        // html.find('[data-info]').css("outline", "#ccc 2px solid")
        if (!game.user.isGM ) {
            html.find('[data-info]').html(`<span>?</span>`)
            html.find('.inline-roll').after(`<span style="background:#555;color:#eee;outline:#555 2px solid;"> <i class="fa-solid fa-dice-d20 fa-sm fa-fw"></i>&nbsp; ? &nbsp;</span>`)
            html.find('.inline-roll').remove();
            html.find('[data-dice-style]').removeAttr('style')
        }
        html.find('[data-total]').css("background", "#0002")
        html.find('[data-info]').css("color", "#eee")
        html.find('[data-info]').css("text-shadow", "0 0 3px #000,0 0 3px #000,0 0 3px #000")
        
    }
    if (obj.isContentVisible || game.user.isGM) {
        if (outcome) {
            let outcometext = "";
            if (outcome == "s") outcometext = "Success";
            if (outcome == "cs") outcometext = "Critical Success";
            if (outcome == "f") outcometext = "Failure";
            if (outcome == "cf") outcometext = "Critical Failure";
            html.append(`<div style="background:#0002;padding:0.25em;margin:0.25em;text-align:center;font-weight:bold;text-transform:uppercase"><span style="opacity:0.9">${outcometext}</span></div>`)

            html.css("position", "relative");
            if (outcome == "s") {
                html.append(`<div style="mix-blend-mode:overlay;inset:0;background:#08da;box-shadow:inset 0 0 20px 5px #0f08, inset 0 0 5px 0 #0f0;z-index:5;position:absolute;pointer-events:none"></div>`)
            }
            if (outcome == "cs") {
                html.append(`<div style="mix-blend-mode:overlay;inset:0;background:#0efd;box-shadow:inset 0 0 20px 5px #00f8, inset 0 0 5px 0 #0ff;z-index:5;position:absolute;pointer-events:none"></div>`)
            }
            if (outcome == "f") {
                html.append(`<div style="mix-blend-mode:multiply;inset:0;background:#2224;box-shadow:inset 0 0 10px 5px #0008, inset 0 0 5px 0 #000;z-index:5;position:absolute;pointer-events:none"></div>`)
            }
            if (outcome == "cf") {
                html.append(`<div style="mix-blend-mode:multiply;inset:0;background:#6106;box-shadow:inset 0 0 20px 5px #400, inset 0 0 5px 0 #800;z-index:5;position:absolute;pointer-events:none"></div>`)
            }
        }
    }

    if (!obj.isContentVisible || obj.whisper.length) {
        html.css("position", "relative");
        html.append(`<div style="inset:0;background:#0002;z-index:7;position:absolute;pointer-events:none"></div>`)
        html.append(`<div style="inset:0;box-shadow: inset 0 0 12px 2px #8888, inset 0 0 2px 0 #888;z-index:10;position:absolute;pointer-events:none"></div>`)
    }

    
    
    return;

})

Hooks.on("createChatMessage", (msg, options, user) => {
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

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales','escalation') ?? 0);
    for (let c of game.combat.combatants) {
        let t = canvas.tokens.get(c.tokenId);
        let a = t.actor;
        if (a) {
            a.setFlag('pf2e-extraordinary-tales', 'escalation', esc)
        }
    }
})

Hooks.on('renderCombatTracker', (app, html, data) => {

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


    html.find('.encounters').after(appendhtml)
})


/*
thoughts:
scuff damage:
use the chat message data "_strike" "_strike.item"
npc use ability score for damage + damage dice count
hefty: use base damage
wimpy: use ability score

todo:
- reroll not showing
- prevent attack roll without target
- test sequencer video
- include scuff damage on attack rolls
- format chat card with single check
- EH recall knwoledge bug 


- reroll as secret menu item
- set to public menu item

- calculate scuff damage
- revise recall knwoledge macro to own thing
- add indication to roll when rerolled with hero point

- editing rolls
- adjust damage instance with simple plus or minus
- extra tales: track aid

- roll attack damages from ez ui
- show "spell" when ability is spell
- ez ui: spell attack map
- fix modifiers in skill roll preview
- add rules text about skill in hover skill ez ui
- format chat for @Check or whatever
- reposition ez ui by dragging
- more strike info (melee / ranged)
- chat: type thing from ez ui to roll it
- hide roll notes by default, click to expand
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
- chat: reminder pins from GM
- chat: damage application window
- sidebar: hover over actors for preview
- journal: investigate simultaneous editing

- OK collateral prompt fixed
- OK too many modifiers were showing
- OK make GM whispers more obvious
- OK fix token hover errors
- OK put HP back into token overlay
- OK style footer aid and other stuff
- OK chat: apply CF, F, S, CS effects from GM
- OK rename dropdown roll modes menu
- OK send GM secret message button
- OK token overlay: status icons
- OK fix climb icon
- OK reveal chat cards to specific players
- OK remove giant skull from dead condition
- OK fix hero point reroll not showing 3d dice for all players
- OK separate precision damage
- OK adjust roll with simple plus or minus
- OK fix secret rolls speaker info being replaced
- OK add token to add chat message
- OK format secret rolls more
- OK style chat tags
- OK add token to aid ui

- OK chat: might not need mystify from pf2e workbench
- OK pf2e: hero point keep the better result
- OK chat: replace dice and damage style
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