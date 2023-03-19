export default class ExtraTalesTokenOverlay extends BasePlaceableHUD {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "token-overlay",
            template: "modules/pf2e-extraordinary-tales/templates/token-overlay.hbs",
        });
    }

    getData() {
        const data = super.getData();

        // data.showTokenOverlay = game.settings.get("pf2ez", "tokenOverlay") ?? true;
        data.showTokenOverlay = true;

        data.show = {
            estimate: false,
            defense: false,
            skills: false,
            any: true,
        };
        data.estimate = "";
        data.health = "#fff8";
        data.token = this.object;
        // console.log(this.object);

        if (this.object?.actor) {
            // let actordata = this.object.actor.data.toObject(false).data;

            // if (actordata) {
                data.actor = this.object.actor;
                // data.actordata = actordata;
                // console.log(data.actordata, data.actor);

                if (data.actor.attributes.hp?.max && data.actor.attributes.hp.value) {
                    data.show.estimate = true;
                    data.estimate = "Unharmed";
                    let hptotal = data.actor.attributes.hp.value + data.actor.attributes.hp.temp ?? 0;
                    let perc = hptotal / data.actor.attributes.hp.max;
                    perc *= 100; // just for my own sanity
                    if (hptotal < data.actor.attributes.hp.max) {
                        data.estimate = "Scratched";
                        data.health = "#ffff";
                    }
                    if (perc < 99) {
                        data.health = "#ffdf";
                    }
                    if (perc < 90) {
                        data.estimate = "Injured";
                        data.health = "#ff8f";
                    }
                    if (perc < 80) {
                        data.health = "#ff0f";
                    }
                    if (perc < 70) {
                        data.health = "#fc0f";
                    }
                    if (perc < 60) {
                        data.health = "#fa0f";
                    }
                    if (perc < 50) {
                        data.estimate = "Bloodied";
                        data.health = "#f80f";
                    }
                    if (perc < 40) {
                        data.health = "#f60f";
                    }
                    if (perc < 30) {
                        data.health = "#f40f";
                    }
                    if (perc < 25) {
                        data.estimate = "Ragged";
                    }
                    if (perc < 20) {
                        data.health = "#f20f";
                    }
                    if (perc < 10) {
                        data.health = "#f00f";
                    }
                    if (perc < 5 || hptotal < 10) {
                        data.estimate = "Morbid";
                        data.health = "#e03f";
                    }
                    if (hptotal == 1) {
                        data.health = "#d06f";
                    }
                    if (hptotal <= 0) {
                        data.estimate = "";
                    }
                }


                if (this.object.document.disposition == 1) {
                    data.show.estimate = true;
                    data.show.defense = true;
                }

                if (game.user.isGM) {
                    data.show.estimate = true;
                    data.show.defense = true;
                    data.show.skills = true;
                    // data.notes = this.object.data?.flags?.pf2ez?.notes;
                    // data.notes = "";
                }

            // }

            data.effects = [];
            for(let i of this.object.actor.conditions.values()) {
                data.effects.push(i)
            }
        }

        if (data.showTokenOverlay === false) {
            data.show.any = false;
        }

        if (data.show.any) {
            if (!data.show.defense) if (!data.effects?.length)
            data.show.any = false;
        }

        const getTokenDistance = function (src, t) {
            let ray, segments;
            let unit = game.scenes.get(game.user.viewedScene).grid.units;
            let type = game.scenes.get(game.user.viewedScene).grid.type;
            let elevation = src?.document?.elevation ?? 0;
            let dist = Infinity;

            if (type == 0) {
                return "";
            }

            for (let tw = 0; tw < t.document.width; tw++) {
                for (let th = 0; th < t.document.height; th++) {
                    let pos = {
                        x: t.x + tw * canvas.grid.size,
                        y: t.y + th * canvas.grid.size,
                    };

                    // need to account for src size as well!!
                    for (let tws = 0; tws < src.document.width; tws++) {
                        for (let ths = 0; ths < src.document.height; ths++) {
                            let srcpos = {
                                x: src.x + tws * canvas.grid.size,
                                y: src.y + ths * canvas.grid.size,
                            };
                            ray = new Ray(srcpos, pos);
                            segments = [{ ray }];
                            dist = Math.min(dist, canvas.grid.measureDistances(segments, { gridSpaces: true })[0]);
                        }
                    }
                }
            }

            let elevationoffseta = Math.min(src.document.width, src.document.height);
            let elevationoffsetb = Math.min(t.document.width, t.document.height);
            let height = Infinity;

            for (let ta = 0; ta < elevationoffseta; ta++) {
                for (let tb = 0; tb < elevationoffsetb; tb++) {
                    let taelevation = ta * canvas.dimensions.distance + elevation;
                    let tbelevation = tb * canvas.dimensions.distance + t.document.elevation;

                    let elevationpixelsa = (taelevation / canvas.dimensions.distance) * canvas.grid.size;
                    let elevationpixelsb = (tbelevation / canvas.dimensions.distance) * canvas.grid.size;

                    let distpixels = (dist / canvas.dimensions.distance) * canvas.grid.size;

                    ray = new Ray({ x: 0, y: elevationpixelsa }, { x: distpixels, y: elevationpixelsb });
                    segments = [{ ray }];
                    height = Math.min(height, canvas.grid.measureDistances(segments, { gridSpaces: true })[0]);
                }
            }
            dist = Math.max(dist, height);

            if (dist <= 5) return ``;

            return `${dist}${unit}`;
        };

        // if single controlled token currently
        // get distance from controlled token
        let distsrc;
        if (canvas.tokens.controlled.length == 1) {
            distsrc = canvas.tokens.controlled?.shift();
        }
        if (!distsrc) {
            distsrc = game.user.character?.getActiveTokens().shift();
        }
        if (distsrc) {
            data.distance = getTokenDistance(distsrc, this.object);
        }

        data.left = 0;
        if (this.object?.hasActiveHUD) {
            data.left = 50;
        }

        return data;
    }

    setPosition() {
        if (!this.object) return;

        let fontsize = (1 / canvas.stage.scale._x) * 0.8 + 0.25 + "em";

        const position = {
            width: this.object.w,
            height: this.object.h,
            left: this.object.x,
            top: this.object.y,
            "font-size": fontsize,
        };
        this.element.css(position);
    }
}
