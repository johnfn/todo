// TODO (lol)

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

interface ITemplate { (...data: any[]): string; }
interface ITodo {
    name: string;
    archived: boolean;
    starred: boolean;
	isHeader: boolean;
    content: string;
	createdDate: string;
	modifiedDate: string;
    depth?: number; // TODO: This really shouldn't be optional - it's currently that way bc of my dummy data
    done: boolean;
    children: ITodo[];
}

class Util {
    static getTemplate(name: string): ITemplate {
        var el: JQuery = $('#' + name);

        return _.template(el.html());
    }

	static id(a: any): any {
		return a;
	}

	static fairlyLegibleDateTime(): string {
		return (new Date()).toString().slice(0, -' GMT-0800 (Pacific Standard Time)'.length);
	}
}

class Trigger {
    private _value = false;

    get value(): boolean {
        if (this._value) {
            this._value = false;

            return true;
        }
        
        return false;
    }
    set value(value: boolean) { this._value = value; }
}

class TodoModel extends Backbone.Model implements ITodo {
    /** The TodoModel one view up (or null if there isn't one. */
    parent: TodoModel;
    view: TodoView;

    /** Unique identifier for this model */
    uid: string;

    private _children: TodoModel[] = [];

    initialize() {
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
	    this.listenTo(this, 'good-time-to-save', () => {
		    if (this.parent) {
			    this.parent.trigger('good-time-to-save');
		    }
	    });
    }

    /** recursively create this todo and all sub-todos from the provided data. */
    initWithData(data: ITodo, parent: TodoModel): TodoModel {
        for (var prop in data) {
            if (!data.hasOwnProperty(prop)) continue;
            if (prop === 'children') continue;

            this[prop] = data[prop];
        }

        this.parent = parent;

        if (!this.has('depth')) this.depth = 0;

        for (var i = 0; i < data.children.length; i++) {
            var child = data.children[i];
            child.depth = this.depth + 1;

            var childModel = new TodoModel();

            childModel.initWithData(child, this);
            this._children.push(childModel);
        }

        return this;
    }

    /** Recursively get the ITodo data of this Todo. */
    getData(): ITodo {
        var result = this.toJSON();
        result['children'] = _.map(this.children,(model: TodoModel) => model.getData());

        return result;
    }

	/** Indicate that now would be a good time to save. */
	goodTimeToSave(): void {
		this.trigger('good-time-to-save');
	}

    /** Return a list of all todos nested under this todo. */
	flatten():TodoModel[] {
		var result = [this];
		var children = this.children;

		for (var i = 0; i < children.length; i++) {
			result = result.concat(children[i].flatten());
		}

		return result;
	}

	pathToRoot(): TodoModel[] {
		var list: TodoModel[] = [];
		var current = this.parent;

		while (current != null) {
			list.push(current);
			current = current.parent;
		}

		return list;
	}

    /** What index is this model in its parent's "children" list, or -1 if it doesn't have a parent. */
    get childIndex(): number {
        if (this.parent == null) return -1;

        for (var i = 0; i < this.parent.numChildren; i++) {
            if (this.parent.children[i].uid === this.uid) {
                return i;
            }
        }

        console.error('childIndex is in weird state');

        return -1;
    }

	public get uiState(): TodoUiState { return this.view.uiState; }

    get isHeader(): boolean { return this.get('isHeader'); }
    set isHeader(value: boolean) { this.set('isHeader', value); }

    get starred(): boolean { return this.get('starred'); }
    set starred(value: boolean) { this.set('starred', value); }

    get archived(): boolean { return this.get('archived'); }
    set archived(value: boolean) {
        this.set('archived', value);

        // Also set all children to their parent's archived status. We 
        // bypass the getter because otherwise we'd have a crazy number
        // of recursive calls for deeply nested trees.

        _.each(this.flatten(), m => m.set('archived', value));
    }

    get createdDate(): string { return this.get('createdDate'); }
    set createdDate(value: string) { this.set('createdDate', value); }

    get modifiedDate(): string { return this.get('modifiedDate'); }
    set modifiedDate(value: string) { this.set('modifiedDate', value); }

