// TODO (lol)
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Util = (function () {
    function Util() {
    }
    Util.getTemplate = function (name) {
        var el = $('#' + name);
        return _.template(el.html());
    };
    Util.id = function (a) {
        return a;
    };
    Util.fairlyLegibleDateTime = function () {
        return (new Date()).toString().slice(0, -15);
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
        var _this = this;
        this.name = '';
        this.content = '';
        this.done = false;
        this.selected = false;
        this.childIndex = -1;
        this.uid = Math.random() + ' ' + Math.random();
        // Pass this event up the hierarchy, so we can use it in SavedData.
        this.listenTo(this, 'good-time-to-save', function () {
            if (_this.parent) {
                _this.parent.trigger('good-time-to-save');
            }
        });
    };
    /** recursively create this todo and all sub-todos from the provided data. */
    TodoModel.prototype.initWithData = function (data, parent) {
        this.name = data.name;
        this.content = data.content;
        this.done = data.done;
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
    /** Indicate that now would be a good time to save. */
    TodoModel.prototype.goodTimeToSave = function () {
        this.trigger('good-time-to-save');
    };
    Object.defineProperty(TodoModel.prototype, "childIndex", {
        /** What index is this model in its parent's "children" list, or -1 if it doesn't have a parent. */
        get: function () {
            if (this.parent == null)
                return -1;
            for (var i = 0; i < this.parent.numChildren; i++) {
                if (this.parent.children[i].uid === this.uid) {
                    return i;
                }
            }
            console.error('childIndex is in weird state');
            debugger;
            return -1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "creationDate", {
        get: function () {
            return this.get('creationDate');
        },
        set: function (value) {
            this.set('creationDate', value);
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
            this.goodTimeToSave();
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
            this.goodTimeToSave();
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
            this.goodTimeToSave();
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
                TodoModel.selectedModel.view.render();
            }
            if (value) {
                TodoModel.selectedModel = this;
                this.trigger('selected');
            }
            this.set('selected', value);
            if (this.view) {
                this.view.render();
            }
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
        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
    }
    Object.defineProperty(TodoUiState.prototype, "isEditing", {
        /** Returns true if the user is currently editing anything. */
        get: function () {
            return this.addTodoVisible || this.editingName || this.editingContent;
        },
        enumerable: true,
        configurable: true
    });
    TodoUiState.prototype.stopAllEditing = function () {
        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
    };
    Object.defineProperty(TodoUiState.prototype, "addTodoVisible", {
        get: function () {
            return this.get('addTodoVisible');
        },
        set: function (value) {
            this.set('addTodoVisible', value);
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
        this.template = Util.getTemplate('todo-edit');
    };
    NewTodoView.prototype.stopProp = function () {
        return false;
    };
    NewTodoView.prototype.getNameText = function () {
        return this.$('.name').first().val();
    };
    NewTodoView.prototype.getDescText = function () {
        return this.$('.desc').first().val();
    };
    NewTodoView.prototype.addTodo = function (e) {
        if (this.getNameText() === "") {
            this.trigger('cancel');
            return false;
        }
        this.model.name = this.getNameText();
        this.model.content = this.getDescText();
        this.trigger('add-todo', this.model);
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
var TodoDetailView = (function (_super) {
    __extends(TodoDetailView, _super);
    function TodoDetailView() {
        _super.apply(this, arguments);
    }
    TodoDetailView.prototype.initialize = function () {
        if (TodoDetailView.instance) {
            console.error('Multiple instantiation of TodoDetailView');
            return;
        }
        this.template = Util.getTemplate("right-panel");
        this.setElement($('.right-panel'));
        TodoDetailView.instance = this;
    };
    TodoDetailView.prototype.render = function () {
        this.$el.empty().html(this.template(this.model.toJSON()));
        return this;
    };
    return TodoDetailView;
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
            'click .todo-remove-js': this.clickRemoveTodo,
            'click .edit-name-js': this.showTodoNameEdit,
            'click .edit-content-js': this.showTodoContentEdit,
            'click input': function () { return false; }
        };
    };
    TodoView.prototype.initialize = function (options) {
        var _this = this;
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleAddChildTodo', 'render', 'events', 'keydown');
        if (!TodoView.todoViews)
            TodoView.todoViews = [];
        TodoView.todoViews.push(this);
        this.mainView = options['mainView'];
        this.template = Util.getTemplate('todo');
        this.childrenViews = [];
        this.uiState = new TodoUiState();
        this.model.view = this;
        this.initEditView();
        for (var i = 0; i < this.model.children.length; i++) {
            this.addChildTodo(this.model.children[i]);
        }
        this.listenTo(this, 'click-body', this.hideAllEditNodes);
        this.listenTo(this, 'remove-todo', this.removeTodo);
        this.listenTo(this.model, 'selected', function () {
            TodoDetailView.instance.model = _this.model;
            TodoDetailView.instance.render();
        });
    };
    TodoView.prototype.keydown = function (e) {
        if (!this.model.selected)
            return true;
        var enter = e.which === 13 && !e.shiftKey;
        var shiftEnter = e.which === 13 && e.shiftKey;
        // Navigation
        if (e.which === 38 || e.which === 40 || e.which === 37 || e.which === 39) {
            if (!this.uiState.isEditing) {
                return this.navigateBetweenTodos(e.which);
            }
        }
        // Shift + Enter to toggle between name and content editing
        if (shiftEnter && this.uiState.editingName) {
            this.uiState.editingName = false;
            this.uiState.editingContent = true;
            this.render();
            return false;
        }
        if (shiftEnter && this.uiState.editingContent) {
            this.uiState.editingName = true;
            this.uiState.editingContent = false;
            this.render();
            return false;
        }
        // Shift + Enter to start to add child
        if (shiftEnter) {
            this.toggleAddChildTodo();
            return false;
        }
        // Esc to stop editing
        if (e.which === 27 && this.uiState.isEditing) {
            this.uiState.stopAllEditing();
            this.render();
            return false;
        }
        // Enter to finish editing name
        if (enter && this.uiState.editingName) {
            this.model.name = this.$('.name-edit').val();
            this.uiState.editingName = false;
            this.render();
            return false;
        }
        // Enter to finish editing content
        if (enter && this.uiState.editingContent) {
            this.model.content = this.$('.content-edit-js').val();
            this.uiState.editingContent = false;
            this.render();
            return false;
        }
        // Enter to finish adding child
        if (enter && this.uiState.addTodoVisible) {
            this.editView.addTodo(null);
            this.render();
            return false;
        }
        // Enter to edit name
        if (enter && !this.uiState.editingName && !this.uiState.addTodoVisible) {
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
        if (which === 40 || which === 39) {
            if (this.model.numChildren !== 0) {
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
        if (which === 38) {
            newSelection = this.model.previousChild;
            if (newSelection == null) {
                newSelection = this.model.parent;
            }
            else {
                while (newSelection.numChildren !== 0) {
                    newSelection = newSelection.children[newSelection.numChildren - 1];
                }
            }
        }
        if (which === 37) {
            newSelection = this.model.parent;
        }
        // If they did not try to navigate invalidly, then do our updates.
        if (newSelection != null) {
            newSelection.selected = true;
            this.render();
            return false;
        }
        return true;
    };
    TodoView.prototype.completeTodo = function () {
        this.model.done = !this.model.done;
        this.render();
        return false;
    };
    TodoView.prototype.clickRemoveTodo = function () {
        if (this.model.parent) {
            this.model.parent.selected = true;
            this.model.parent.view.trigger('remove-todo', this.model.childIndex);
        }
        return false;
    };
    TodoView.prototype.removeTodo = function (index) {
        var deleted = this.childrenViews.splice(index, 1)[0];
        this.model.children.splice(index, 1);
        this.model.goodTimeToSave();
        deleted.$el.slideUp(100, this.render);
    };
    TodoView.prototype.hideAllEditNodes = function (e) {
        _.each(this.childrenViews, function (view) {
            view.trigger('click-body');
        });
        this.uiState.editingContent = false;
        this.uiState.editingName = false;
        this.uiState.addTodoVisible = false;
        this.render();
    };
    TodoView.prototype.showTodoNameEdit = function (e) {
        this.uiState.editingName = true;
        this.model.selected = true;
        this.render();
        return false;
    };
    TodoView.prototype.showTodoContentEdit = function (e) {
        this.uiState.editingContent = true;
        this.model.selected = true;
        this.render();
        return false;
    };
    TodoView.prototype.initEditView = function () {
        var self = this;
        var editModel = new TodoModel();
        editModel.parent = this.model;
        editModel.creationDate = Util.fairlyLegibleDateTime();
        this.editView = new NewTodoView({ model: editModel });
        this.listenTo(this.editView, 'cancel', this.toggleAddChildTodo);
        this.listenTo(this.editView, 'add-todo', function (model) {
            self.addChildTodo(model);
            self.toggleAddChildTodo();
        });
    };
    TodoView.prototype.addChildTodo = function (childModel, prepend) {
        if (prepend === void 0) { prepend = false; }
        var newView = new TodoView({ model: childModel });
        var index = prepend ? 0 : this.childrenViews.length;
        this.childrenViews.splice(index, 0, newView);
        // The problem is that half the time when we call this fn, we already
        // have children inserted, but the other half we should be adding
        // new children to the array.
        // TODO: Should think about this more later.
        if (_.pluck(this.model.children, 'uid').indexOf(childModel.uid) === -1) {
            this.model.children.splice(index, 0, childModel);
        }
        this.model.goodTimeToSave();
        this.render();
    };
    TodoView.prototype.toggleAddChildTodo = function () {
        this.uiState.addTodoVisible = !this.uiState.addTodoVisible;
        // TODO: Just pass in parent to TodoModel.
        var editModel = new TodoModel();
        editModel.parent = this.model;
        this.editView.model = editModel;
        this.render();
        return false;
    };
    TodoView.prototype.render = function () {
        this.$el.html(this.template(this.model.toJSON()));
        var $childrenContainer = this.$('.children-js');
        var $addTodo = this.$('.todo-add');
        // Update state per uiState
        $addTodo.toggle(this.uiState.addTodoVisible);
        this.renderTodoName();
        this.renderTodoContent();
        this.delegateEvents(); // We might lose our own events. D:
        // render children
        _.each(this.childrenViews, function (child) {
            child.render().$el.appendTo($childrenContainer);
        });
        this.editView.render().$el.appendTo($addTodo);
        if (this.uiState.addTodoVisible) {
            this.$('.name').focus();
        }
        window['keyboardShortcuts'].setModel(this.uiState);
        window['keyboardShortcuts'].render();
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
        var $contentInput = this.$('.content-edit-js').toggle(this.uiState.editingContent).val(this.model.content);
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
    MainView.prototype.initialize = function (options) {
        var _this = this;
        var self = this;
        _.bindAll(this, 'clickBody');
        $('body').on('click', this.clickBody);
        this.template = Util.getTemplate('main');
        this.setElement($('#main-content'));
        this.model = new TodoAppModel();
        this.savedData = new SavedData();
        this.initializeTodoTree(this.savedData.load());
        this.listenTo(this.savedData, 'load', function () {
            // Do something intelligent.
            self.initializeTodoTree(_this.savedData.load());
            self.render();
        });
    };
    MainView.prototype.initializeTodoTree = function (data) {
        this.baseTodoModel = new TodoModel().initWithData(data, null);
        this.baseTodoModel.selected = true;
        TodoDetailView.instance.model = this.baseTodoModel;
        TodoDetailView.instance.render();
        this.savedData.watch(this.baseTodoModel);
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
    };
    MainView.prototype.keydown = function (e) {
        console.log(e.which);
        return true;
    };
    MainView.prototype.render = function () {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$('.items'));
        return this;
    };
    MainView.prototype.clickBody = function (e) {
        this.baseTodoView.trigger('click-body');
    };
    return MainView;
})(Backbone.View);
$(function () {
    window['keyboardShortcuts'] = new KeyboardShortcuts();
    var view = new TodoDetailView();
    var mainView = new MainView();
    mainView.render();
    var autosaveView = new SavedDataView({
        collection: mainView.savedData
    });
    $('body').on('keydown', function (e) {
        if (e.which === 83 && e.ctrlKey) {
            e.preventDefault();
            autosaveView.render();
            return;
        }
        for (var i = 0; i < TodoView.todoViews.length; i++) {
            if (!TodoView.todoViews[i].keydown(e))
                break; // stop propagation
        }
    });
});
//# sourceMappingURL=app.js.map