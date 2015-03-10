﻿// TODO (lol)

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
    archivalDate: string;
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

    static makeDateTimeReadable(date: string): string {
		return date.slice(0, -' GMT-0800 (Pacific Standard Time)'.length);
    }

	static fairlyLegibleDateTime(): string {
	    return Util.makeDateTimeReadable(new Date().toString());
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
        this.archivalDate = '';
        this.archived = false;
        this.starred = false;

		// Pass this event up the hierarchy, so we can use it in SavedData.
	    this.listenTo(this, 'global-change', () => {
		    if (this.parent) {
			    this.parent.trigger('global-change');
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
		this.trigger('global-change');
	}

    /** Destroys this todo entirely. Unfortunately it currently has to go through
        the view. TODO: Investigate if we can just delete ourselves and re-render
        the parent somehow */
    destroy(): void {
        this.parent.view.trigger('remove-todo', this.childIndex);
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
    set starred(value: boolean) {
        this.set('starred', value);
        this.goodTimeToSave();
    }

    /** Archive or unarchive this todo, and apply that archival status to
        all children of this todo. */
    get archived(): boolean { return this.get('archived'); }
    set archived(value: boolean) {
        if (this.archived === value) return;

        var now = Util.fairlyLegibleDateTime();
        this.set('archived', value);

        if (value) {
            this.archivalDate = now;
        }

        // Set all children to their parent's archived status. We 
        // bypass the setter because otherwise we'd have a crazy number
        // of recursive calls for deeply nested trees.

        _.each(this.flatten(), m => {
            m.set('archived', value);
            if (value) m.archivalDate = now;
        });

        // If we're unarchiving the child (or grandchild etc.) of an unarchived item, 
        // we need to go up the tree unarchiving parents. We bypass the setter because
        // we don't want recursive unarchival in this case.

        var currentParent = this.parent;
        while (currentParent != null && currentParent.archived) {
            currentParent.set('archived', false);

            currentParent = currentParent.parent;
        }
        
        this.goodTimeToSave();
    }

    get createdDate(): string { return this.get('createdDate'); }
    set createdDate(value: string) { this.set('createdDate', value); }

    get modifiedDate(): string { return this.get('modifiedDate'); }
    set modifiedDate(value: string) { this.set('modifiedDate', value); }

    get depth(): number { return this.get('depth'); }
    set depth(value: number) { this.set('depth', value); }

    get archivalDate(): string { return this.get('archivalDate'); }
    set archivalDate(value: string) { this.set('archivalDate', value); }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); this.goodTimeToSave(); }

    get content(): string { return this.get('content'); }
    set content(value: string) { this.set('content', value); this.goodTimeToSave(); }

    get done(): boolean { return this.get('done'); }
    set done(value: boolean) { this.set('done', value); this.goodTimeToSave(); }

    get children(): TodoModel[] { return this._children || []; }

    get numChildren(): number { return this._children.length; }

    /** Number of active (non-archived) children. */
    get numActiveChildren(): number {
        return _.filter(this._children, m => !m.archived).length;
    }

    /** Number of active (non-archived) children, grand-children, and etc. */
    get numActiveTotalChildren(): number {
        return _.filter(this.flatten(), m => !m.archived).length;
    }

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
		    'click .todo-zoom-js': this.clickZoomTodo,
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

    private clickZoomTodo() {
        this.mainView.zoomTo(this);

        return false;
    }

    private clickRemoveTodo() {
        // Can't archive topmost todo.
        if (!this.model.parent) {
            return false;
        }

        this.model.archived = true;
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
        var renderOptions = _.extend({
            numActiveChildren: this.model.numActiveChildren,
            numActiveTotalChildren: this.model.numActiveTotalChildren
        } , this.model.toJSON()
          , this.uiState.toJSON());

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

	    if (updateSidebar && this.uiState.selected && this.$el.is(':visible')) {
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

class FooterUiState extends Backbone.Model {
    baseTodoModel: TodoModel;

    constructor(attrs?: any) {
        super(attrs);

        this.baseTodoModel = attrs['model'];

        this.listenTo(this.baseTodoModel, 'global-change', this.updateState);
        this.updateState();
    }

    updateState() {
        var allTodos = this.baseTodoModel.flatten();

        var archiveable = _.filter(allTodos, m => !m.archived && m.done);
        var deleteable  = _.filter(allTodos, m => m.archived);
        var starred     = _.filter(allTodos, m => m.starred);

        this.hasThingsToArchive = archiveable.length > 0;
        this.numThingsToArchive = archiveable.length;

        this.hasThingsToDelete = deleteable.length > 0;
        this.numThingsToDelete = deleteable.length;

        this.firstStarredTodo = starred[0];
    }

    get hasThingsToArchive(): boolean { return this.get('hasThingsToArchive'); }
    set hasThingsToArchive(value: boolean) { this.set('hasThingsToArchive', value); }

    get numThingsToArchive(): number { return this.get('numThingsToArchive'); }
    set numThingsToArchive(value: number) { this.set('numThingsToArchive', value); }

    get hasThingsToDelete(): boolean { return this.get('hasThingsToDelete'); }
    set hasThingsToDelete(value: boolean) { this.set('hasThingsToDelete', value); }

    get numThingsToDelete(): number { return this.get('numThingsToDelete'); }
    set numThingsToDelete(value: number) { this.set('numThingsToDelete', value); }

    get firstStarredTodo(): TodoModel { return this.get('firstStarredTodo'); }
    set firstStarredTodo(value: TodoModel) { this.set('firstStarredTodo', value); }
}

class FooterView extends Backbone.View<TodoModel> {
    template: ITemplate;
    archivalTemplate: ITemplate;
    uiState: FooterUiState;
    tabModel: TabBarState;

    events() {
        return {
            'click .archive-all': this.archiveAllDone,
            'click .starred-item': this.gotoStarredItem,
            'click .delete-all': this.deleteAll
        };
    }

    initialize(attrs:any) {
        this.template = Util.getTemplate('footer');
        this.archivalTemplate = Util.getTemplate('archival-footer');
        this.tabModel = attrs['tabModel'];

        this.uiState = new FooterUiState({ model: this.model });
        this.setElement($('.footer'));

        this.listenTo(this.model, 'global-change', this.render);
        this.listenTo(this.tabModel, 'change', this.render);
        this.render();
    }

    deleteAll() {
        var archived = _.filter(this.model.flatten(), m => m.archived);

        // If we've currently selected a todo that's about to be deleted, then
        // select a different one.
        if (archived.indexOf(TodoDetailView.instance.model) !== -1) {
            TodoDetailView.instance.model = this.model;
        }

        _.each(archived, m => m.destroy());
    }

    gotoStarredItem() {
        var item = this.uiState.firstStarredTodo;

        $('html, body').animate({
            scrollTop: $(item.view.el).offset().top
        }, 150);

        return false;
    }

    archiveAllDone() {
        _.each(this.model.flatten(), (m) => {
            if (m.done) {
                m.archived = true;
            }
        });
    }

    render():FooterView {
        console.log(this.tabModel.currentTab);

        if (this.tabModel.currentTab === TabBarState.TabSelectionTodo) {
            this.$el.html(this.template(this.uiState.toJSON()));
        } else if (this.tabModel.currentTab === TabBarState.TabSelectionArchive) {
            this.$el.html(this.archivalTemplate(this.uiState.toJSON()));
        }

        return this;
    }
}

class TodoArchiveItemView extends Backbone.View<TodoModel> {
    template: ITemplate;

    events() {
        return {
            'mouseover': this.updateDetailView,
            'click .todo-remove-js': this.removeTodoForever
        }
    }

    initialize() {
        this.template = Util.getTemplate('todo-archive-item');

        this.listenTo(this.model.uiState, 'change', this.render);
    }

    removeTodoForever() {
        this.model.parent.view.trigger('remove-todo', this.model.childIndex);
    }

    updateDetailView() {
        this.model.uiState.selected = true;

        TodoDetailView.instance.model = this.model;
    }

    render():TodoArchiveItemView {
		var renderOptions = _.extend({ }, this.model.toJSON(), this.model.uiState.toJSON());

        this.$el.html(this.template(renderOptions));

        return this;
    }
}

class TodoArchiveView extends Backbone.View<TodoModel> {
    template: ITemplate;

    initialize(attrs:Backbone.ViewOptions<TodoModel>) {
        this.setElement($('#archive-js'));
        this.template = Util.getTemplate('todo-archive');

        this.listenTo(this.model, 'global-change', this.render);

        this.render();
    }

    render():TodoArchiveView {
        var self = this;
        var archivedModels = _.filter(this.model.flatten(), m => m.archived);

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

    get baseTodoView(): TodoView { return this.get('baseTodoView'); }
    set baseTodoView(value: TodoView) { this.set('baseTodoView', value); }

    get currentTodoView(): TodoView { return this.get('currentTodoView'); }
    set currentTodoView(value: TodoView) { this.set('currentTodoView', value); }

    get baseTodoModel(): TodoModel { return this.baseTodoView.model;  }

    get currentTodoModel(): TodoModel { return this.currentTodoView.model;  }
}

class TopBarView extends Backbone.View<TodoAppModel> {
    template: ITemplate;

    initialize(attrs?: any) {
        this.template = Util.getTemplate('top-bar');
        this.setElement($('.topbar-container'));

        this.render();
    }

    render():TopBarView {
        this.$el.html(this.template());

        return this;
    }
}

class MainView extends Backbone.View<TodoAppModel> {
    template: ITemplate;
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
		    self.initializeTodoTree(this.savedData.load());
		    self.render();
	    });
    }

	private initializeTodoTree(data: ITodo) {
        var baseTodoModel = new TodoModel().initWithData(data, null);

		TodoDetailView.instance.model = baseTodoModel;

	    this.savedData.watch(baseTodoModel);

        this.model.baseTodoView = new TodoView(<any> {
            model: baseTodoModel,
            mainView: this
        });

		baseTodoModel.uiState.selected = true;
	    this.model.currentTodoView = this.model.baseTodoView;
	}

    keydown(e: JQueryKeyEventObject): boolean {
        return true;
    }

    render(): Backbone.View<TodoAppModel> {
        this.$el.html(this.template);
        this.model.currentTodoView.render().$el.appendTo(this.$('.items'));

        return this;
    }

    private clickBody(e: JQueryMouseEventObject) {
        _.map(this.model.baseTodoModel.flatten(), m => {
            m.view.trigger('click-body');
        });
    }

    zoomTo(todoView: TodoView) {
        this.model.currentTodoView = todoView;

        this.render();
    }
}

class TabBarState extends Backbone.Model {
    static TabSelectionTodo = 'todos';
    static TabSelectionArchive = 'archive';

    initialize() {
        this.currentTab = 'todos';
    }

    get currentTab(): string { return this.get('currentTab'); }
    set currentTab(value: string) { this.set('currentTab', value); }
}

class TabBarView extends Backbone.View<TabBarState> {
    template: ITemplate;

    events() {
        return {
            'click li': this.changeTab
        };
    }

    initialize(attrs?: any) {
        this.template = Util.getTemplate('tab-bar');
        this.model = new TabBarState();

        this.setElement($('.whole-todo-container'));

        this.render();
    }

    changeTab(e: JQueryMouseEventObject) {
        // TODO: Don't store data in view.
        var tabName = $(e.currentTarget).find('a').data('tab');

        this.model.currentTab = tabName;
    }

    render(): TabBarView {
        this.$el.html(this.template());

        return this;
    }
}

$(() => {
    window['keyboardShortcuts'] = new KeyboardShortcuts();

    var tabbarView = new TabBarView();

	var detailView = new TodoDetailView();

    var mainView = new MainView();
    mainView.render();

    var topBar = new TopBarView(<any> { model: mainView.model });

    var archiveView = new TodoArchiveView(<any> { model: mainView.model.baseTodoModel });
    var footerView = new FooterView(<any> {
        model: mainView.model.baseTodoModel,
        tabModel: tabbarView.model
    });

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
