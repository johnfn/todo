// TODO (lol)
// X indent inner items
// X add todos
// X edit todos
//   X enter is done
//   * only 1 at a time
//   X if you click somewhere else it cancels
//   X automatically select text.
//   X Bug where now you can't create new todos
// X Mark todos as done.
// * option to add content if there isn't any.
// * Click to focus
// * TONS of keyboard shortcuts. just tons.
//   X Up/down
//   X left to go up a level
//   X Enter to start editing
//     X Enter to finish
//       X Currently just leaves it blank.
//       * Before I fix this I should just make the input nodes exist, just empty.
//   X Shift+Enter to add a child.
//     X Autofocus on new child.
//     * If I click to open a new child on a nonselected thing, then i hit enter...
//     X child on bottommost thing is not selected.
//     * Enter to finish adding a new child.
//   * Maybe Down while editing name to edit description.
// * Clicking should also change selection.
// * header items (just for organization)
//   * I think todos will need a 'type' key
// * mouseover one, highlight all
// * zoomin
// * breadcrumb trail visible
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
            if (TodoModel.selectedModel && value) {
                TodoModel.selectedModel.set('selected', false); // don't infinitely recurse
            }
            this.set('selected', value);
            if (value)
                TodoModel.selectedModel = this;
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
var NewTodoView = (function (_super) {
    __extends(NewTodoView, _super);
    function NewTodoView() {
        _super.apply(this, arguments);
    }
    NewTodoView.prototype.events = function () {
        return {
            'click .edit-add-js': 'addTodo',
            'click .edit-cancel-js': 'cancelTodo',
            'click .name-js': this.stopProp,
            'click .desc-js': this.stopProp
        };
    };
    NewTodoView.prototype.initialize = function (options) {
        this.template = Util.getTemplate("todo-edit");
    };
    NewTodoView.prototype.stopProp = function () {
        return false;
    };
    NewTodoView.prototype.getNameText = function () {
        return this.$(".name").first().val();
    };
    NewTodoView.prototype.getDescText = function () {
        return this.$(".desc").first().val();
    };
    NewTodoView.prototype.addTodo = function (e) {
        this.model.name = this.getNameText();
        this.model.content = this.getDescText();
        this.trigger('add-child', this.model);
        return false;
    };
    NewTodoView.prototype.cancelTodo = function (e) {
        this.trigger('cancel');
        return false;
    };
    NewTodoView.prototype.render = function () {
        this.$el.html(this.template());
        this.delegateEvents();
        return this;
    };
    return NewTodoView;
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
            'click input': function () { return false; }
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
        // Enter to finish editing name
        if (e.which === 13 && this.uiState.editingName) {
            this.model.name = this.$('.name-edit').val();
            this.uiState.editingName = false;
            this.render();
            return false;
        }
        // Enter to finish editing content
        if (e.which === 13 && this.uiState.editingContent) {
            this.model.content = this.$('.content-edit-js').val();
            this.uiState.editingContent = false;
            this.render();
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
    TodoView.prototype.initEditView = function () {
        var editModel = new TodoModel();
        var self = this;
        editModel.parent = this.model;
        this.editView = new NewTodoView({ model: editModel });
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
        // TODO: Should think about this more later.
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
        var $childrenContainer = this.$('.children');
        var $addTodo = this.$('.todo-add');
        var $editName = this.$('.edit-name-js');
        var $editContent = this.$('.edit-content-js');
        // Update state per uiState
        $addTodo.toggle(this.uiState.editVisible);
        this.renderTodoName();
        this.renderTodoContent();
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
    /** Show the name text xor the name input. */
    TodoView.prototype.renderTodoName = function () {
        this.$('.edit-name-js').toggle(!this.uiState.editingName);
        var $nameInput = this.$('.name-edit').toggle(this.uiState.editingName).val(this.model.name);
        if (this.uiState.editingName && !this.uiState.previous('editingName')) {
            $nameInput.select();
        }
    };
    /** Show the content text xor the content input. */
    TodoView.prototype.renderTodoContent = function () {
        this.$('.edit-content-js').toggle(!this.uiState.editingContent);
        var $contentInput = this.$(".content-edit-js").toggle(this.uiState.editingContent).val(this.model.content);
        if (this.uiState.editingContent && !this.uiState.previous('editingContent')) {
            $contentInput.select();
        }
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
            'click .save-btn-js': this.save
        };
    };
    MainView.prototype.initialize = function (options) {
        _.bindAll(this, 'clickBody');
        this.model = new TodoAppModel();
        this.baseTodoModel = new TodoModel().initWithData(options['data'], null);
        this.baseTodoModel.selected = true;
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
        $('body').on('click', this.clickBody);
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