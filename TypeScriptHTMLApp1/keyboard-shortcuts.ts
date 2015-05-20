﻿// * show keyboard shortcuts
//   * Search shortcuts
//   * tag shortcuts
//   * collapse/show shortcut dialog
//   * optimize so it's only called once, not O(n) times -_-

class KeyboardShortcuts extends Backbone.View<TodoUiState> {
    normalShortcuts: ITemplate;
    editingShortcuts: ITemplate;
    tagShortcuts: ITemplate;

    initialize() {
        this.normalShortcuts = Util.getTemplate('normal-shortcuts');
        this.editingShortcuts = Util.getTemplate('editing-shortcuts');
        this.tagShortcuts = Util.getTemplate('tag-shortcuts');

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

        this.$el.html(keyboardShortcutTemplate());

        return this;
    }
}