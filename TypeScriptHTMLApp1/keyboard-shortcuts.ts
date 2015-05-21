// * show keyboard shortcuts
//   * Search shortcuts
//   * tag shortcuts
//   * collapse/show shortcut dialog
//   * optimize so it's only called once, not O(n) times -_-
//   * 'See all items' shortcuts (dont think there are any, but say something...)

class KeyboardShortcuts extends Backbone.View<TodoUiState> {
    normalShortcuts: ITemplate;
    editingShortcuts: ITemplate;
    tagShortcuts: ITemplate;

    shortcutTop: ITemplate;

    initialize() {
        this.normalShortcuts = Util.getTemplate('normal-shortcuts');
        this.editingShortcuts = Util.getTemplate('editing-shortcuts');
        this.tagShortcuts = Util.getTemplate('tag-shortcuts');

        this.shortcutTop = Util.getTemplate('keyboard-shortcuts-top')

        this.setElement($('.shortcuts-js'));
    }

    setModel(model: TodoUiState) {
        this.model = model;

        this.listenTo(this.model, 'change', this.render);
    }

    render() {
        var keyboardShortcutTemplate: ITemplate;

        if (this.model.view.tagList.currentlyEditing()) {
            keyboardShortcutTemplate = this.tagShortcuts;
        } else if (this.model.isEditing) {
            keyboardShortcutTemplate = this.editingShortcuts;
        } else {
            keyboardShortcutTemplate = this.normalShortcuts;
        }

        $('.top').html(this.shortcutTop());

        this.$el.html(keyboardShortcutTemplate());

        return this;
    }
}