    get depth(): number { return this.get('depth'); }
    set depth(value: number) { this.set('depth', value); }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); this.goodTimeToSave(); }

    get content(): string { return this.get('content'); }
    set content(value: string) { this.set('content', value); this.goodTimeToSave(); }

    get done(): boolean { return this.get('done'); }
    set done(value: boolean) { this.set('done', value); this.goodTimeToSave(); }

    get children(): TodoModel[] { return this._children || []; }

    get numChildren(): number { return this._children.length; }

    /** Returns the next child in this list of children, or null if this is the last. */
    get nextChild(): TodoModel {
        if (this.parent == null) {
            return null;
        }

        if (this.childIndex + 1 >= this.parent.numChildren) {
            return null;
        } else {
            if (this.parent == null) {
                return null;
            } else {
                return this.parent.children[this.childIndex + 1];
            }
        }
    }

    /** Returns the previous child in this list of children, or null if this is the first. */
    get previousChild(): TodoModel {
        if (this.childIndex - 1 < 0) {
            return null;
        } else {
            return this.parent.children[this.childIndex - 1];
        }
    }
}

class TodoUiState extends Backbone.Model {
	static isAnyoneEditingName: boolean;
	static isAnyoneEditingContent: boolean;

	view: TodoView;

    constructor(attrs?: any) {
        super(attrs);

        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
	    this.selected = false;
	    this.isDraggedOver = false;
	    this.isDraggedOverAsChild = false;
	    this.hidden = false;

	    if (!attrs['view']) console.error('No view assigned for TodoUiState');

	    this.view = attrs['view'];
    }


    showUiToolbarTrigger = new Trigger();
    hideUiToolbarTrigger = new Trigger();

    hiddenTrigger = new Trigger();

	get model(): TodoModel { return this.view.model; }

    /** Returns true if the user is currently editing anything. See also: editingName, editingContent. */
    get isEditing(): boolean {
        return this.addTodoVisible || this.editingName || this.editingContent;
    }

    stopAllEditing() {
        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
    }

    get addTodoVisible(): boolean { return this.get('addTodoVisible'); }
    set addTodoVisible(value: boolean) { this.set('addTodoVisible', value); }

    get hidden(): boolean { return this.get('hidden'); }
    set hidden(value: boolean) {
        this.set('hidden', value);
        this.hiddenTrigger.value = value;
    }

    get editingName(): boolean { return this.get('editingName'); }
    set editingName(value: boolean) {
	    if (TodoUiState.isAnyoneEditingName) {
		    if (value) {
			    return;
		    } else {
			    TodoUiState.isAnyoneEditingName = false;
		    }
	    } else {
		    if (value) {
			    TodoUiState.isAnyoneEditingName = true;
		    }
			// else { console.log("??? bad code ???"); }
	    }

	    this.set('editingName', value);
    }

    get editingContent(): boolean { return this.get('editingContent'); }
    set editingContent(value: boolean) {
	    if (TodoUiState.isAnyoneEditingContent) {
		    if (value) {
			    return;
		    } else {
			    TodoUiState.isAnyoneEditingContent = false;
		    }
	    } else {
		    if (value) {
			    TodoUiState.isAnyoneEditingContent = true;
		    }
			// else { console.log("??? bad code ???"); }
	    }

	     this.set('editingContent', value);
    }

    public static selectedModel: TodoUiState;

    get selected(): boolean { return this.get('selected'); }
    set selected(value: boolean) {
		if (value === this.selected) return;

		// Deselect the old one.
        if (TodoUiState.selectedModel && value) {
			// Totally refuse to change the selection during an edit.
			if (TodoUiState.selectedModel.isEditing) return;

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
    }

	static draggedOverModel: TodoUiState;

    get isDraggedOverAsChild(): boolean { return this.get('isDraggedOverAsChild'); }
    set isDraggedOverAsChild(value: boolean) {
		var oldValue = this.isDraggedOverAsChild;

	     this.set('isDraggedOverAsChild', value);

	    if (oldValue !== value && this.view) this.view.render();
    }

	get isDraggedOver(): boolean { return this.get('isDraggedOver');  }
	set isDraggedOver(value: boolean) {
		var oldValue = this.isDraggedOver;

		// Turn off the value on the previously-dragged-over element.
		if (TodoUiState.draggedOverModel && value && TodoUiState.draggedOverModel !== this) {
			TodoUiState.draggedOverModel.set('isDraggedOver', false);
			TodoUiState.draggedOverModel.set('isDraggedOverAsChild', false);
			TodoUiState.draggedOverModel.view.render();
		}

		if (value) TodoUiState.draggedOverModel = this;

		this.set('isDraggedOver', value);

		if (!value) this.isDraggedOverAsChild = false;

		if (this.view && oldValue !== value) this.view.render();
	}
}

class NewTodoView extends Backbone.View<TodoModel> {
    template: ITemplate;

