// TODO (lol)
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// * TODO: rename name to content and content to desc.
// X Make the check unicode into a checkbox
//   X and have it be draggable
// * Content on rightpanel
//   * Markdown?
// * Have the breadcrumbs in a little titlebar like thing.
// X timeago on rightpanel
// * Dragging items around
//   X Can't drag item as child of itself.
//     X Can't add item as subchild of itself.
//   * Can't drag topmost parent.
//   X Item should still be selected when you drop it.
//     X I'm going to move uiState inside of TodoModel, which should solve that problem w/o any code.
//     X This can't be done because currently TodoModels are sometimes created without views, but UiStates require views to be made.
//       X It doesn't seem like a requirement that TodoModels have to be created without views though.
//   X Drag items as children or same-level.
//   X Have to be able to stop dragging somehow.
// * Save to server
// * Generalized search
// * Individual view.
//   * breadcrumb trail visible
// * Vim like keybindings - / to go to next todo with bleh in the name, ? to go back.
// * mouseover one, highlight all
// X pay the power bill
// * listen to debussy
var SearchResult = (function (_super) {
    __extends(SearchResult, _super);
    function SearchResult() {
        _super.apply(this, arguments);
    }
    SearchResult.prototype.initialize = function () {
        this.searchMatch = 0 /* NoMatch */;
    };
    Object.defineProperty(SearchResult.prototype, "searchMatch", {
        // TODO: More DRY enum serialization
        get: function () {
            var result = this.get('searchMatch');
            if (result === 'NoMatch')
                return 0 /* NoMatch */;
            if (result === 'Match')
                return 2 /* Match */;
            if (result === 'ParentOfMatch')
                return 1 /* ParentOfMatch */;
            throw 'aaaaaaghjkl';
            return 0 /* NoMatch */;
        },
        set: function (value) {
            switch (value) {
                case 0 /* NoMatch */:
                    this.set('searchMatch', 'NoMatch');
                    break;
                case 2 /* Match */:
                    this.set('searchMatch', 'Match');
                    break;
                case 1 /* ParentOfMatch */:
                    this.set('searchMatch', 'ParentOfMatch');
                    break;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SearchResult.prototype, "isFirstMatch", {
        get: function () {
            return this.get('isFirstMatch');
        },
        set: function (value) {
            this.set('isFirstMatch', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SearchResult.prototype, "matchStart", {
        get: function () {
            return this.get('matchStart');
        },
        set: function (value) {
            this.set('matchStart', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SearchResult.prototype, "matchEnd", {
        get: function () {
            return this.get('matchEnd');
        },
        set: function (value) {
            this.set('matchEnd', value);
        },
        enumerable: true,
        configurable: true
    });
    return SearchResult;
})(Backbone.Model);
var SearchMatch;
(function (SearchMatch) {
    SearchMatch[SearchMatch["NoMatch"] = 0] = "NoMatch";
    SearchMatch[SearchMatch["ParentOfMatch"] = 1] = "ParentOfMatch";
    SearchMatch[SearchMatch["Match"] = 2] = "Match";
})(SearchMatch || (SearchMatch = {}));
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
    Util.makeDateTimeReadable = function (date) {
        return date.slice(0, -' GMT-0800 (Pacific Standard Time)'.length);
    };
    Util.fairlyLegibleDateTime = function () {
        return Util.makeDateTimeReadable(new Date().toString());
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
        this.archivalDate = '';
        this.archived = false;
        this.starred = false;
        this.searchResult = new SearchResult();
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
    /** Destroys this todo entirely. Unfortunately it currently has to go through
        the view. TODO: Investigate if we can just delete ourselves and re-render
        the parent somehow */
    TodoModel.prototype.destroy = function () {
        this.parent.view.trigger('remove-todo', this.childIndex);
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
        /** Archive or unarchive this todo, and apply that archival status to
            all children of this todo. */
        get: function () {
            return this.get('archived');
        },
        set: function (value) {
            if (this.archived === value)
                return;
            var now = Util.fairlyLegibleDateTime();
            this.set('archived', value);
            if (value) {
                this.archivalDate = now;
            }
            // Set all children to their parent's archived status. We 
            // bypass the setter because otherwise we'd have a crazy number
            // of recursive calls for deeply nested trees.
            _.each(this.flatten(), function (m) {
                m.set('archived', value);
                if (value)
                    m.archivalDate = now;
            });
            // If we're unarchiving the child (or grandchild etc.) of an unarchived item, 
            // we need to go up the tree unarchiving parents. We bypass the setter because
            // we don't want recursive unarchival in this case.
            var archivedParents = _.filter(this.pathToRoot(), function (m) { return m.archived; });
            for (var i = 0; i < archivedParents.length; i++) {
                archivedParents[i].set('archived', false);
            }
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
    Object.defineProperty(TodoModel.prototype, "archivalDate", {
        get: function () {
            return this.get('archivalDate');
        },
        set: function (value) {
            this.set('archivalDate', value);
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
    Object.defineProperty(TodoModel.prototype, "numActiveChildren", {
        /** Number of active (non-archived) children. */
        get: function () {
            return _.filter(this._children, function (m) { return !m.archived; }).length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoModel.prototype, "numActiveTotalChildren", {
        /** Number of active (non-archived) children, grand-children, and etc. */
        get: function () {
            return _.filter(this.flatten(), function (m) { return !m.archived; }).length;
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
        this.$el.html(this.template(_.extend(this.model.toJSON(), this.uiState.toJSON(), {
            createdDate: createdDateAgo
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
            'click .todo-zoom-js': this.clickZoomTodo,
            'click .todo-hide-js': this.clickHideTodo,
            'click .search-link': this.clickZoomTodo,
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
    TodoView.prototype.clickZoomTodo = function () {
        this.mainView.zoomTo(this);
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
        // If this is not a visible todo, then exit early, because having us
        // try to render our children may destroy otherwise visible nodes.
        var topmostVisibleTodo = this.mainView.model.currentTodoModel;
        if (topmostVisibleTodo) {
            var visibleTodoModels = topmostVisibleTodo.flatten();
            if (visibleTodoModels.indexOf(this.model) === -1)
                return this;
        }
        var renderOptions = _.extend({
            numActiveChildren: this.model.numActiveChildren,
            searchResultParent: false,
            searchMatch: false,
            isFirstMatch: false,
            numActiveTotalChildren: this.model.numActiveTotalChildren
        }, this.model.toJSON(), this.uiState.toJSON());
        if (this.mainView.model.searchIsOngoing) {
            var searchMatch = this.model.searchResult.searchMatch;
            if (searchMatch === 1 /* ParentOfMatch */) {
                renderOptions['searchResultParent'] = true;
            }
            if (searchMatch === 2 /* Match */) {
                var start = this.model.searchResult.matchStart;
                var end = this.model.searchResult.matchEnd;
                var name = this.model.name;
                _.extend(renderOptions, {
                    firstSearchText: name.substring(0, start),
                    middleSearchText: name.substring(start, end),
                    finalSearchText: name.substring(end),
                    isFirstMatch: this.model.searchResult.isFirstMatch,
                    searchMatch: true
                });
            }
            if (searchMatch === 2 /* Match */ || searchMatch === 1 /* ParentOfMatch */) {
                this.$el.html(this.template(renderOptions));
            }
            else {
                this.$el.empty();
                return this;
            }
        }
        else {
            this.$el.html(this.template(renderOptions));
        }
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
        var deleteable = _.filter(allTodos, function (m) { return m.archived; });
        var starred = _.filter(allTodos, function (m) { return m.starred; });
        this.hasThingsToArchive = archiveable.length > 0;
        this.numThingsToArchive = archiveable.length;
        this.hasThingsToDelete = deleteable.length > 0;
        this.numThingsToDelete = deleteable.length;
        this.firstStarredTodo = starred[0];
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
    Object.defineProperty(FooterUiState.prototype, "hasThingsToDelete", {
        get: function () {
            return this.get('hasThingsToDelete');
        },
        set: function (value) {
            this.set('hasThingsToDelete', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FooterUiState.prototype, "numThingsToDelete", {
        get: function () {
            return this.get('numThingsToDelete');
        },
        set: function (value) {
            this.set('numThingsToDelete', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FooterUiState.prototype, "firstStarredTodo", {
        get: function () {
            return this.get('firstStarredTodo');
        },
        set: function (value) {
            this.set('firstStarredTodo', value);
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
            'click .starred-item': this.gotoStarredItem,
            'click .delete-all': this.deleteAll
        };
    };
    FooterView.prototype.initialize = function (attrs) {
        this.template = Util.getTemplate('footer');
        this.archivalTemplate = Util.getTemplate('archival-footer');
        this.tabModel = attrs['tabModel'];
        this.uiState = new FooterUiState({ model: this.model });
        this.setElement($('.footer'));
        this.listenTo(this.model, 'global-change', this.render);
        this.listenTo(this.tabModel, 'change', this.render);
        this.render();
    };
    FooterView.prototype.deleteAll = function () {
        var archived = _.filter(this.model.flatten(), function (m) { return m.archived; });
        // If we've currently selected a todo that's about to be deleted, then
        // select a different one.
        if (archived.indexOf(TodoDetailView.instance.model) !== -1) {
            TodoDetailView.instance.model = this.model;
        }
        _.each(archived, function (m) { return m.destroy(); });
    };
    FooterView.prototype.gotoStarredItem = function () {
        var item = this.uiState.firstStarredTodo;
        $('html, body').animate({
            scrollTop: $(item.view.el).offset().top
        }, 150);
        return false;
    };
    FooterView.prototype.archiveAllDone = function () {
        _.each(this.model.flatten(), function (m) {
            if (m.done) {
                m.archived = true;
            }
        });
    };
    FooterView.prototype.render = function () {
        console.log(this.tabModel.currentTab);
        if (this.tabModel.currentTab === TabBarState.TabSelectionTodo) {
            this.$el.html(this.template(this.uiState.toJSON()));
        }
        else if (this.tabModel.currentTab === TabBarState.TabSelectionArchive) {
            this.$el.html(this.archivalTemplate(this.uiState.toJSON()));
        }
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
            'mouseover': this.updateDetailView,
            'click .todo-remove-js': this.removeTodoForever
        };
    };
    TodoArchiveItemView.prototype.initialize = function () {
        this.template = Util.getTemplate('todo-archive-item');
        this.listenTo(this.model.uiState, 'change', this.render);
    };
    TodoArchiveItemView.prototype.removeTodoForever = function () {
        this.model.parent.view.trigger('remove-todo', this.model.childIndex);
    };
    TodoArchiveItemView.prototype.updateDetailView = function () {
        this.model.uiState.selected = true;
        TodoDetailView.instance.model = this.model;
    };
    TodoArchiveItemView.prototype.render = function () {
        var renderOptions = _.extend({}, this.model.toJSON(), this.model.uiState.toJSON());
        this.$el.html(this.template(renderOptions));
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
    Object.defineProperty(TodoAppModel.prototype, "searchText", {
        get: function () {
            return this.get('searchText');
        },
        set: function (value) {
            this.set('searchText', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "searchIsOngoing", {
        get: function () {
            return this.get('searchIsOngoing');
        },
        set: function (value) {
            this.set('searchIsOngoing', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "selectedSearchModel", {
        get: function () {
            return this.get('selectedSearchModel');
        },
        set: function (value) {
            this.set('selectedSearchModel', value);
        },
        enumerable: true,
        configurable: true
    });
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
    Object.defineProperty(TodoAppModel.prototype, "baseTodoView", {
        get: function () {
            return this.get('baseTodoView');
        },
        set: function (value) {
            this.set('baseTodoView', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "currentTodoView", {
        get: function () {
            return this.get('currentTodoView');
        },
        set: function (value) {
            this.set('currentTodoView', value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "baseTodoModel", {
        get: function () {
            return this.baseTodoView.model;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "currentTodoModel", {
        get: function () {
            if (!this.currentTodoView) {
                return null;
            }
            return this.currentTodoView.model;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoAppModel.prototype, "currentTodoStack", {
        get: function () {
            return this.currentTodoModel.pathToRoot().reverse();
        },
        enumerable: true,
        configurable: true
    });
    return TodoAppModel;
})(Backbone.Model);
var TopBarView = (function (_super) {
    __extends(TopBarView, _super);
    function TopBarView() {
        _super.apply(this, arguments);
    }
    TopBarView.prototype.events = function () {
        return {
            'click .parent-todo': this.changeZoom,
            'keyup .search-input': this.search
        };
    };
    TopBarView.prototype.initialize = function (attrs) {
        this.template = Util.getTemplate('top-bar');
        this.setElement($('.topbar-container'));
        this.listenTo(this.model, 'change:currentTodoView', this.render);
        this.render();
    };
    TopBarView.prototype.changeZoom = function (e) {
        var index = parseInt($(e.currentTarget).data('index'));
        this.model.currentTodoView = this.model.currentTodoStack[index].view;
        return false;
    };
    TopBarView.prototype.search = function () {
        var search = this.$('.search-input').val();
        this.model.searchText = search;
        return false;
    };
    TopBarView.prototype.render = function () {
        var templateOpts = _.extend({}, this.model.toJSON(), {
            parents: this.model.currentTodoStack
        });
        this.$el.html(this.template(templateOpts));
        return this;
    };
    return TopBarView;
})(Backbone.View);
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
            self.initializeTodoTree(_this.savedData.load());
            self.render();
        });
        this.listenTo(this.model, 'change:currentTodoView', this.render);
        this.listenTo(this.model, 'change:searchText', this.updateSearch);
    };
    MainView.prototype.initializeTodoTree = function (data) {
        var baseTodoModel = new TodoModel().initWithData(data, null);
        TodoDetailView.instance.model = baseTodoModel;
        this.savedData.watch(baseTodoModel);
        this.model.baseTodoView = new TodoView({
            model: baseTodoModel,
            mainView: this
        });
        baseTodoModel.uiState.selected = true;
        this.model.currentTodoView = this.model.baseTodoView;
    };
    MainView.prototype.keydown = function (e) {
        if (e.which === 13 && $('.search-input').is(':focus')) {
            this.zoomTo(this.model.selectedSearchModel.view);
        }
        return true;
    };
    MainView.prototype.render = function () {
        this.$el.html(this.template());
        this.model.currentTodoView.render().$el.appendTo(this.$('.items'));
        return this;
    };
    MainView.prototype.clickBody = function (e) {
        _.map(this.model.currentTodoModel.flatten(), function (m) {
            m.view.trigger('click-body');
        });
    };
    MainView.prototype.zoomTo = function (todoView) {
        this.model.searchIsOngoing = false;
        this.model.currentTodoView = todoView;
    };
    MainView.prototype.updateSearch = function () {
        var search = this.model.searchText;
        var allTodos = this.model.baseTodoModel.flatten();
        var foundMatch = false;
        // clear previous search results
        _.each(allTodos, function (m) { return m.searchResult.searchMatch = 0 /* NoMatch */; });
        for (var i = 0; i < allTodos.length; i++) {
            var todo = allTodos[i];
            var matchPosition = todo.name.toLowerCase().indexOf(search.toLowerCase());
            if (matchPosition === -1)
                continue;
            var parents = todo.pathToRoot();
            todo.searchResult.searchMatch = 2 /* Match */;
            todo.searchResult.matchStart = matchPosition;
            todo.searchResult.matchEnd = matchPosition + search.length;
            todo.searchResult.isFirstMatch = !foundMatch;
            if (todo.searchResult.isFirstMatch) {
                this.model.selectedSearchModel = todo;
            }
            for (var j = 0; j < parents.length; j++) {
                if (parents[j].searchResult.searchMatch == 0 /* NoMatch */)
                    parents[j].searchResult.searchMatch = 1 /* ParentOfMatch */;
            }
            foundMatch = true;
        }
        this.model.searchIsOngoing = true;
        this.render();
    };
    return MainView;
})(Backbone.View);
var TabBarState = (function (_super) {
    __extends(TabBarState, _super);
    function TabBarState() {
        _super.apply(this, arguments);
    }
    TabBarState.prototype.initialize = function () {
        this.currentTab = 'todos';
    };
    Object.defineProperty(TabBarState.prototype, "currentTab", {
        get: function () {
            return this.get('currentTab');
        },
        set: function (value) {
            this.set('currentTab', value);
        },
        enumerable: true,
        configurable: true
    });
    TabBarState.TabSelectionTodo = 'todos';
    TabBarState.TabSelectionArchive = 'archive';
    return TabBarState;
})(Backbone.Model);
var TabBarView = (function (_super) {
    __extends(TabBarView, _super);
    function TabBarView() {
        _super.apply(this, arguments);
    }
    TabBarView.prototype.events = function () {
        return {
            'click li': this.changeTab
        };
    };
    TabBarView.prototype.initialize = function (attrs) {
        this.template = Util.getTemplate('tab-bar');
        this.model = new TabBarState();
        this.setElement($('.whole-todo-container'));
        this.render();
    };
    TabBarView.prototype.changeTab = function (e) {
        // TODO: Don't store data in view.
        var tabName = $(e.currentTarget).find('a').data('tab');
        this.model.currentTab = tabName;
    };
    TabBarView.prototype.render = function () {
        this.$el.html(this.template());
        return this;
    };
    return TabBarView;
})(Backbone.View);
$(function () {
    window['keyboardShortcuts'] = new KeyboardShortcuts();
    var tabbarView = new TabBarView();
    var detailView = new TodoDetailView();
    var mainView = new MainView();
    mainView.render();
    var topBar = new TopBarView({ model: mainView.model });
    var archiveView = new TodoArchiveView({ model: mainView.model.baseTodoModel });
    var footerView = new FooterView({
        model: mainView.model.baseTodoModel,
        tabModel: tabbarView.model
    });
    var autosaveView = new SavedDataView({
        collection: mainView.savedData
    });
    $('body').on('keydown', function (e) {
        // TODO: Move these 2 into mainview
        // Ctrl + S: Save dialog
        if (e.which === 83 && e.ctrlKey) {
            e.preventDefault();
            autosaveView.render();
            return;
        }
        // Ctrl + F (or / for vim users! :): Focus on find textbox
        if (!$('.search-input').is(':focus') && ((e.which == 70 && e.ctrlKey) || e.which == 191)) {
            $('.search-input').focus();
            return false;
        }
        for (var i = 0; i < TodoView.todoViews.length; i++) {
            if (!TodoView.todoViews[i].keydown(e)) {
                break;
            }
        }
    });
});
//# sourceMappingURL=app.js.map