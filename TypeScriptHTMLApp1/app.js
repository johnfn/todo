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
        return (new Date()).toString().slice(0, -' GMT-0800 (Pacific Standard Time)'.length);
    };
    return Util;
})();
var Trigger = (function () {
    function Trigger() {
        this._value = false;
    }
    Object.defineProperty(Trigger.prototype, "value", {
        get: function () {
            if (this._value) {
                this._value = false;
                return true;
            }
            return false;
        },
        set: function (value) {
            this._value = value;
        },
        enumerable: true,
        configurable: true
    });
    return Trigger;
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
        this.childIndex = -1;
        this.isHeader = false;
        this.uid = Math.random() + ' ' + Math.random();
        this.createdDate = (new Date()).toString();
        this.modifiedDate = (new Date()).toString();
        this.archived = false;
        this.starred = false;
        // Pass this event up the hierarchy, so we can use it in SavedData.
        this.listenTo(this, 'global-change', function () {
            if (_this.parent) {
                _this.parent.trigger('global-change');
            }
        });
    };
    /** recursively create this todo and all sub-todos from the provided data. */
    TodoModel.prototype.initWithData = function (data, parent) {
        for (var prop in data) {
            if (!data.hasOwnProperty(prop))
                continue;
            if (prop === 'children')
                continue;
            this[prop] = data[prop];
        }
        this.parent = parent;
        if (!this.has('depth'))
            this.depth = 0;
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
        this.trigger('global-change');
    };
    /** Return a list of all todos nested under this todo. */
    TodoModel.prototype.flatten = function () {
        var result = [this];
        var children = this.children;
        for (var i = 0; i < children.length; i++) {
            result = result.concat(children[i].flatten());
        }
        return result;
    };
    TodoModel.prototype.pathToRoot = function () {
        var list = [];
        var current = this.parent;
        while (current != null) {
            list.push(current);
            current = current.parent;
        }
        return list;
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
            return -1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "uiState", {
        get: function () {
            return this.view.uiState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "isHeader", {
        get: function () {
            return this.get('isHeader');
        },
        set: function (value) {
            this.set('isHeader', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "starred", {
        get: function () {
            return this.get('starred');
        },
        set: function (value) {
            this.set('starred', value);
            this.goodTimeToSave();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "archived", {
        get: function () {
            return this.get('archived');
        },
        set: function (value) {
            if (this.archived === value)
                return;
            this.set('archived', value);
            // Also set all children to their parent's archived status. We 
            // bypass the getter because otherwise we'd have a crazy number
            // of recursive calls for deeply nested trees.
            _.each(this.flatten(), function (m) { return m.set('archived', value); });
            this.goodTimeToSave();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "createdDate", {
        get: function () {
            return this.get('createdDate');
        },
        set: function (value) {
            this.set('createdDate', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "modifiedDate", {
        get: function () {
            return this.get('modifiedDate');
        },
        set: function (value) {
            this.set('modifiedDate', value);
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
    Object.defineProperty(TodoModel.prototype, "children", {
        get: function () {
            return this._children || [];
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
            if (this.parent == null) {
                return null;
            }
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
        this.showUiToolbarTrigger = new Trigger();
        this.hideUiToolbarTrigger = new Trigger();
        this.hiddenTrigger = new Trigger();
        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
        this.selected = false;
        this.isDraggedOver = false;
        this.isDraggedOverAsChild = false;
        this.hidden = false;
        if (!attrs['view'])
            console.error('No view assigned for TodoUiState');
        this.view = attrs['view'];
    }
    Object.defineProperty(TodoUiState.prototype, "model", {
        get: function () {
            return this.view.model;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "isEditing", {
        /** Returns true if the user is currently editing anything. See also: editingName, editingContent. */
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
    Object.defineProperty(TodoUiState.prototype, "hidden", {
        get: function () {
            return this.get('hidden');
        },
        set: function (value) {
            this.set('hidden', value);
            this.hiddenTrigger.value = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "editingName", {
        get: function () {
            return this.get('editingName');
        },
        set: function (value) {
            if (TodoUiState.isAnyoneEditingName) {
                if (value) {
                    return;
                }
                else {
                    TodoUiState.isAnyoneEditingName = false;
                }
            }
            else {
                if (value) {
                    TodoUiState.isAnyoneEditingName = true;
                }
            }
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
            if (TodoUiState.isAnyoneEditingContent) {
                if (value) {
                    return;
                }
                else {
                    TodoUiState.isAnyoneEditingContent = false;
                }
            }
            else {
                if (value) {
                    TodoUiState.isAnyoneEditingContent = true;
                }
            }
            this.set('editingContent', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "selected", {
        get: function () {
            return this.get('selected');
        },
        set: function (value) {
            if (value === this.selected)
                return;
            // Deselect the old one.
            if (TodoUiState.selectedModel && value) {
                // Totally refuse to change the selection during an edit.
                if (TodoUiState.selectedModel.isEditing)
                    return;
                TodoUiState.selectedModel.set('selected', false); // don't infinitely recurse
                TodoUiState.selectedModel.hideUiToolbarTrigger.value = true;
                TodoUiState.selectedModel.view.render(false);
            }
            if (value) {
                TodoUiState.selectedModel = this;
                this.showUiToolbarTrigger.value = true;
                this.trigger('selected');
            }
            this.set('selected', value);
            if (this.view) {
                this.view.render(value);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "isDraggedOverAsChild", {
        get: function () {
            return this.get('isDraggedOverAsChild');
        },
        set: function (value) {
            var oldValue = this.isDraggedOverAsChild;
            this.set('isDraggedOverAsChild', value);
            if (oldValue !== value && this.view)
                this.view.render();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoUiState.prototype, "isDraggedOver", {
        get: function () {
            return this.get('isDraggedOver');
        },
        set: function (value) {
            var oldValue = this.isDraggedOver;
            // Turn off the value on the previously-dragged-over element.
            if (TodoUiState.draggedOverModel && value && TodoUiState.draggedOverModel !== this) {
                TodoUiState.draggedOverModel.set('isDraggedOver', false);
                TodoUiState.draggedOverModel.set('isDraggedOverAsChild', false);
                TodoUiState.draggedOverModel.view.render();
            }
            if (value)
                TodoUiState.draggedOverModel = this;
            this.set('isDraggedOver', value);
            if (!value)
                this.isDraggedOverAsChild = false;
            if (this.view && oldValue !== value)
                this.view.render();
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
var TodoDetailUiState = (function (_super) {
    __extends(TodoDetailUiState, _super);
    function TodoDetailUiState() {
        _super.apply(this, arguments);
    }
    TodoDetailUiState.prototype.initialize = function () {
        this.isEditingContent = false;
    };
    Object.defineProperty(TodoDetailUiState.prototype, "isEditingContent", {
        get: function () {
            return this.get('isEditingContent');
        },
        set: function (value) {
            this.set('isEditingContent', value);
        },
        enumerable: true,
        configurable: true
    });
    return TodoDetailUiState;
})(Backbone.Model);
var TodoDetailView = (function (_super) {
    __extends(TodoDetailView, _super);
    function TodoDetailView() {
        _super.apply(this, arguments);
    }
    TodoDetailView.prototype.events = function () {
        return {
            'click .header-checkbox-js': this.toggleHeader,
            'click .archived-checkbox-js': this.unarchiveTodo,
            'click .content-js': this.toggleContent,
            'click .content-input-js': this.toggleContent
        };
    };
    TodoDetailView.prototype.initialize = function () {
        _.bindAll(this, 'render', 'unarchiveTodo');
        if (TodoDetailView.instance) {
            console.error('Multiple instantiation of TodoDetailView');
            return;
        }
        this.uiState = new TodoDetailUiState();
        this.template = Util.getTemplate('right-panel');
        this.setElement($('.right-panel'));
        TodoDetailView.instance = this;
    };
    TodoDetailView.prototype.unarchiveTodo = function () {
        this.model.archived = false;
        this.render();
    };
    Object.defineProperty(TodoDetailView.prototype, "model", {
        get: function () {
            return this._model;
        },
        set: function (value) {
            this._model = value;
            this.render();
        },
        enumerable: true,
        configurable: true
    });
    TodoDetailView.prototype.toggleHeader = function (e) {
        this.model.isHeader = $(e.currentTarget).is(':checked');
        this.model.view.render();
        this.render();
        return false;
    };
    TodoDetailView.prototype.render = function () {
        var createdDateAgo = $.timeago(new Date(this.model.createdDate));
        var parentNames = _.map(this.model.pathToRoot(), function (model) { return model.name; }).reverse().join(' > ');
        this.$el.html(this.template(_.extend(this.model.toJSON(), this.uiState.toJSON(), {
            createdDate: createdDateAgo,
            breadcrumbs: parentNames
        })));
        if (this.uiState.isEditingContent) {
            this.$('.content-edit-js').focus().select();
        }
        return this;
    };
    TodoDetailView.prototype.toggleContent = function (e) {
        if (this.uiState.isEditingContent) {
            this.model.content = this.$('.content-edit-js').val();
        }
        this.uiState.isEditingContent = !this.uiState.isEditingContent;
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
            'click .todo-set-starred-js': this.toggleSetStarred,
            'click .todo-done-js': this.completeTodo,
            'click .todo-remove-js': this.clickRemoveTodo,
            'click .todo-hide-js': this.clickHideTodo,
            'keyup .name-edit': this.editName,
            'dragstart .todo-done-js': this.startDrag,
            'mouseover': this.mouseoverStartDrag,
            // 'mouseout': () => console.log('out'), (triggers all the time for some reason)
            'dragover': this.dragTodoOver,
            'drop': this.drop,
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
        if (!options['mainView'])
            console.error('no mainView for TodoView');
        this.mainView = options['mainView'];
        this.template = Util.getTemplate('todo');
        this.childrenViews = [];
        this.uiState = new TodoUiState({ view: this });
        this.model.view = this;
        this.initEditView();
        for (var i = 0; i < this.model.children.length; i++) {
            this.addChildTodo(this.model.children[i]);
        }
        this.listenTo(this, 'click-body', this.hideAllEditNodes);
        this.listenTo(this, 'remove-todo', this.removeTodo);
    };
    TodoView.prototype.editName = function () {
        this.model.name = $('.name-edit').val();
        return false;
    };
    TodoView.prototype.toggleSetStarred = function () {
        this.model.starred = !this.model.starred;
        this.render();
        return false;
    };
    TodoView.prototype.startDrag = function () {
        // this.uiState.selected = true;
        this.mainView.model.isDragging = true;
    };
    // TODO: This is a bit of a (UX) hack. We want to select the item that
    // the user just started dragging, but if we were to do this.uiState.selected = true,
    // that would force a render(), which would re-render the selection box and
    // quit the drag.
    TodoView.prototype.mouseoverStartDrag = function () {
        if (!this.mainView.model.isDragging)
            this.uiState.selected = true;
        return false;
    };
    TodoView.prototype.dragTodoOver = function (e) {
        var yOffset = (e.pageY || e.originalEvent.pageY) - $(e.currentTarget).offset().top;
        this.uiState.isDraggedOver = true;
        this.uiState.isDraggedOverAsChild = yOffset > this.$('.todo-name').height() / 2;
        return false;
    };
    TodoView.prototype.drop = function (e) {
        var selectedModel = TodoUiState.selectedModel.model;
        var parentView = selectedModel.parent.view;
        // TODO: Check if the position we're adding at is a
        // child of the selectedModel at all and quit if so.
        if (selectedModel === this.model || selectedModel.flatten().indexOf(this.model) !== -1) {
            this.uiState.isDraggedOver = false;
            this.uiState.isDraggedOverAsChild = false;
            this.mainView.model.isDragging = false;
            return false;
        }
        parentView.removeTodo(selectedModel.childIndex);
        if (this.uiState.isDraggedOverAsChild) {
            this.addChildTodo(selectedModel);
        }
        else {
            this.model.parent.view.addChildTodo(selectedModel, this.model.childIndex + 1);
        }
        selectedModel.view.uiState.selected = true;
        this.uiState.isDraggedOver = false;
        this.mainView.model.isDragging = false;
        return false;
    };
    TodoView.prototype.keydown = function (e) {
        if (!this.uiState.selected)
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
            newSelection.view.uiState.selected = true;
            this.render();
            return false;
        }
        return true;
    };
    TodoView.prototype.completeTodo = function () {
        this.model.done = !this.model.done;
        if (this.model.done)
            this.model.starred = false;
        this.uiState.selected = true;
        this.render();
        return false;
    };
    TodoView.prototype.clickRemoveTodo = function () {
        // Can't archive topmost todo.
        if (!this.model.parent) {
            return false;
        }
        this.model.archived = true;
        this.model.parent.view.render();
        // TODO: Reincorporate this code once I do full on deletion.
        // this.model.parent.view.trigger('remove-todo', this.model.childIndex);
        return false;
    };
    TodoView.prototype.clickHideTodo = function () {
        this.uiState.hidden = !this.uiState.hidden;
        this.render();
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
        this.uiState.selected = true;
        this.render();
        return false;
    };
    TodoView.prototype.showTodoContentEdit = function (e) {
        this.uiState.editingContent = true;
        this.uiState.selected = true;
        this.render();
        return false;
    };
    TodoView.prototype.initEditView = function () {
        var self = this;
        this.editView = new NewTodoView();
        this.listenTo(this.editView, 'cancel', this.toggleAddChildTodo);
        this.listenTo(this.editView, 'add-todo', function (model) {
            self.addChildTodo(model);
            self.toggleAddChildTodo();
        });
    };
    /** Add childModel as a child of this view. */
    TodoView.prototype.addChildTodo = function (childModel, index) {
        if (index === void 0) { index = -1; }
        childModel.parent = this.model;
        var newView = new TodoView({ model: childModel, mainView: this.mainView });
        index = index !== -1 ? index : this.childrenViews.length;
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
        var editModel = new TodoModel();
        editModel.parent = this.model;
        this.editView.model = editModel;
        this.uiState.addTodoVisible = !this.uiState.addTodoVisible;
        this.render();
        return false;
    };
    TodoView.prototype.render = function (updateSidebar) {
        if (updateSidebar === void 0) { updateSidebar = true; }
        var renderOptions = _.extend({ numChildren: this.model.numChildren }, this.model.toJSON(), this.uiState.toJSON());
        this.$el.html(this.template(renderOptions));
        var $childrenContainer = this.$('.children-js');
        var $addTodo = this.$('.todo-add');
        // Update state per uiState
        $addTodo.toggle(this.uiState.addTodoVisible);
        this.renderTodoName();
        this.renderTodoContent();
        this.delegateEvents(); // We might lose our own events. D:
        // render children
        _.each(this.childrenViews, function (child) {
            if (!child.model.archived) {
                child.render(false).$el.appendTo($childrenContainer);
            }
        });
        this.editView.render().$el.appendTo($addTodo);
        if (this.uiState.addTodoVisible) {
            this.$('.name').focus();
        }
        window['keyboardShortcuts'].setModel(this.uiState);
        window['keyboardShortcuts'].render();
        if (updateSidebar && this.uiState.selected && this.$el.is(':visible')) {
            TodoDetailView.instance.model = this.model;
        }
        if (this.uiState.showUiToolbarTrigger.value) {
            this.$('.toolbar').hide().fadeIn(150);
        }
        if (this.uiState.hideUiToolbarTrigger.value)
            this.$('.toolbar').show().fadeOut();
        // The idea here is that if the user just triggered a 'hide children',
        // then show a nice animation rather than instantly forcing a hide. But
        // if someone called a render() on us during or after the hide was triggered,
        // this code won't run, the hide class will continue to exist and the node
        // will instantly be invisible.
        if (this.uiState.hiddenTrigger.value) {
            this.$('.children-js').removeClass('hide').fadeOut(150);
        }
        return this;
    };
    /** Show the name text xor the name input. */
    TodoView.prototype.renderTodoName = function () {
        var $nameInput = this.$('.name-edit').val(this.model.name);
        if (this.uiState.editingName) {
            $nameInput.select();
        }
    };
    /** Show the content text xor the content input. */
    TodoView.prototype.renderTodoContent = function () {
        this.$('.edit-content-js').toggle(!this.uiState.editingContent);
        var $contentInput = this.$('.content-edit-js').toggle(this.uiState.editingContent).val(this.model.content);
        if (this.uiState.editingContent) {
            $contentInput.select();
        }
    };
    return TodoView;
})(Backbone.View);
var FooterUiState = (function (_super) {
    __extends(FooterUiState, _super);
    function FooterUiState(attrs) {
        _super.call(this, attrs);
        this.baseTodoModel = attrs['model'];
        this.listenTo(this.baseTodoModel, 'global-change', this.updateState);
        this.updateState();
    }
    FooterUiState.prototype.updateState = function () {
        var allTodos = this.baseTodoModel.flatten();
        var archiveable = _.filter(allTodos, function (m) { return !m.archived && m.done; });
        var starred = _.filter(allTodos, function (m) { return m.starred; });
        this.hasThingsToArchive = archiveable.length > 0;
        this.numThingsToArchive = archiveable.length;
        this.firstStarred = starred[0];
    };
    Object.defineProperty(FooterUiState.prototype, "hasThingsToArchive", {
        get: function () {
            return this.get('hasThingsToArchive');
        },
        set: function (value) {
            this.set('hasThingsToArchive', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FooterUiState.prototype, "numThingsToArchive", {
        get: function () {
            return this.get('numThingsToArchive');
        },
        set: function (value) {
            this.set('numThingsToArchive', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FooterUiState.prototype, "firstStarred", {
        get: function () {
            return this.get('firstStarred');
        },
        set: function (value) {
            this.set('firstStarred', value);
        },
        enumerable: true,
        configurable: true
    });
    return FooterUiState;
})(Backbone.Model);
var FooterView = (function (_super) {
    __extends(FooterView, _super);
    function FooterView() {
        _super.apply(this, arguments);
    }
    FooterView.prototype.events = function () {
        return {
            'click .archive-all': this.archiveAllDone,
            'click .starred-item': this.gotoStarredItem
        };
    };
    FooterView.prototype.initialize = function () {
        this.template = Util.getTemplate('footer');
        this.uiState = new FooterUiState({ model: this.model });
        this.setElement($('.footer'));
        this.render();
        this.listenTo(this.model, 'global-change', this.render);
    };
    FooterView.prototype.gotoStarredItem = function () {
        $('html, body').animate({
            scrollTop: $("#elementtoScrollToID").offset().top
        }, 2000);
    };
    FooterView.prototype.archiveAllDone = function () {
        _.each(this.model.flatten(), function (m) {
            if (m.done) {
                m.archived = true;
            }
        });
    };
    FooterView.prototype.render = function () {
        this.$el.html(this.template(this.uiState.toJSON()));
        return this;
    };
    return FooterView;
})(Backbone.View);
var TodoArchiveItemView = (function (_super) {
    __extends(TodoArchiveItemView, _super);
    function TodoArchiveItemView() {
        _super.apply(this, arguments);
    }
    TodoArchiveItemView.prototype.events = function () {
        return {
            'mouseover': this.updateDetailView
        };
    };
    TodoArchiveItemView.prototype.initialize = function () {
        this.template = Util.getTemplate('todo-archive-item');
    };
    TodoArchiveItemView.prototype.updateDetailView = function () {
        TodoDetailView.instance.model = this.model;
    };
    TodoArchiveItemView.prototype.render = function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    };
    return TodoArchiveItemView;
})(Backbone.View);
var TodoArchiveView = (function (_super) {
    __extends(TodoArchiveView, _super);
    function TodoArchiveView() {
        _super.apply(this, arguments);
    }
    TodoArchiveView.prototype.initialize = function (attrs) {
        this.setElement($('#archive-js'));
        this.template = Util.getTemplate('todo-archive');
        this.listenTo(this.model, 'global-change', this.render);
        this.render();
    };
    TodoArchiveView.prototype.render = function () {
        var self = this;
        var archivedModels = _.filter(this.model.flatten(), function (m) { return m.archived; });
        this.$el.html(this.template());
        _.each(archivedModels, function (m) {
            var v = new TodoArchiveItemView({
                model: m,
                el: $('<div>').appendTo(self.$('.todo-archive-list'))
            });
            v.render();
        });
        return this;
    };
    return TodoArchiveView;
})(Backbone.View);
// Global todo state. Could keep track of breadcrumbs etc.
var TodoAppModel = (function (_super) {
    __extends(TodoAppModel, _super);
    function TodoAppModel() {
        _super.apply(this, arguments);
    }
    TodoAppModel.prototype.initialize = function () {
        this.isDragging = false;
    };
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
    Object.defineProperty(TodoAppModel.prototype, "isDragging", {
        get: function () {
            return this.get('isDragging');
        },
        set: function (value) {
            this.set('isDragging', value);
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
        TodoDetailView.instance.model = this.baseTodoModel;
        this.savedData.watch(this.baseTodoModel);
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
        this.baseTodoModel.uiState.selected = true;
    };
    MainView.prototype.keydown = function (e) {
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
    var detailView = new TodoDetailView();
    var mainView = new MainView();
    mainView.render();
    var archiveView = new TodoArchiveView({ model: mainView.baseTodoModel });
    var footerView = new FooterView({ model: mainView.baseTodoModel });
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