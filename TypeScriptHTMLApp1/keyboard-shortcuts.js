var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var KeyboardShortcuts = (function (_super) {
    __extends(KeyboardShortcuts, _super);
    function KeyboardShortcuts() {
        _super.apply(this, arguments);
    }
    KeyboardShortcuts.prototype.initialize = function () {
        this.normalShortcuts = Util.getTemplate("normal-shortcuts");
        this.editingShortcuts = Util.getTemplate("editing-shortcuts");
        this.setElement($(".shortcuts-js"));
    };
    KeyboardShortcuts.prototype.setModel = function (model) {
        this.model = model;
        this.listenTo(this.model, 'change', this.render);
    };
    KeyboardShortcuts.prototype.render = function () {
        var keyboardShortcutTemplate;
        if (this.model.addTodoVisible || this.model.editingContent || this.model.editingName) {
            keyboardShortcutTemplate = this.editingShortcuts;
        }
        else {
            keyboardShortcutTemplate = this.normalShortcuts;
        }
        this.$el.html(keyboardShortcutTemplate());
        return this;
    };
    return KeyboardShortcuts;
})(Backbone.View);
//# sourceMappingURL=keyboard-shortcuts.js.map