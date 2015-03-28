var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AutocompleteItem = (function (_super) {
    __extends(AutocompleteItem, _super);
    function AutocompleteItem(todo, type, startPosition, endPosition, subtypeOfMatch) {
        if (subtypeOfMatch === void 0) { subtypeOfMatch = -1; }
        _super.call(this);
        this.todo = todo;
        this.typeOfMatch = type;
        this.subtypeOfMatch = subtypeOfMatch;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        if (type === "name") {
            this.matchedString = this.todo.name;
        }
        else if (type === "content") {
            this.matchedString = this.todo.content;
        }
        else if (type === "tag") {
            this.matchedString = this.todo.tags.at(subtypeOfMatch).get('name');
        }
        this.truncateMatchIfNecessary();
    }
    AutocompleteItem.prototype.truncateMatchIfNecessary = function () {
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
        this.matchedString = (startWasTruncated ? "..." : "") + this.matchedString.substring(start, end) + (endWasTruncated ? "..." : "");
    };
    Object.defineProperty(AutocompleteItem.prototype, "todo", {
        get: function () {
            return this.get('todo');
        },
        set: function (value) {
            this.set('todo', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "startOfMatchString", {
        get: function () {
            return this.matchedString.substring(0, this.startPosition);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "middleOfMatchString", {
        get: function () {
            return this.matchedString.substring(this.startPosition, this.endPosition);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "endOfMatchString", {
        get: function () {
            return this.matchedString.substring(this.endPosition);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "typeOfMatch", {
        get: function () {
            return this.get('typeOfMatch');
        },
        set: function (value) {
            this.set('typeOfMatch', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "subtypeOfMatch", {
        get: function () {
            return this.get('subtypeOfMatch');
        },
        set: function (value) {
            this.set('subtypeOfMatch', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "matchedString", {
        get: function () {
            return this.get('matchedString_');
        },
        set: function (value) {
            this.set('matchedString_', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "startPosition", {
        get: function () {
            return this.get('startPosition');
        },
        set: function (value) {
            this.set('startPosition', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "endPosition", {
        get: function () {
            return this.get('endPosition');
        },
        set: function (value) {
            this.set('endPosition', value);
        },
        enumerable: true,
        configurable: true
    });
    return AutocompleteItem;
})(VaguelyMagicalModel);
var AutocompleteSectionItems = (function (_super) {
    __extends(AutocompleteSectionItems, _super);
    function AutocompleteSectionItems() {
        _super.apply(this, arguments);
    }
    return AutocompleteSectionItems;
})(Backbone.Collection);
/** A header + the items under that header, in the autocomplete. */
var AutocompleteSection = (function (_super) {
    __extends(AutocompleteSection, _super);
    function AutocompleteSection() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(AutocompleteSection.prototype, "headingName", {
        get: function () {
            return this.get('headingName');
        },
        set: function (value) {
            this.set('headingName', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteSection.prototype, "items", {
        get: function () {
            return this.get('items');
        },
        set: function (value) {
            this.set('items', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteSection.prototype, "selectionIndex", {
        get: function () {
            return this.get('selectionIndex');
        },
        set: function (value) {
            this.set('selectionIndex', value);
        },
        enumerable: true,
        configurable: true
    });
    AutocompleteSection.prototype.initialize = function (attrs) {
        this.items = this.items || new AutocompleteSectionItems();
        this.headingName = this.headingName || "Unnamed section TODO";
        this.selectionIndex = -1;
    };
    return AutocompleteSection;
})(Backbone.Model);
var AutocompleteSectionView = (function (_super) {
    __extends(AutocompleteSectionView, _super);
    function AutocompleteSectionView() {
        _super.apply(this, arguments);
    }
    AutocompleteSectionView.prototype.events = function () {
        return {
            'click .click-autocomplete-item-js': 'clickItem'
        };
    };
    AutocompleteSectionView.prototype.initialize = function (attrs) {
        this.template = Util.getTemplate('autocomplete-section');
    };
    AutocompleteSectionView.prototype.clickItem = function (e) {
        this.goToItem(parseInt($(e.currentTarget).data('index')));
    };
    AutocompleteSectionView.prototype.goToItem = function (index) {
        var item = this.model.items.at(index);
        item.todo.view.zoomToTodo();
        this.trigger('click');
    };
    AutocompleteSectionView.prototype.render = function () {
        this.$el.html(this.template({
            section: this.model.toJSON(),
            items: this.model.items.toJSON()
        }));
        return this;
    };
    return AutocompleteSectionView;
})(Backbone.View);
/** The *entire* autocomplete result - currently just composed of many
    sections. */
var AutocompleteResult = (function (_super) {
    __extends(AutocompleteResult, _super);
    function AutocompleteResult() {
        _super.apply(this, arguments);
    }
    AutocompleteResult.prototype.initialize = function (models, opts) {
        this.appModel = opts['appModel'];
        this.baseTodo = this.appModel.baseTodoModel;
    };
    AutocompleteResult.prototype.compileSearch = function () {
        this.addTextSearchSection();
    };
    AutocompleteResult.prototype.totalLength = function () {
        var result = 0;
        this.each(function (section) {
            result += section.items.length;
        });
        return result;
    };
    AutocompleteResult.prototype.addTextSearchSection = function () {
        var search = this.appModel.searchText;
        var allTodos = _.filter(this.baseTodo.flatten(), function (m) { return m.inSearchResults; });
        var sections = {
            "Headings": [],
            "Todos": []
        };
        var thingsAdded = 0;
        for (var i = 0; i < allTodos.length && thingsAdded < 10; i++) {
            var currentTodo = allTodos[i];
            var matchPosition;
            // Check for a name match.
            matchPosition = currentTodo.name.toLowerCase().indexOf(search.toLowerCase());
            if (matchPosition !== -1) {
                var destinationList = currentTodo.isHeader ? "Headings" : "Todos";
                sections[destinationList].push(new AutocompleteItem(currentTodo, "name", matchPosition, matchPosition + search.length));
                ++thingsAdded;
                continue;
            }
            // Check for a content match.
            matchPosition = currentTodo.content.toLowerCase().indexOf(search.toLowerCase());
            if (matchPosition !== -1) {
                sections["Todos"].push(new AutocompleteItem(currentTodo, "content", matchPosition, matchPosition + search.length));
                ++thingsAdded;
                continue;
            }
        }
        for (var name in sections) {
            var items = sections[name];
            if (items.length == 0)
                continue;
            this.add(new AutocompleteSection({
                headingName: name,
                items: new AutocompleteSectionItems(sections[name])
            }));
        }
        this.add(new AutocompleteSection({
            headingName: "tags",
            items: new AutocompleteSectionItems([
                new AutocompleteItem(this.baseTodo.children[0].children[0], "tag", 0, 0, 0)
            ])
        }));
    };
    return AutocompleteResult;
})(Backbone.Collection);
var AutocompleteView = (function (_super) {
    __extends(AutocompleteView, _super);
    function AutocompleteView() {
        _super.apply(this, arguments);
        this.selectionIndex = 0;
        this.subviews = [];
    }
    AutocompleteView.prototype.events = function () {
        return {
            'click .see-all-js': this.clickSeeAll
        };
    };
    AutocompleteView.prototype.initialize = function (attrs) {
        var _this = this;
        this.template = Util.getTemplate('autocomplete');
        this.listenTo(this.model, 'change:searchText', function () {
            _this.render(_this.model.searchText);
        });
    };
    AutocompleteView.prototype.goToItem = function (index) {
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
    };
    AutocompleteView.prototype.keydown = function (e) {
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
    };
    AutocompleteView.prototype.clickSeeAll = function (e) {
        this.model.view.renderSearch();
        this.$el.toggle(false);
    };
    AutocompleteView.prototype.hide = function () {
        this.$el.toggle(false);
    };
    AutocompleteView.prototype.getAutocompleteResult = function () {
        this.currentResult = new AutocompleteResult([], { appModel: this.model });
        this.currentResult.compileSearch();
        return this.currentResult;
    };
    AutocompleteView.prototype.render = function (text) {
        var _this = this;
        if (text === void 0) { text = ""; }
        var typedAnything = text != "";
        var self = this;
        this.currentSearch = text;
        this.$el.toggle(typedAnything);
        if (!typedAnything)
            return;
        var ar = this.getAutocompleteResult();
        this.$el.html(this.template());
        var itemsSeen = 0;
        this.subviews = ar.map(function (m) {
            if (_this.selectionIndex >= itemsSeen && _this.selectionIndex < itemsSeen + m.items.length) {
                m.selectionIndex = _this.selectionIndex - itemsSeen;
            }
            var section = new AutocompleteSectionView({
                el: $('<div>').appendTo(_this.$('.autocomplete-sections')),
                model: m
            }).render();
            _this.listenTo(section, 'click', _this.hide);
            itemsSeen += m.items.length;
            return section;
        });
        return this;
    };
    return AutocompleteView;
})(Backbone.View);
//# sourceMappingURL=autocomplete.js.map