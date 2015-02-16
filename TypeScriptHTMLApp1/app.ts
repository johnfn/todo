// TODO (lol)

// X Escape to cancel editing
// X You shouldn't be able to navigate while editing.
// X Shift + Enter inside text to edit description
//   * Annoyingly it doesn't select properly yet.
// * Save to disk
//   * I want some sort of procedural back up thing. I don't want to lose my data.
//     * 'Current' buffer which is constantly being saved to
//     * Rotating circular backup buffer to which the idx is updated every hour or so.
//     * Overlay that shows all recent backups.
// * Individual view.
// * Vim like keybindings - / to go to next todo with bleh in the name, ? to go back.
// * Save to server
// * Generalized search

// X Bugs with setting the name of multiple new TODOs.
// X It's actually not intutive to add things at the top. Just show edit on bottom.
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
//       X Before I fix this I should just make the input nodes exist, just empty.
//   X Shift+Enter to add a child.
//     X Autofocus on new child.
//     X If I click to open a new child on a nonselected thing, then i hit enter...
//     X child on bottommost thing is not selected.
//     * Enter to finish adding a new child.
//   * Maybe Down while editing name to edit description.
// * Clicking should also change selection.
// * header items (just for organization)
//   * I think todos will need a 'type' key
// * mouseover one, highlight all
// * zoomin
// * breadcrumb trail visible

// X If you click on a textbox, it shouldn't collapse.
//   X This is happening because it's considered a click on body.

// TODO: Eventually merge these into keydown, just check uiState to see which
// one is being edited.
// The problem I see right now is that there is a pathological case where
// you click on both and then uiState is true for both. I think that just
// allowing one to be edited would be sufficient.

// X pay the power bill
// * listen to debussy

interface ITemplate { (...data: any[]): string; }
interface ITodo {
    name: string;
    content: string;
    depth?: number; // TODO: This really shouldn't be optional - it's currently that way bc of my dummy data
    done?: boolean; // Also shouldn't be optional.
    children: ITodo[];
}

class Util {
    static getTemplate(name: string): ITemplate {
        var el: JQuery = $('#' + name);

        return _.template(el.html());
    }
}

class TodoModel extends Backbone.Model {
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
        this.selected = false;
        this.childIndex = -1;
        this.uid = Math.random() + ' ' + Math.random();

