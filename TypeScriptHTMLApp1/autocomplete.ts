class AutocompleteItem extends VaguelyMagicalModel {
    constructor(todo: TodoModel, type: string, startPosition: number, endPosition: number, subtypeOfMatch: number = -1) {
        super();

        this.todo = todo;
        this.typeOfMatch = type;
        this.subtypeOfMatch = subtypeOfMatch;

        this.startPosition = startPosition;
        this.endPosition = endPosition;

        if (type === "name") {
            this.matchedString = this.todo.name;
        } else if (type === "content") {
            this.matchedString = this.todo.content;
        } else if (type === "tag") {
            this.matchedString = this.todo.tags.at(subtypeOfMatch).name;
        }

        this.truncateMatchIfNecessary();
    }

    private truncateMatchIfNecessary() {
        var matchedLength = this.endPosition - this.startPosition;

        if (this.matchedString.length < 50)
            return;

        var middle = this.startPosition + Math.floor(matchedLength / 2);
        var start = Math.max(middle - 25, 0);
        var end = middle + 25;
        var startWasTruncated = start > 0;
        var endWasTruncated = end < this.matchedString.length;

        this.startPosition -= start - (startWasTruncated ? 3 : 0);
        this.endPosition -= start - (startWasTruncated ? 3 : 0);

        this.matchedString = (startWasTruncated ? "..." : "") +
                             this.matchedString.substring(start, end) +
                             (endWasTruncated ? "..." : "");
    }

    get todo(): TodoModel { return this.get('todo'); }
    set todo(value: TodoModel) {
        this.set('todo', value);
    }

    get startOfMatchString(): string {
        return this.matchedString.substring(0, this.startPosition);
    }

    get middleOfMatchString(): string {
        return this.matchedString.substring(this.startPosition, this.endPosition);
    }

    get endOfMatchString(): string {
        return this.matchedString.substring(this.endPosition);
    }

    get typeOfMatch(): string { return this.get('typeOfMatch'); }
    set typeOfMatch(value: string) { this.set('typeOfMatch', value); }

    get subtypeOfMatch(): number { return this.get('subtypeOfMatch'); }
    set subtypeOfMatch(value: number) { this.set('subtypeOfMatch', value); }

    get matchedString(): string { return this.get('matchedString_'); }
    set matchedString(value: string) { this.set('matchedString_', value); }

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

    get selectionIndex(): number { return this.get('selectionIndex'); }
    set selectionIndex(value: number) { this.set('selectionIndex', value); }

    initialize(attrs?: any) {
        this.items = this.items || new AutocompleteSectionItems();
        this.headingName = this.headingName || "Unnamed section TODO";
        this.selectionIndex = -1;
    }
}

class AutocompleteSectionView extends Backbone.View<AutocompleteSection> {
    template: ITemplate;

    events() {
        return {
            'click .click-autocomplete-item-js': 'clickItem'
        };
    }

    initialize(attrs?: any) {
        this.template = Util.getTemplate('autocomplete-section');
    }

    private clickItem(e: JQueryMouseEventObject) {
        this.goToItem(parseInt($(e.currentTarget).data('index')));
    }

