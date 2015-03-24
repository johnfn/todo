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
    function TagView(attrs) {
        this.tagName = 'a';
        _super.call(this, attrs);
        this.template = Util.getTemplate('tag');
    }
    TagView.prototype.render = function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    };
    return TagView;
})(Backbone.View);
var TagListView = (function (_super) {
    __extends(TagListView, _super);
    function TagListView(tags) {
        this.tags = tags;
        _super.call(this);
    }
    TagListView.prototype.render = function () {
        var _this = this;
        this.$el.empty();
        this.tags.each(function (m) {
            var view = new TagView({
                model: m
            });
            view.render().$el.appendTo(_this.$el);
        });
        return this;
    };
    return TagListView;
})(Backbone.View);
//# sourceMappingURL=tags.js.map