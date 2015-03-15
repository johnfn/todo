class AutocompleteItem extends Backbone.Model {
    get todo(): TodoModel { return this.get('todo'); }
    set todo(value: TodoModel) { this.set('todo', value); }

    get typeOfMatch(): string { return this.get('typeOfMatch'); }
    set typeOfMatch(value: string) { this.set('typeOfMatch', value); }

    get startPosition(): number { return this.get('startPosition'); }
    set startPosition(value: number) { this.set('startPosition', value); }

    get endPosition(): number { return this.get('endPosition'); }
    set endPosition(value: number) { this.set('endPosition', value); }
}

class AutocompleteSectionItems extends Backbone.Collection<AutocompleteItem> {

}

/** A header + the items under that header, in the autocomplete. */
class AutocompleteSection extends Backbone.Model {
    get headingName(): string { return this.get('headingName'); }
    set headingName(value: string) { this.set('headingName', value); }

    get items(): AutocompleteSectionItems { return this.get('items'); }
    set items(value: AutocompleteSectionItems) { this.set('items', value); }

    initialize(attrs?: any) {
        this.items = this.items || new AutocompleteSectionItems();
        this.headingName = this.headingName || "Unnamed section TODO";
    }
}

class AutocompleteSectionView extends Backbone.View<AutocompleteSection> {
    template: ITemplate;

    initialize(attrs?: any) {
        this.template = Util.getTemplate('autocomplete-section');
    }

    render(): AutocompleteSectionView {
        this.$el.html(this.template({
            section: this.model.toJSON(),
            items: this.model.items.toJSON()
        }));

        return this;
    }
}

/** The *entire* autocomplete result - currently just composed of many 
    sections. */
class AutocompleteResult extends Backbone.Collection<AutocompleteSection> {
    appModel: TodoAppModel;
    baseTodo: TodoModel;

    initialize(models: AutocompleteSection[], opts?: any) {
        this.appModel = opts['appModel'];
        this.baseTodo = this.appModel.baseTodoModel;
    }

    compileSearch() {
        this.addTextSearchSection();
    }

    addTextSearchSection(): void {
        var search = this.appModel.searchText;
        var allTodos = _.filter(this.baseTodo.flatten(), m => m.inSearchResults);
        var matches: AutocompleteItem[] = [];

        for (var i = 0; i < allTodos.length; i++) {
            var currentTodo = allTodos[i];
            var typeOfMatch = "name";

            // First try name...
            var matchPosition = currentTodo.name.toLowerCase().indexOf(search.toLowerCase());

            // Then try content...
            if (matchPosition === -1) {
                matchPosition = currentTodo.content.toLowerCase().indexOf(search.toLowerCase());
                typeOfMatch = "content";
            }

            if (matchPosition === -1) {
                continue;
            }

            matches.push(new AutocompleteItem({
                todo: currentTodo,
                typeOfMatch: typeOfMatch,
                startPosition: matchPosition,
                endPosition: matchPosition + search.length
            }));
        }

        this.add(new AutocompleteSection({
            headingName: "Matches by text",
            items: new AutocompleteSectionItems(matches)
        }));
    }
}

class AutocompleteView extends Backbone.View<TodoAppModel> {
    template: ITemplate;

    initialize(attrs?: any) {
        this.template = Util.getTemplate('autocomplete');

        this.listenTo(this.model, 'change:searchText', () => {
            this.render(this.model.searchText);
        });
    }

    getAutocompleteResult(): AutocompleteResult {
        var result = new AutocompleteResult([], { appModel: this.model });

        result.compileSearch();

        return result;
    }

    render(text: string = ""): AutocompleteView {
        var typedAnything = text != "";
        var self = this;

        this.$el.toggle(typedAnything);
        if (!typedAnything) return;

        var ar = this.getAutocompleteResult();

        this.$el.html(this.template());
        ar.each(m => {
            var section = new AutocompleteSectionView({
                el: $('<div>').appendTo(this.$('.autocomplete')),
                model: m
            }).render();
        });

        return this;
    }
}
