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
        this.normalShortcuts = Util.getTemplate('normal-shortcuts');
        this.editingShortcuts = Util.getTemplate('editing-shortcuts');
        this.tagShortcuts = Util.getTemplate('tag-shortcuts');
        this.shortcutTop = Util.getTemplate('keyboard-shortcuts-top');
        this.setElement($('.shortcuts-js'));
    };
    KeyboardShortcuts.prototype.setModel = function (model) {
        this.model = model;
        this.listenTo(this.model, 'change', this.render);
    };
    KeyboardShortcuts.prototype.render = function () {
        var keyboardShortcutTemplate;
        if (this.model.view.tagList.currentlyEditing()) {
            keyboardShortcutTemplate = this.tagShortcuts;
        }
        else if (this.model.isEditing) {
            keyboardShortcutTemplate = this.editingShortcuts;
        }
        else {
            keyboardShortcutTemplate = this.normalShortcuts;
        }
        $('.top').html(this.shortcutTop());
        this.$el.html(keyboardShortcutTemplate());
        return this;
    };
    return KeyboardShortcuts;
})(Backbone.View);
