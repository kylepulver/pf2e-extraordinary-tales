export default class ExtraTalesTemplateOverlay extends BasePlaceableHUD {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "template-overlay",
            template: "modules/pf2e-extraordinary-tales/templates/template-overlay.hbs",
        });
    }

    getData() {
        const data = super.getData();

        if (this.object?.data) {
            console.log(this.object.data.getFlag("pf2e", "origin"));
            data.note = this.object.data.getFlag("pf2e", "origin")?.name ?? "";
        }

        return data;
    }

    setPosition() {
        if (!this.object) return;

        let fontsize = (1 / canvas.stage.scale._x) * 0.8 + 0.25 + "em";

        const position = {
            width: 100,
            height: 100,
            left: this.object.x,
            top: this.object.y,
            "font-size": fontsize,
        };
        this.element.css(position);
    }
}