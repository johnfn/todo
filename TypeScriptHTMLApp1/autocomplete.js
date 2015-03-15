var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AutocompleteItem = (function (_super) {
    __extends(AutocompleteItem, _super);
    function AutocompleteItem() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(AutocompleteItem.prototype, "name", {
        get: function () {
            return this.get('name');
        },
        set: function (value) {
            this.set('name', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "desc", {
        get: function () {
            return this.get('desc');
        },
        set: function (value) {
            this.set('desc', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AutocompleteItem.prototype, "matchFoundIn", {
        get: function () {
            return this.get('matchFoundIn');
        },
        set: function (value) {
            this.set('matchFoundIn', value);
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
})(Backbone.Model);
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
    AutocompleteSection.prototype.initialize = function (attrs) {
        this.items = this.items || new AutocompleteSectionItems();
        this.headingName = this.headingName || "Unnamed section TODO";
    };
    return AutocompleteSection;
})(Backbone.Model);
var AutocompleteSectionView = (function (_super) {
    __extends(AutocompleteSectionView, _super);
    function AutocompleteSectionView() {
        _super.apply(this, arguments);
    }
    AutocompleteSectionView.prototype.initialize = function (attrs) {
        this.template = Util.getTemplate('autocomplete-section');
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
        this.addTextSearchSection();
    };
    AutocompleteResult.prototype.addTextSearchSection = function () {
        var allTodos = _.filter(this.baseTodo.flatten(), function (m) { return m.inSearchResults; });
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
    };
    return AutocompleteResult;
})(Backbone.Collection);
var AutocompleteView = (function (_super) {
    __extends(AutocompleteView, _super);
    function AutocompleteView() {
        _super.apply(this, arguments);
    }
    AutocompleteView.prototype.initialize = function (attrs) {
        var _this = this;
        this.template = Util.getTemplate('autocomplete');
        this.listenTo(this.model, 'change:searchText', function () {
            _this.render(_this.model.searchText);
        });
    };
    AutocompleteView.prototype.getAutocompleteResult = function () {
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
    };
    AutocompleteView.prototype.render = function (text) {
        var _this = this;
        if (text === void 0) { text = ""; }
        var typedAnything = text != "";
        var self = this;
        this.$el.toggle(typedAnything);
        if (!typedAnything)
            return;
        var ar = this.getAutocompleteResult();
        this.$el.html(this.template());
        ar.each(function (m) {
            var section = new AutocompleteSectionView({
                el: $('<div>').appendTo(_this.$('.autocomplete')),
                model: m
            }).render();
        });
        return this;
    };
    return AutocompleteView;
})(Backbone.View);
//# sourceMappingURL=autocomplete.js.map