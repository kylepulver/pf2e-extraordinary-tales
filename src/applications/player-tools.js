// use canvas.activateLayer("name") to activate layers
// only need tokens, ruler, template cone, template circle really
export default class PlayerTools extends Application {
    constructor() {
        super();

        // this needs to be updated a lot to work in foundry 11
        return;

        Hooks.on("renderSceneControls", (app, html, data) => {
            // console.log(app, html, data);
            // console.log(this.render());
            let setting = game.settings.get("pf2e-extraordinary-tales", "simplePlayerControls") ?? true;
            if (!game.user.isGM && setting) {
                html.hide();
                this.render(true);
            }
        });
    }

    get title() {
        return "PlayerTools";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "extratales-player-tools",
            classes: [],
            template: "modules/pf2e-extraordinary-tales/templates/apps/player-tools.hbs",
            width: "auto",
            // scrollY: [".scroll-bar-a"],
            height: "auto",
            popOut: false,
        });
    }

    async getData() {
        const data = super.getData();

        if (canvas.ready) {
            data.controls = [];

            data.controls.push(
                {
                    name: "token",
                    control: "token",
                    layer: "tokens",
                    tool: "select",
                    icon: "fas fa-user-circle",
                },
                {
                    name: "target",
                    control: "token",
                    layer: "tokens",
                    tool: "target",
                    icon: "fas fa-bullseye",
                },
                {
                    name: "ruler",
                    control: "token",
                    layer: "tokens",
                    tool: "ruler",
                    icon: "fas fa-ruler",
                },
                {
                    name: "circle",
                    control: "measure",
                    layer: "templates",
                    tool: "circle",
                    icon: "far fa-circle",
                },
                {
                    name: "cone",
                    control: "measure",
                    layer: "templates",
                    tool: "cone",
                    icon: "fas fa-angle-left",
                },
                {
                    name: "box",
                    control: "measure",
                    layer: "templates",
                    icon: "far fa-square",
                    tool: "rect",
                },
                {
                    name: "line",
                    control: "measure",
                    layer: "templates",
                    tool: "ray",
                    icon: "fas fa-arrows-alt-v",
                },
                {
                    name: "sheet",
                    onClick: () => game.user.character.sheet.render(true),
                    icon: "fas fa-file-user",
                },
                {
                    name: "combat",
                    onClick: () => ui.combat.renderPopout(),
                    icon: "fas fa-swords",
                },
                {
                    name: "recenter",
                    onClick: () => {
                        let t = game.user.character.getActiveTokens();
                        if (t?.length) {
                            t = t.shift();
                            canvas.animatePan({ x: t.center.x, y: t.center.y, scale: 1 });
                        } else {
                            ui.notifications.warn("No active token found in this scene.");
                        }
                    },
                    icon: "fas fa-face-viewfinder",
                },
                {
                    name: "actors",
                    onClick: () => ui.actors.renderPopout(),
                    icon: "fas fa-users",
                },
                {
                    name: "items",
                    onClick: () => ui.items.renderPopout(),
                    icon: "fas fa-backpack",
                },
                {
                    name: "journals",
                    onClick: () => ui.journal.renderPopout(),
                    icon: "fas fa-book",
                }
            );

            let c;
            if ((c = ui.controls.controls.find(i => i.name === "token").tools.find(i => i.name === "calendar"))) {
                data.controls.push({
                    name: "calendar",
                    onClick: SimpleCalendar.show,
                    icon: "fas fa-calendar",
                });
            }

            data.controls.push(
                {
                    name: "settings",
                    onClick: () => game.settings.sheet.render(true),
                    icon: "far fa-cogs",
                },
                {
                    name: game.user.name,
                    onClick: () => game.user.sheet.render(true),
                    icon: "far fa-user",
                }
            );

            for (let c of data.controls) {
                if (c.control == ui.controls.activeControl) {
                    if (c.tool == ui.controls.activeTool) {
                        c.active = true;
                    }
                }
            }

            this._controls = data.controls;
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find("[data-tip]").tooltipster({
            functionBefore: function(instance, helper) {
                instance.content(helper.origin.dataset.tip)
            },
            contentAsHTML: false,
            animationDuration:50,
            delay: 50,
            interactive:false,
            position: "right",
            distance: 20,
            arrow: false,
            updateAnimation:null
        })

        html.find("[data-action]").click(async ev => {
            let action = ev.currentTarget.dataset.action;
            let split = ev.currentTarget.dataset.action.split(";");
            action = split.shift();
            let params = split;

            if (action == "use") {
                if (!canvas.ready) return;
                let control = this._controls[parseInt(params[0])];

                if (!!control.onClick) {
                    control.onClick();
                    return;
                }
                canvas[control.layer].activate();

                // console.log(control);

                ui.controls.#control = control.control;
                ui.controls.#control.activeTool = control.tool;
                ui.controls.render(true);
            }
        });
    }
}
