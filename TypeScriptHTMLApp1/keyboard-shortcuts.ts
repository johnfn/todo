class KeyboardShortcuts extends Backbone.View<TodoUiState> {
    normalShortcuts: Template;
    editingShortcuts: Template;

    initialize() {
        this.normalShortcuts = Util.getTemplate("normal-shortcuts");
        this.editingShortcuts = Util.getTemplate("editing-shortcuts");

        this.setElement($(".shortcuts-js"));
    }

    setModel(model: TodoUiState) {
        this.model = model;

        this.listenTo(this.model, 'change', this.render);
    }

    render() {
        var keyboardShortcutTemplate: Template;

        if (this.model.addTodoVisible ||
            this.model.editingContent ||
            this.model.editingName) {
            keyboardShortcutTemplate = this.editingShortcuts;
        } else {
            keyboardShortcutTemplate = this.normalShortcuts;
        }

        this.$el.html(keyboardShortcutTemplate());

        return this;
    }
}