    events() {
        return {
            'click .edit-add-js': 'addTodo',
            'click .edit-cancel-js': 'cancelTodo',
            'click .name-js': this.stopProp,
            'click .desc-js': this.stopProp
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        this.template = Util.getTemplate('todo-edit');
    }

    private stopProp() {
        return false;
    }

    getNameText(): string {
        return this.$('.name').first().val();
    }

    getDescText(): string {
        return this.$('.desc').first().val();
    }

    addTodo(e: JQueryMouseEventObject) {
		if (this.getNameText() === "") {
			this.trigger('cancel');

			return false;
		}

        this.model.name = this.getNameText();
        this.model.content = this.getDescText();

        this.trigger('add-todo', this.model);

        return false;
    }

    cancelTodo(e: JQueryMouseEventObject) {
        this.trigger('cancel');

        return false;
    }

    render() {
        this.$el.html(this.template());
        this.delegateEvents();

        return this;
    }
}

class TodoDetailUiState extends Backbone.Model {
	initialize() {
		this.isEditingContent = false;
	}

    get isEditingContent(): boolean { return this.get('isEditingContent'); }
    set isEditingContent(value: boolean) { this.set('isEditingContent', value); }
}

class TodoDetailView extends Backbone.View<TodoModel> {
	static instance: TodoDetailView;

	private template:ITemplate;

	private uiState:TodoDetailUiState;

    private _model:TodoModel;

    events() {
        return {
            'click .header-checkbox-js': this.toggleHeader,
            'click .archived-checkbox-js': this.unarchiveTodo,
			'click .content-js': this.toggleContent,
			'click .content-input-js': this.toggleContent
        };
    }

	initialize() {
        _.bindAll(this, 'render', 'unarchiveTodo');

		if (TodoDetailView.instance) {
			console.error('Multiple instantiation of TodoDetailView');
			return;
		}

		this.uiState = new TodoDetailUiState();
		this.template = Util.getTemplate('right-panel');
		this.setElement($('.right-panel'));

		TodoDetailView.instance = this;
	}

    unarchiveTodo() {
        this.model.archived = false;
        this.model.goodTimeToSave();

        this.render();
    }

    get model(): TodoModel { return this._model; }
    set model(value: TodoModel) {
        this._model = value;
        this.render();
    }

	toggleHeader(e:JQueryMouseEventObject) {
		this.model.isHeader = $(e.currentTarget).is(':checked');
		this.model.view.render();
		this.render();

		return false;
	}

	render():TodoDetailView {
		var createdDateAgo = $.timeago(new Date(this.model.createdDate));
		var parentNames = _.map(this.model.pathToRoot(), (model) => model.name).reverse().join(' > ');

		this.$el.html(this.template(_.extend(this.model.toJSON(), this.uiState.toJSON(), {
			createdDate: createdDateAgo,
			breadcrumbs: parentNames
		})));

        if (this.uiState.isEditingContent) {
            this.$('.content-edit-js').focus().select();
        }

		return this;
	}

	toggleContent(e: JQueryMouseEventObject) {
	    if (this.uiState.isEditingContent) {
	        this.model.content = this.$('.content-edit-js').val();
	    }

	    this.uiState.isEditingContent = !this.uiState.isEditingContent;
	}
}

class TodoView extends Backbone.View<TodoModel> {
    template: ITemplate;
    childrenViews: TodoView[];
    uiState: TodoUiState;

	/** The right-panel view for detailed todo editing. */
	detailView: TodoDetailView;

    /** The view for making a new todo. */
    editView: NewTodoView;

    /** The view associated with the entire app. */
    mainView: MainView;

    /** List of ALL todoViews. Just used for keypress handling... */
    static todoViews: TodoView[];

    events() {
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
            'click input': () => false
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleAddChildTodo', 'render', 'events', 'keydown');

        if (!TodoView.todoViews) TodoView.todoViews = [];
        TodoView.todoViews.push(this);

	    if (!options['mainView']) console.error('no mainView for TodoView');

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
    }

    editName() {
        this.model.name = $('.name-edit').val();

        return false;
    }

    toggleSetStarred() {
        this.model.starred = !this.model.starred;
        this.render();

        this.model.goodTimeToSave();

        return false;
    }

	startDrag() {
		// this.uiState.selected = true;
		this.mainView.model.isDragging = true;
	}

	// TODO: This is a bit of a (UX) hack. We want to select the item that
	// the user just started dragging, but if we were to do this.uiState.selected = true,
	// that would force a render(), which would re-render the selection box and
	// quit the drag.
	mouseoverStartDrag() {
		if (!this.mainView.model.isDragging)
			this.uiState.selected = true;

		return false;
	}

