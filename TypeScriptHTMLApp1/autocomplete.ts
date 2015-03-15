class AutocompleteItem extends Backbone.Model {
    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }

    get desc(): string { return this.get('desc'); }
    set desc(value: string) { this.set('desc', value); }

    get matchFoundIn(): string { return this.get('matchFoundIn'); }
    set matchFoundIn(value: string) { this.set('matchFoundIn', value); }

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

        this.addTextSearchSection();
    }

    addTextSearchSection(): void {
        var allTodos = _.filter(this.baseTodo.flatten(), m => m.inSearchResults);

        var matchItem = new AutocompleteItem({
            name: allTodos[0].name,
            desc: allTodos[0].content,
            matchFoundIn: "name",
            startPosition: 4,
            endPosition: 8
        });

        var section = new AutocompleteSection({
            headingName: "Matches by text",
            items: new AutocompleteSectionItems([matchItem])
        });
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

        result.add(new AutocompleteSection({
            headingName: 'test',
            items: new AutocompleteSectionItems([
                new AutocompleteItem({ name: "item 1" }),
                new AutocompleteItem({ name: "item 2" })
            ])
        }));

        console.log(result.toJSON());

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