    goToItem(index: number) {
        var item = this.model.items.at(index);
        item.todo.view.zoomToTodo();

        this.trigger('click');
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

    totalLength(): number {
        var result = 0;

        this.each(section => { result += section.items.length });

        return result;
    }

    addTextSearchSection(): void {
        var search = this.appModel.searchText;
        var allTodos = _.filter(this.baseTodo.flatten(), m => m.inSearchResults);
        var sections: { [key: string]: AutocompleteItem[] } = {
            "Headings": [],
            "Todos": [],
            "Tags": []
        };
        var thingsAdded = 0;

        for (var i = 0; i < allTodos.length && thingsAdded < 10; i++) {
            var currentTodo = allTodos[i];
            var matchPosition: number;

            // Check for a name match.
            matchPosition = currentTodo.name.toLowerCase().indexOf(search.toLowerCase());
            if (matchPosition !== -1) {
                var destinationList = currentTodo.isHeader ? "Headings" : "Todos";

                sections[destinationList].push(new AutocompleteItem(
                    currentTodo,
                    "name",
                    matchPosition,
                    matchPosition + search.length));

                ++thingsAdded;
                continue;
            }

            // Check for a content match.
            matchPosition = currentTodo.content.toLowerCase().indexOf(search.toLowerCase());

            if (matchPosition !== -1) {
                sections["Todos"].push(new AutocompleteItem(
                    currentTodo,
                    "content",
                    matchPosition,
                    matchPosition + search.length
                ));

                ++thingsAdded;
                continue;
            }

            // Check for a tag match

            var tagMatch = currentTodo.tags.find((tag, i) => {
                var match = tag.get('name').toLowerCase().indexOf(search.toLowerCase()) !== -1;

                if (match) {
                    sections["Tags"].push(new AutocompleteItem(
                        currentTodo,
                        "tag",
                        0, 0, i));
                }

                return match;
            });

            if (tagMatch) {
                ++thingsAdded;
                continue;
            }
        }

        for (var name in sections) {
            var items = sections[name];

            if (items.length == 0) continue;

            this.add(new AutocompleteSection({
                headingName: name,
                items: new AutocompleteSectionItems(sections[name])
            }));
        }
    }
}

class AutocompleteView extends Backbone.View<TodoAppModel> {
    template: ITemplate;
    selectionIndex: number = 0;
    currentResult: AutocompleteResult;
    currentSearch: string;
    subviews: AutocompleteSectionView[] = [];

    events() {
        return {
            'click .see-all-js': this.clickSeeAll
        };
    }

    initialize(attrs?: any) {
        this.template = Util.getTemplate('autocomplete');

        this.listenTo(this.model, 'change:searchText', () => {
            this.render(this.model.searchText);
        });
    }

    goToItem(index: number) {
        this.hide();

        $('.search-input').val('').blur();

        for (var i = 0; i < this.currentResult.length; i++) {
            var m = this.currentResult.at(i);

            if (index < m.items.length) {
                this.subviews[i].goToItem(index);

                return;
            }

            index -= m.items.length;
        }
    }

    keydown(e: JQueryKeyEventObject): boolean {
        var change = false;
        var ctrl = e.ctrlKey;

        if (!$('.search-input').is(':focus')) {
            return false;
        }

        // 1-9 and 0
        if (ctrl && (e.which >= 49 && e.which < 59)) {
            var numberPressed = 1 + e.which - 49;

            if (numberPressed == 10) {
                numberPressed = 0;
            }

            this.goToItem(numberPressed - 1);

            return true;
        }

        // enter
        if (e.which == 13) {
            this.goToItem(this.selectionIndex);

            return true;
        }

        // 40 : down
        if (e.which == 40) {
            this.selectionIndex += 1;
            change = true;
        }

        // 38 : up
        if (e.which == 38) {
            this.selectionIndex -= 1;
            change = true;
        }

        if (change) {
            this.selectionIndex = this.selectionIndex % this.currentResult.totalLength();
            this.render(this.currentSearch);

            return true;
        }

        return false;
    }

    clickSeeAll(e: JQueryMouseEventObject) {
        this.model.view.renderSearch();

        this.$el.toggle(false);
    }

    hide(): void {
        this.$el.toggle(false);
    }

    getAutocompleteResult(): AutocompleteResult {
        this.currentResult = new AutocompleteResult([], { appModel: this.model });

        this.currentResult.compileSearch();

        return this.currentResult;
    }

    render(text: string = ""): AutocompleteView {
        var typedAnything = text != "";
        var self = this;

        this.currentSearch = text;

        this.$el.toggle(typedAnything);
        if (!typedAnything) return;

        var ar = this.getAutocompleteResult();

        this.$el.html(this.template());

        var itemsSeen = 0;

        this.subviews = ar.map(m => {
            if (this.selectionIndex >= itemsSeen && this.selectionIndex < itemsSeen + m.items.length) {
                m.selectionIndex = this.selectionIndex - itemsSeen;
            }

            var section = new AutocompleteSectionView({
                el: $('<div>').appendTo(this.$('.autocomplete-sections')),
                model: m
            }).render();

            this.listenTo(section, 'click', this.hide);
            itemsSeen += m.items.length;

            return section;
        });

        return this;
    }
}