	dragTodoOver(e: JQueryMouseEventObject): boolean {
		var yOffset = (e.pageY || (<any> e.originalEvent).pageY) - $(e.currentTarget).offset().top;

		this.uiState.isDraggedOver = true;
		this.uiState.isDraggedOverAsChild = yOffset > this.$('.todo-name').height() / 2;

		return false;
	}

	drop(e: JQueryMouseEventObject): boolean {
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
		} else {
			this.model.parent.view.addChildTodo(selectedModel, this.model.childIndex + 1);
		}

		selectedModel.view.uiState.selected = true;

		this.uiState.isDraggedOver = false;
		this.mainView.model.isDragging = false;

		return false;
	}

    keydown(e: JQueryKeyEventObject): boolean {
        if (!this.uiState.selected) return true;

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
    }

    /** Given a keypress, move appropriately between todos.
        Return true to stop key event propagation. */
    private navigateBetweenTodos(which: number): boolean {
        var newSelection: TodoModel;

        if (which === 40 || which === 39) { // down
            if (this.model.numChildren !== 0) {
                newSelection = this.model.children[0];
            } else {
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

        if (which === 38) { // up
            newSelection = this.model.previousChild;

            if (newSelection == null) {
                newSelection = this.model.parent;
            } else {
                // Now we have to deal with the case where we're ASCENDING the cliff
                // I just mentioned.
                while (newSelection.numChildren !== 0) {
                    newSelection = newSelection.children[newSelection.numChildren - 1];
                }
            }
        }

        if (which === 37) { // left
            newSelection = this.model.parent;
        }

        // If they did not try to navigate invalidly, then do our updates.
        if (newSelection != null) {
            newSelection.view.uiState.selected = true;
            this.render();

            return false;
        }

        return true;
    }

    private completeTodo() {
        this.model.done = !this.model.done;

        if (this.model.done) this.model.starred = false;

		this.uiState.selected = true;

        this.render();

        return false;
    }

    private clickRemoveTodo() {
        // Can't archive topmost todo.
        if (!this.model.parent) {
            return false;
        }

        this.model.archived = true;
        debugger;

		this.model.goodTimeToSave();

        this.model.parent.view.render();

        // TODO: Reincorporate this code once I do full on deletion.
        // this.model.parent.view.trigger('remove-todo', this.model.childIndex);

	    return false;
    }

	private clickHideTodo() {
		this.uiState.hidden = !this.uiState.hidden;

		this.render();
		return false;
	}

	private removeTodo(index: number) {
		var deleted = this.childrenViews.splice(index, 1)[0];
		this.model.children.splice(index, 1);
		this.model.goodTimeToSave();

		deleted.$el.slideUp(100, this.render);
	}

    private hideAllEditNodes(e: JQueryMouseEventObject) {
        _.each(this.childrenViews,(view: TodoView) => { view.trigger('click-body'); });

        this.uiState.editingContent = false;
        this.uiState.editingName = false;
        this.uiState.addTodoVisible = false;

        this.render();
    }

    private showTodoNameEdit(e: JQueryMouseEventObject) {
        this.uiState.editingName = true;
        this.uiState.selected = true;

        this.render();

        return false;
    }

    private showTodoContentEdit(e: JQueryMouseEventObject) {
        this.uiState.editingContent = true;
        this.uiState.selected = true;

        this.render();

        return false;
    }

    private initEditView() {
        var self = this;
        this.editView = new NewTodoView();

        this.listenTo(this.editView, 'cancel', this.toggleAddChildTodo);
        this.listenTo(this.editView, 'add-todo', (model: TodoModel) => {
			self.addChildTodo(model);
            self.toggleAddChildTodo();
        });
    }

	/** Add childModel as a child of this view. */
    addChildTodo(childModel: TodoModel, index: number = -1) {
		childModel.parent = this.model;

        var newView = new TodoView(<any> { model: childModel, mainView: this.mainView });
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
    }

    toggleAddChildTodo() {
        var editModel = new TodoModel();

        editModel.parent = this.model;

        this.editView.model = editModel;

        this.uiState.addTodoVisible = !this.uiState.addTodoVisible;

        this.render();
        return false;
    }

    render(updateSidebar: boolean = true) {
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

        _.each(this.childrenViews,(child: TodoView) => {
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

	    if (updateSidebar && this.uiState.selected) {
		    TodoDetailView.instance.model = this.model;
	    }

        if (this.uiState.showUiToolbarTrigger.value) {
            this.$('.toolbar').hide().fadeIn(150);
        }

        if (this.uiState.hideUiToolbarTrigger.value) this.$('.toolbar').show().fadeOut();

        // The idea here is that if the user just triggered a 'hide children',
        // then show a nice animation rather than instantly forcing a hide. But
        // if someone called a render() on us during or after the hide was triggered,
        // this code won't run, the hide class will continue to exist and the node
        // will instantly be invisible.
        if (this.uiState.hiddenTrigger.value) {
            this.$('.children-js').removeClass('hide').fadeOut(150);
        }

	    return this;
    }

    /** Show the name text xor the name input. */
    private renderTodoName() {
        var $nameInput = this.$('.name-edit')
            .val(this.model.name);

        if (this.uiState.editingName) {
            $nameInput.select();
        }
    }

    /** Show the content text xor the content input. */
    private renderTodoContent() {
        this.$('.edit-content-js')
            .toggle(!this.uiState.editingContent);

        var $contentInput = this.$('.content-edit-js')
            .toggle(this.uiState.editingContent)
            .val(this.model.content);

        if (this.uiState.editingContent) {
            $contentInput.select();
        }
    }
}

class TodoArchiveModel extends Backbone.Model {
    
}

class TodoArchiveItemView extends Backbone.View<TodoModel> {
    template: ITemplate;

    events() {
        return {
            'mouseover': this.updateDetailView
        }
    }

    initialize() {
        this.template = Util.getTemplate('todo-archive-item');
    }

    updateDetailView() {
        TodoDetailView.instance.model = this.model;
    }

    render():TodoArchiveItemView {
        this.$el.html(this.template(this.model.toJSON()));

        return this;
    }
}

class TodoArchiveView extends Backbone.View<TodoArchiveModel> {
    template: ITemplate;
    baseTodoModel: TodoModel;

    initialize() {
        this.setElement($('#archive-js'));
        this.template = Util.getTemplate('todo-archive');
    }

    render():TodoArchiveView {
        var self = this;
        var archivedModels = _.filter(this.baseTodoModel.flatten(), m => m.archived);

        this.$el.html(this.template());

        _.each(archivedModels, m => {
            var v = new TodoArchiveItemView(<any> {
                model: m,
                el: $('<div>').appendTo(self.$('.todo-archive-list'))
            });

            v.render();
        });

        return this;
    }

    loadData(todoModel: TodoModel) {
        this.baseTodoModel = todoModel;

        this.listenTo(todoModel, "good-time-to-save", this.render);
    }
}

// Global todo state. Could keep track of breadcrumbs etc.
class TodoAppModel extends Backbone.Model {
	initialize() {
		this.isDragging = false;
	}

    get selectedTodo(): TodoModel { return this.get('selectedTodo'); }
    set selectedTodo(value: TodoModel) { this.set('selectedTodo', value); }

    get isDragging(): boolean { return this.get('isDragging'); }
    set isDragging(value: boolean) { this.set('isDragging', value); }
}

class MainView extends Backbone.View<TodoAppModel> {
    template: ITemplate;
    baseTodoModel: TodoModel;
    baseTodoView: TodoView;
	savedData: SavedData;

    initialize(options: Backbone.ViewOptions<TodoAppModel>) {
	    var self = this;
        _.bindAll(this, 'clickBody');

        $('body').on('click', this.clickBody);

        this.template = Util.getTemplate('main');
        this.setElement($('#main-content'));

        this.model = new TodoAppModel();

		this.savedData = new SavedData();
	    this.initializeTodoTree(this.savedData.load());

	    this.listenTo(this.savedData, 'load', () => {
			// Do something intelligent.
		    self.initializeTodoTree(this.savedData.load());
		    self.render();
	    });
    }

	private initializeTodoTree(data: ITodo) {
        this.baseTodoModel = new TodoModel().initWithData(data, null);

		TodoDetailView.instance.model = this.baseTodoModel;

	    this.savedData.watch(this.baseTodoModel);

        this.baseTodoView = new TodoView(<any> {
            model: this.baseTodoModel,
            mainView: this
        });

		this.baseTodoModel.uiState.selected = true;
	}

    keydown(e: JQueryKeyEventObject): boolean {
        return true;
    }

    render(): Backbone.View<TodoAppModel> {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$('.items'));

        return this;
    }

    private clickBody(e: JQueryMouseEventObject) {
        this.baseTodoView.trigger('click-body');
    }
}

$(() => {
    window['keyboardShortcuts'] = new KeyboardShortcuts();

	var detailView = new TodoDetailView();

    var mainView = new MainView();
    mainView.render();

    var archiveView = new TodoArchiveView();
    archiveView.loadData(mainView.baseTodoModel);
    archiveView.render();

	var autosaveView = new SavedDataView(<any> {
		collection: mainView.savedData
	});

    $('body').on('keydown',(e: JQueryKeyEventObject) => {
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
