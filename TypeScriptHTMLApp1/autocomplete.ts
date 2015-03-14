class AutocompleteItem extends Backbone.Model {
    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }
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
        this.$el.html(this.template(this.model.toJSON()));

        return this;
    }
}

/** The *entire* autocomplete result - currently just composed of many 
    sections. */
class AutocompleteResult extends Backbone.Collection<AutocompleteSection> {
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
        var result = new AutocompleteResult();

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
