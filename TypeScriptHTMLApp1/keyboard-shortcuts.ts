class KeyboardShortcuts extends Backbone.View<TodoUiState> {
    normalShortcuts: ITemplate;
    editingShortcuts: ITemplate;

    initialize() {
        this.normalShortcuts = Util.getTemplate('normal-shortcuts');
        this.editingShortcuts = Util.getTemplate('editing-shortcuts');

        debugger;

        this.setElement($('.shortcuts-js'));
    }

    setModel(model: TodoUiState) {
        this.model = model;

        this.listenTo(this.model, 'change', this.render);
    }

    render() {
        var keyboardShortcutTemplate: ITemplate;

        if (this.model.isEditing) {
            keyboardShortcutTemplate = this.editingShortcuts;
        } else {
            keyboardShortcutTemplate = this.normalShortcuts;
        }

        this.$el.html(keyboardShortcutTemplate());

        return this;
    }
}