		// Pass this event up the hierarchy, so we can use it in SavedData.
	    this.listenTo(this, 'good-time-to-save', () => {
		    if (this.parent) {
			    this.parent.trigger('good-time-to-save');
		    }
	    });
    }

    /** recursively create this todo and all sub-todos from the provided data. */
    initWithData(data: ITodo, parent: TodoModel): TodoModel {
        this.name = data.name;
        this.content = data.content;
        this.done = data.done;
        this.parent = parent;

        if (data.depth) {
            this.depth = data.depth;
        } else {
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

    /** What index is this model in its parent's "children" list, or -1 if it doesn't have a parent. */
    get childIndex(): number {
        if (this.parent == null) return -1;

        for (var i = 0; i < this.parent.numChildren; i++) {
            if (this.parent.children[i].uid === this.uid) {
                return i;
            }
        }

        console.error('childIndex is in weird state');
        debugger;

        return -1;
    }

    public static selectedModel: TodoModel;

    get depth(): number { return this.get('depth'); }
    set depth(value: number) { this.set('depth', value); }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }

    get content(): string { return this.get('content'); }
    set content(value: string) { this.set('content', value); }

    get done(): boolean { return this.get('done'); }
    set done(value: boolean) { this.set('done', value); }

    get selected(): boolean { return this.get('selected'); }
    set selected(value: boolean) {
        if (TodoModel.selectedModel && value) {
            TodoModel.selectedModel.set('selected', false); // don't infinitely recurse
            TodoModel.selectedModel.view.render();
        }
        if (value) {
            TodoModel.selectedModel = this;
        }

        this.set('selected', value);

        if (this.view) {
            this.view.render();
        }
    }

    get children(): TodoModel[] { return this._children; }

    get numChildren(): number { return this._children.length; }

    /** Returns the next child in this list of children, or null if this is the last. */
    get nextChild(): TodoModel {
        console.log('nextchild');

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
    constructor(attrs?: any) {
        super(attrs);

        this.addTodoVisible = false;
        this.editingName = false;
        this.editingContent = false;
    }

    /** Returns true if the user is currently editing anything. */
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

    get editingName(): boolean { return this.get('editingName'); }
    set editingName(value: boolean) { this.set('editingName', value); }

    get editingContent(): boolean { return this.get('editingContent'); }
    set editingContent(value: boolean) { this.set('editingContent', value); }
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

class TodoView extends Backbone.View<TodoModel> {
    template: ITemplate;
    childrenViews: TodoView[];
    uiState: TodoUiState;

    /** The view for making a new todo. */
    editView: NewTodoView;

    /** The view associated with the entire app. */
    mainView: MainView;

    /** List of ALL todoViews. Just used for keypress handling... */
    static todoViews: TodoView[];

    events() {
        return {
            'click .todo-add-js': this.toggleAddChildTodo,
            'click .todo-done-js': this.completeTodo,
            'click .edit-name-js': this.showTodoNameEdit,
            'click .edit-content-js': this.showTodoContentEdit,
            'click input': () => false
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleAddChildTodo', 'render', 'events', 'keydown');

        if (!TodoView.todoViews) TodoView.todoViews = [];
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
    }

    keydown(e: JQueryKeyEventObject): boolean {
        if (!this.model.selected) return false;

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

        // Shift + Enter to add child
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
            newSelection.selected = true;

            this.render();

            return false;
        }

        return true;
    }

    private completeTodo() {
        this.model.done = !this.model.done;
        this.render();

        return false;
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
        this.model.selected = true;

        this.render();

        return false;
    }

    private showTodoContentEdit(e: JQueryMouseEventObject) {
        this.uiState.editingContent = true;
        this.model.selected = true;

        this.render();

        return false;
    }

    private initEditView() {
        var self = this;
        var editModel = new TodoModel();
        editModel.parent = this.model;
        this.editView = new NewTodoView(<any> { model: editModel });

        this.listenTo(this.editView, 'cancel', this.toggleAddChildTodo);
        this.listenTo(this.editView, 'add-todo',(model: TodoModel) => {
            self.addChildTodo(model);
            self.toggleAddChildTodo();
        });
    }

    addChildTodo(childModel: TodoModel, prepend: boolean = false) {
        var newView = new TodoView(<any> { model: childModel });
        var index = prepend ? 0 : this.childrenViews.length;

        this.childrenViews.splice(index, 0, newView);

        // The problem is that half the time when we call this fn, we already
        // have children inserted, but the other half we should be adding
        // new children to the array.
        // TODO: Should think about this more later.

        if (_.pluck(this.model.children, 'uid').indexOf(childModel.uid) === -1) {
            this.model.children.splice(index, 0, childModel);
        }

        this.render();
    }

    toggleAddChildTodo() {
        this.uiState.addTodoVisible = !this.uiState.addTodoVisible;

        // TODO: Just pass in parent to TodoModel.
        var editModel = new TodoModel();
        editModel.parent = this.model;
        this.editView.model = editModel;

        this.render();
        return false;
    }

    render() {
        this.$el.html(this.template(this.model.toJSON()));

        var $childrenContainer = this.$('.children-js');
        var $addTodo = this.$('.todo-add');

        // Update state per uiState

        $addTodo.toggle(this.uiState.addTodoVisible);

        this.renderTodoName();
        this.renderTodoContent();

        this.delegateEvents(); // We might lose our own events. D:

        // render children

        _.each(this.childrenViews,(child: TodoView) => {
            child.render().$el.appendTo($childrenContainer);
        });

        this.editView.render().$el.appendTo($addTodo);

        if (this.uiState.addTodoVisible) {
            this.$('.name').focus();
        }

        window['keyboardShortcuts'].setModel(this.uiState);
        window['keyboardShortcuts'].render();

        return this;
    }

    /** Show the name text xor the name input. */
    private renderTodoName() {
        this.$('.edit-name-js')
            .toggle(!this.uiState.editingName);

        var $nameInput = this.$('.name-edit')
            .toggle(this.uiState.editingName)
            .val(this.model.name);

        if (this.uiState.editingName && !this.uiState.previous('editingName')) {
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

        if (this.uiState.editingContent && !this.uiState.previous('editingContent')) {
            $contentInput.select();
        }
    }
}

// Global todo state. Could keep track of breadcrumbs etc.
class TodoAppModel extends Backbone.Model {
    get selectedTodo(): TodoModel { return this.get('selectedTodo'); }
    set selectedTodo(value: TodoModel) { this.set('selectedTodo', value); }
}

class MainView extends Backbone.View<TodoAppModel> {
    template: ITemplate;
    baseTodoModel: TodoModel;
    baseTodoView: TodoView;
	savedData: SavedData;

    initialize(options: Backbone.ViewOptions<TodoAppModel>) {
        _.bindAll(this, 'clickBody');
        this.model = new TodoAppModel();

		this.savedData = new SavedData();
	    var data = this.savedData.load();

        this.baseTodoModel = new TodoModel().initWithData(data, null);
        this.baseTodoModel.selected = true;

	    this.savedData.watch(this.baseTodoModel);

        this.baseTodoView = new TodoView(<any> {
            model: this.baseTodoModel,
            mainView: this
        });
        this.setElement($('#main-content'));
        this.template = Util.getTemplate('main');

        $('body').on('click', this.clickBody);
    }

    keydown(e: JQueryKeyEventObject): boolean {
        console.log(e.which);

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

window.onload = () => {
    window['keyboardShortcuts'] = new KeyboardShortcuts();

    var mainView = new MainView();
    mainView.render();

    $('body').on('keydown',(e: JQueryKeyEventObject) => {
        for (var i = 0; i < TodoView.todoViews.length; i++) {
            if (!TodoView.todoViews[i].keydown(e))
                break; // stop propagation
        }
    });
};