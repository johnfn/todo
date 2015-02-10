// TODO (lol)
// X indent inner items
// * edit todos
// * TONS of keyboard shortcuts. just tons.
// * header items (just for organization)
//   * I think todos will need a 'type' key
// * mouseover one, highlight all
// * zoomin
// * breadcrumb trail visible
// X pay the power bill
// * listen to debussy
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var dummyData = {
    name: "topmost todo",
    content: "",
    children: [{
        name: "This is a todo",
        content: "descriptive content",
        children: []
    }, {
        name: "Another todo! No content.",
        content: "",
        children: [{
            name: "Nested TODO.",
            content: "bleh",
            children: []
        }, {
            name: "Another nested TODO.",
            content: "blaaah",
            children: []
        }, {
            name: "Nr 3.",
            content: "blaaah",
            children: []
        }, {
            name: "Nr 4.",
            content: "blaaah",
            children: []
        }]
    }]
};
var Util = (function () {
    function Util() {
    }
    Util.getTemplate = function (name) {
        var el = $("#" + name);
        return _.template(el.html());
    };
    return Util;
})();
var TodoModel = (function (_super) {
    __extends(TodoModel, _super);
    function TodoModel() {
        _super.apply(this, arguments);
        this._children = [];
    }
    TodoModel.prototype.initialize = function () {
        this.name = "";
        this.content = "";
    };
    /** recursively create this todo and all sub-todos from the provided data. */
    TodoModel.prototype.initWithData = function (data) {
        this.name = data.name;
        this.content = data.content;
        if (data.depth) {
            this.depth = data.depth;
        }
        else {
            this.depth = 0;
        }
        for (var i = 0; i < data.children.length; i++) {
            var child = data.children[i];
            child.depth = this.depth + 1;
            var childModel = new TodoModel();
            childModel.initWithData(child);
            this._children.push(childModel);
        }
        return this;
    };
    Object.defineProperty(TodoModel.prototype, "depth", {
        get: function () {
            return this.get('depth');
        },
        set: function (value) {
            this.set('depth', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "name", {
        get: function () {
            return this.get('name');
        },
        set: function (value) {
            this.set('name', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "content", {
        get: function () {
            return this.get('content');
        },
        set: function (value) {
            this.set('content', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "children", {
        get: function () {
            return this._children;
        },
        enumerable: true,
        configurable: true
    });
    return TodoModel;
})(Backbone.Model);
var TodoUiState = (function (_super) {
    __extends(TodoUiState, _super);
    function TodoUiState(attrs) {
        _super.call(this, attrs);
        this.editVisible = false;
    }
    Object.defineProperty(TodoUiState.prototype, "editVisible", {
        get: function () {
            return this.get('editVisible');
        },
        set: function (value) {
            this.set('editVisible', value);
        },
        enumerable: true,
        configurable: true
    });
    return TodoUiState;
})(Backbone.Model);
var TodoEditView = (function (_super) {
    __extends(TodoEditView, _super);
    function TodoEditView() {
        _super.apply(this, arguments);
    }
    TodoEditView.prototype.events = function () {
        return {
            'click .edit-add-js': 'addTodo',
            'click .edit-cancel-js': 'cancelTodo'
        };
    };
    TodoEditView.prototype.getNameText = function () {
        return this.$(".name").first().val();
    };
    TodoEditView.prototype.getDescText = function () {
        return this.$(".desc").first().val();
    };
    TodoEditView.prototype.addTodo = function (e) {
        this.model.name = this.getNameText();
        this.trigger('add-child', this.model);
        return false;
    };
    TodoEditView.prototype.cancelTodo = function (e) {
        this.trigger('cancel');
        return false;
    };
    TodoEditView.prototype.initialize = function (options) {
        this.template = Util.getTemplate("todo-edit");
    };
    TodoEditView.prototype.render = function () {
        this.$el.html(this.template());
        this.delegateEvents();
        return this;
    };
    return TodoEditView;
})(Backbone.View);
var TodoView = (function (_super) {
    __extends(TodoView, _super);
    function TodoView() {
        _super.apply(this, arguments);
    }
    TodoView.prototype.events = function () {
        return {
            'click .todo-add-js': 'toggleTodo'
        };
    };
    TodoView.prototype.initialize = function (options) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleTodo', 'render');
        this.template = Util.getTemplate("todo");
        this.childrenViews = [];
        this.uiState = new TodoUiState();
        _.forEach(this.model.children, this.addChildTodo);
        this.initEditView();
    };
    TodoView.prototype.initEditView = function () {
        var editModel = new TodoModel();
        this.editView = new TodoEditView({ model: editModel });
        this.listenTo(this.editView, 'cancel', this.toggleTodo);
        this.listenTo(this.editView, 'add-child', this.addChildTodo);
    };
    TodoView.prototype.addChildTodo = function (childModel) {
        this.childrenViews.push(new TodoView({
            model: childModel
        }));
        this.render();
    };
    TodoView.prototype.toggleTodo = function () {
        this.uiState.editVisible = !this.uiState.editVisible;
        this.render();
        return false;
    };
    TodoView.prototype.render = function () {
        var self = this;
        var $childrenContainer;
        var $addTodo;
        this.$el.html(this.template(this.model.toJSON()));
        this.delegateEvents(); // We might lose our own events. D:
        // use .children to ensure only TOPMOST children so that we dont
        // append the current child to the children list of the other todos.
        $childrenContainer = this.$('.children');
        $addTodo = this.$('.todo-add');
        // render children
        _.each(this.childrenViews, function (child) {
            child.render().$el.appendTo($childrenContainer);
        });
        this.editView.render().$el.appendTo($addTodo);
        // update state per uiState
        $addTodo.toggle(this.uiState.editVisible);
        return this;
    };
    return TodoView;
})(Backbone.View);
// Global todo state. Could keep track of breadcrumbs etc.
var MainModel = (function (_super) {
    __extends(MainModel, _super);
    function MainModel() {
        _super.apply(this, arguments);
    }
    return MainModel;
})(Backbone.Model);
var MainView = (function (_super) {
    __extends(MainView, _super);
    function MainView() {
        _super.apply(this, arguments);
    }
    MainView.prototype.initialize = function (options) {
        this.baseTodoModel = new TodoModel().initWithData(options['data']);
        this.baseTodoView = new TodoView({ model: this.baseTodoModel });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
    };
    MainView.prototype.render = function () {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$(".items"));
        return this;
    };
    return MainView;
})(Backbone.View);
window.onload = function () {
    var mainView = new MainView({
        data: dummyData
    });
    mainView.render();
};
//# sourceMappingURL=app.js.map