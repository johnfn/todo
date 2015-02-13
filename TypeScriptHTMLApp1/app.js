// TODO (lol)
// X indent inner items
// X add todos
// X edit todos
//   X enter is done
//   * only 1 at a time
//   X if you click somewhere else it cancels
//   X automatically select text.
//   X Bug where now you can't create new todos
// * Mark todos as done.
// * option to add content if there isn't any.
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
    /** Recursively get the ITodo data of this Todo. */
    TodoModel.prototype.getData = function () {
        return {
            content: this.content,
            name: this.name,
            children: _.map(this.children, function (model) { return model.getData(); })
        };
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
    Object.defineProperty(TodoModel.prototype, "done", {
        get: function () {
            return this.get('done');
        },
        set: function (value) {
            this.set('done', value);
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
        this.editingName = false;
        this.editingContent = false;
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
    Object.defineProperty(TodoUiState.prototype, "editingName", {
        get: function () {
            return this.get('editingName');
        },
        set: function (value) {
            this.set('editingName', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "editingContent", {
        get: function () {
            return this.get('editingContent');
        },
        set: function (value) {
            this.set('editingContent', value);
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
            'click .edit-cancel-js': 'cancelTodo',
            'click .name-js': function () { return false; },
            'click .desc-js': function () { return false; }
        };
    };
    TodoEditView.prototype.initialize = function (options) {
        this.template = Util.getTemplate("todo-edit");
    };
    TodoEditView.prototype.getNameText = function () {
        return this.$(".name").first().val();
    };
    TodoEditView.prototype.getDescText = function () {
        return this.$(".desc").first().val();
    };
    TodoEditView.prototype.addTodo = function (e) {
        this.model.name = this.getNameText();
        this.model.content = this.getDescText();
        this.trigger('add-child', this.model);
        return false;
    };
    TodoEditView.prototype.cancelTodo = function (e) {
        this.trigger('cancel');
        return false;
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
            'click .todo-add-js': this.toggleTodo,
            'click .todo-done-js': this.completeTodo,
            'click .edit-name-js': this.showTodoNameEdit,
            'click .edit-content-js': this.showTodoContentEdit,
            'keydown .name-edit': this.editTodoName,
            'keydown .content-edit': this.editTodoContent
        };
    };
    TodoView.prototype.initialize = function (options) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleTodo', 'render');
        this.mainView = options['mainView'];
        this.template = Util.getTemplate("todo");
        this.childrenViews = [];
        this.uiState = new TodoUiState();
        this.initEditView();
        _.each(this.model.children, this.addChildTodo);
        this.listenTo(this, 'click-body', this.hideAllEditNodes);
    };
    TodoView.prototype.completeTodo = function () {
        console.log("done");
        return false;
    };
    TodoView.prototype.hideAllEditNodes = function (e) {
        _.each(this.childrenViews, function (view) {
            view.trigger('click-body');
        });
        this.uiState.editingContent = false;
        this.uiState.editingName = false;
        this.uiState.editVisible = false;
        this.render();
    };
    TodoView.prototype.showTodoNameEdit = function (e) {
        this.uiState.editingName = true;
        this.render();
        return false;
    };
    TodoView.prototype.showTodoContentEdit = function (e) {
        this.uiState.editingContent = true;
        this.render();
        return false;
    };
    TodoView.prototype.editTodoName = function (e) {
        if (e.which === 13) {
            this.model.name = $(e.currentTarget).val();
            this.uiState.editingName = false;
            this.render();
        }
    };
    TodoView.prototype.editTodoContent = function (e) {
        if (e.which === 13) {
            this.model.content = $(e.currentTarget).val();
            this.uiState.editingContent = false;
            this.render();
        }
    };
    TodoView.prototype.initEditView = function () {
        var editModel = new TodoModel();
        var self = this;
        this.editView = new TodoEditView({ model: editModel });
        this.listenTo(this.editView, 'cancel', this.toggleTodo);
        this.listenTo(this.editView, 'add-child', function (model) {
            self.addChildTodo(model);
            self.toggleTodo();
        });
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
        this.$el.html(this.template(this.model.toJSON()));
        // use .children cto ensure only TOPMOST children so that we dont
        // append the current child to the children list of the other todos.
        var $childrenContainer = this.$('.children');
        var $addTodo = this.$('.todo-add');
        var $editName = this.$('.edit-name-js');
        var $editContent = this.$('.edit-content-js');
        // update state per uiState
        $addTodo.toggle(this.uiState.editVisible);
        if (this.uiState.editingName) {
            var $nameInput = $("<input>").addClass('name-edit').val(this.model.name);
            $editName.replaceWith($nameInput);
            if (!this.uiState.previous('editingName')) {
                $nameInput.select();
            }
        }
        if (this.uiState.editingContent) {
            var $contentInput = $("<input>").addClass('content-edit').val(this.model.content);
            $editContent.replaceWith($contentInput);
            if (!this.uiState.previous('editingContent')) {
                $contentInput.select();
            }
        }
        this.delegateEvents(); // We might lose our own events. D:
        // render children
        _.each(this.childrenViews, function (child) {
            child.render().$el.appendTo($childrenContainer);
        });
        this.editView.render().$el.appendTo($addTodo);
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
    MainView.prototype.events = function () {
        return {
            'click': "clickBody",
            'click .save-btn-js': 'save'
        };
    };
    MainView.prototype.initialize = function (options) {
        this.baseTodoModel = new TodoModel().initWithData(options['data']);
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
    };
    MainView.prototype.render = function () {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$(".items"));
        return this;
    };
    MainView.prototype.save = function () {
        console.log(this.baseTodoModel.getData());
        return false;
    };
    MainView.prototype.clickBody = function (e) {
        this.baseTodoView.trigger('click-body');
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