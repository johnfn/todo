class KeyboardShortcuts extends Backbone.View<TodoUiState> {
    normalShortcuts: Template;

    initialize() {
        this.normalShortcuts = Util.getTemplate("normal-shortcuts");
        this.setElement($(".shortcuts-js"));
    }

    setModel(model: TodoUiState) {
        this.model = model;

        this.listenTo(this.model, 'change', this.render);
    }

    render() {
        this.$el.html(this.normalShortcuts());

        return this;
    }
}