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
//   X Up/down
//   X left to go up a level
//   X Enter to start editing
//   X Shift+Enter to add a child.
//     X Autofocus on new child.
//     * If I click to open a new child on a nonselected thing, then i hit enter...
//     * child on bottommost thing is not selected.
//     * Enter to finish adding a new child.
//   * Maybe Down while editing name to edit description.
// * Clicking should also change selection.
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
    }, {
        name: "To test falling",
        children: [{
            name: "test",
            content: "bleh",
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
        this.done = false;
        this.selected = false;
        this.childIndex = -1;
        this.uid = Math.random() + " " + Math.random();
    };
    /** recursively create this todo and all sub-todos from the provided data. */
    TodoModel.prototype.initWithData = function (data, parent) {
        this.name = data.name;
        this.content = data.content;
        this.parent = parent;
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
            childModel.initWithData(child, this);
            this._children.push(childModel);
        }
        return this;
    };
    /** Recursively get the ITodo data of this Todo. */
    TodoModel.prototype.getData = function () {
        var result = this.toJSON();
        result['children'] = _.map(this.children, function (model) { return model.getData(); });
        return result;
    };
    Object.defineProperty(TodoModel.prototype, "childIndex", {
        /** What index is this model in its parent's "children" list, or -1 if it doesn't have a parent. */
        get: function () {
            if (this.parent == null)
                return -1;
            for (var i = 0; i < this.parent.numChildren; i++) {
                if (this.parent.children[i].uid == this.uid) {
                    return i;
                }
            }
            console.error("childIndex is in weird state");
            debugger;
            return -1;
        },
        enumerable: true,
        configurable: true
    });
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
    Object.defineProperty(TodoModel.prototype, "selected", {
        get: function () {
            return this.get('selected');
        },
        set: function (value) {
            this.set('selected', value);
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
    Object.defineProperty(TodoModel.prototype, "numChildren", {
        get: function () {
            return this._children.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "nextChild", {
        /** Returns the next child in this list of children, or null if this is the last. */
        get: function () {
            console.log('nextchild');
            if (this.childIndex + 1 >= this.parent.numChildren) {
                return null;
            }
            else {
                if (this.parent == null) {
                    return null;
                }
                else {
                    return this.parent.children[this.childIndex + 1];
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "previousChild", {
        /** Returns the previous child in this list of children, or null if this is the first. */
        get: function () {
            if (this.childIndex - 1 < 0) {
                return null;
            }
            else {
                return this.parent.children[this.childIndex - 1];
            }
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
            'click .todo-add-js': this.toggleAddChildTodo,
            'click .todo-done-js': this.completeTodo,
            'click .edit-name-js': this.showTodoNameEdit,
            'click .edit-content-js': this.showTodoContentEdit,
            'keydown .name-edit': this.editTodoName,
            'keydown .content-edit': this.editTodoContent
        };
    };
    TodoView.prototype.initialize = function (options) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleAddChildTodo', 'render', 'events', 'keydown');
        if (!TodoView.todoViews)
            TodoView.todoViews = [];
        TodoView.todoViews.push(this);
        this.mainView = options['mainView'];
        this.template = Util.getTemplate("todo");
        this.childrenViews = [];
        this.uiState = new TodoUiState();
        this.model.view = this;
        this.initEditView();
        _.each(this.model.children, this.addChildTodo);
        this.listenTo(this, 'click-body', this.hideAllEditNodes);
    };
    TodoView.prototype.keydown = function (e) {
        if (!this.model.selected)
            return;
        // Navigation
        if (e.which == 38 || e.which == 40 || e.which == 37 || e.which == 39) {
            return this.navigateBetweenTodos(e.which);
        }
        // Shift + Enter to add child
        if (e.which == 13 && e.shiftKey) {
            this.toggleAddChildTodo();
            return false;
        }
        // Enter to edit name
        if (!this.uiState.editingName && !this.uiState.editVisible && e.which == 13 && !e.shiftKey) {
            this.uiState.editingName = true;
            this.render();
            return false;
        }
        return true;
    };
    /** Given a keypress, move appropriately between todos.
        Return true to stop key event propagation. */
    TodoView.prototype.navigateBetweenTodos = function (which) {
        var newSelection;
        if (which == 40 || which == 39) {
            if (this.model.numChildren != 0) {
                newSelection = this.model.children[0];
            }
            else {
                newSelection = this.model.nextChild;
                if (newSelection == null) {
                    // We could potentially be falling off a big cliff of todos. e.g
                    // we could be here:
                    //
                    // [ ] Todo blah blah
                    //  *  [ ] Some inner todo
                    //  *  [ ] bleh
                    //      *  [ ] super inner todo
                    //      *  [ ] oh no
                    //          *  [ ] so inner! <------- HERE
                    // [ ] Other stuff
                    //
                    // So we need to repeatedly ascend to the parent to see if
                    // it has a nextChild -- all the way until there are no more
                    // parents to check.
                    var currentParent = this.model.parent;
                    while (currentParent != null) {
                        if (currentParent.nextChild != null) {
                            newSelection = currentParent.nextChild;
                            break;
                        }
                        currentParent = currentParent.parent;
                    }
                }
            }
        }
        if (which == 38) {
            newSelection = this.model.previousChild;
            if (newSelection == null) {
                newSelection = this.model.parent;
            }
            else {
                while (newSelection.numChildren != 0) {
                    newSelection = newSelection.children[newSelection.numChildren - 1];
                }
            }
        }
        if (which == 37) {
            newSelection = this.model.parent;
        }
        // If they did not try to navigate invalidly, then do our updates.
        if (newSelection != null) {
            this.model.selected = false;
            newSelection.selected = true;
            this.render();
            newSelection.view.render();
            return false;
        }
        return true;
    };
    TodoView.prototype.completeTodo = function () {
        this.model.done = !this.model.done;
        this.render();
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
    // TODO: Eventually merge these into keydown, just check uiState to see which
    // one is being edited.
    // The problem I see right now is that there is a pathological case where
    // you click on both and then uiState is true for both. I think that just
    // allowing one to be edited would be sufficient.
    TodoView.prototype.editTodoName = function (e) {
        if (e.which === 13) {
            this.model.name = $(e.currentTarget).val();
            this.uiState.editingName = false;
            this.render();
            return false;
        }
    };
    TodoView.prototype.editTodoContent = function (e) {
        if (e.which === 13) {
            this.model.content = $(e.currentTarget).val();
            this.uiState.editingContent = false;
            this.render();
            return false;
        }
    };
    TodoView.prototype.initEditView = function () {
        var editModel = new TodoModel();
        var self = this;
        editModel.parent = this.model;
        this.editView = new TodoEditView({ model: editModel });
        this.listenTo(this.editView, 'cancel', this.toggleAddChildTodo);
        this.listenTo(this.editView, 'add-child', function (model) {
            self.addChildTodo(model);
            self.toggleAddChildTodo();
        });
    };
    TodoView.prototype.addChildTodo = function (childModel) {
        this.childrenViews.push(new TodoView({
            model: childModel,
        }));
        // The problem is that half the time we already have children inserted,
        // but the other half we should be adding new children to the array.
        // Should think about this more later.
        if (_.pluck(this.model.children, 'uid').indexOf(childModel.uid) == -1) {
            this.model.children.push(childModel);
        }
        this.render();
    };
    TodoView.prototype.toggleAddChildTodo = function () {
        this.uiState.editVisible = !this.uiState.editVisible;
        this.render();
        return false;
    };
    TodoView.prototype.render = function () {
        var self = this;
        this.$el.html(this.template(this.model.toJSON()));
        // use .children to ensure only TOPMOST children so that we dont
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
        if (this.uiState.editVisible) {
            this.$(".name").focus();
        }
        return this;
    };
    return TodoView;
})(Backbone.View);
// Global todo state. Could keep track of breadcrumbs etc.
var TodoAppModel = (function (_super) {
    __extends(TodoAppModel, _super);
    function TodoAppModel() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(TodoAppModel.prototype, "selectedTodo", {
        get: function () {
            return this.get('selectedTodo');
        },
        set: function (value) {
            this.set('selectedTodo', value);
        },
        enumerable: true,
        configurable: true
    });
    return TodoAppModel;
})(Backbone.Model);
var MainView = (function (_super) {
    __extends(MainView, _super);
    function MainView() {
        _super.apply(this, arguments);
    }
    MainView.prototype.events = function () {
        return {
            'click': this.clickBody,
            'click .save-btn-js': this.save
        };
    };
    MainView.prototype.initialize = function (options) {
        this.model = new TodoAppModel();
        this.baseTodoModel = new TodoModel().initWithData(options['data'], null);
        this.baseTodoModel.selected = true;
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
    };
    MainView.prototype.keydown = function (e) {
        console.log(e.which);
        return true;
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
    $("body").on("keydown", function (e) {
        for (var i = 0; i < TodoView.todoViews.length; i++) {
            if (TodoView.todoViews[i].keydown(e) == false)
                break; // stop propagation
        }
    });
};
//# sourceMappingURL=app.js.map