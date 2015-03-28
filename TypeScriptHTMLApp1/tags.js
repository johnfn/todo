var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TagList = (function (_super) {
    __extends(TagList, _super);
    function TagList() {
        _super.apply(this, arguments);
    }
    return TagList;
})(Backbone.Collection);
var TagModel = (function (_super) {
    __extends(TagModel, _super);
    function TagModel(name, tagType) {
        _super.call(this);
        this.name = name;
        this.tagType = tagType;
    }
    Object.defineProperty(TagModel.prototype, "name", {
        get: function () {
            return this.get('name');
        },
        set: function (value) {
            this.set('name', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TagModel.prototype, "tagType", {
        get: function () {
            return this.get('tagType');
        },
        set: function (value) {
            this.set('tagType', value);
        },
        enumerable: true,
        configurable: true
    });
    return TagModel;
})(Backbone.Model);
var TagView = (function (_super) {
    __extends(TagView, _super);
    function TagView(model, isBeingEdited) {
        if (isBeingEdited === void 0) { isBeingEdited = false; }
        this.tagName = 'a';
        this.isBeingEdited = isBeingEdited;
        _super.call(this);
        this.template = Util.getTemplate('tag');
        this.model = model;
    }
    TagView.prototype.keydown = function (e) {
        // Enter
        if (e.which == 13) {
            this.isBeingEdited = false;
            this.model.name = this.$('input').val();
            this.render();
            return true;
        }
        return false;
    };
    TagView.prototype.render = function () {
        var renderOptions = this.model.toJSON();
        renderOptions['isBeingEdited'] = this.isBeingEdited;
        this.$el.html(this.template(renderOptions));
        return this;
    };
    return TagView;
})(Backbone.View);
var TagListView = (function (_super) {
    __extends(TagListView, _super);
    function TagListView(tags) {
        var _this = this;
        _super.call(this);
        this.currentlySelectedTagId = -1;
        this.tagViews = [];
        this.tags = tags;
        this.listenTo(this.tags, 'add', function () {
            _this.addTagView(_this.tags.last(), true);
        });
        this.tags.each(function (m, i) {
            _this.addTagView(m, false);
        });
    }
    TagListView.prototype.keydown = function (e) {
        if (!this.currentlyEditing())
            return false;
        var focusedTag = _.find(this.tagViews, function (view) { return view.isBeingEdited; });
        return focusedTag.keydown(e);
    };
    TagListView.prototype.addTagView = function (model, isCurrentlyEditing) {
        var view = new TagView(model, isCurrentlyEditing);
        this.tagViews.push(view);
    };
    TagListView.prototype.currentlyEditing = function () {
        return _.any(this.tagViews, function (view) { return view.isBeingEdited; });
    };
    TagListView.prototype.render = function () {
        this.$el.empty();
        var selectedIndex = -1;
        for (var i = 0; i < this.tagViews.length; i++) {
            var view = this.tagViews[i];
            view.render().$el.appendTo(this.$el);
            if (view.isBeingEdited) {
                selectedIndex = i;
            }
        }
        if (selectedIndex !== -1) {
            this.tagViews[selectedIndex].$el.find('.tagname-js').focus();
        }
        return this;
    };
    return TagListView;
})(Backbone.View);
//# sourceMappingURL=tags.js.map