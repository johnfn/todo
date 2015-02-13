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

interface Template { (...data: any[]): string; }
interface ITodo {
    name: string;
    content: string;
    depth?: number; // TODO: This really shouldn't be optional - it's currently that way bc of my dummy data
    done?: boolean; // Also shouldn't be optional.
    children: ITodo[];
}

var dummyData: ITodo = {
    name: "topmost todo",
    content: "",
    children:
    [{
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

class Util {
    static getTemplate(name: string): Template {
        var el: JQuery = $("#" + name);

        return _.template(el.html());
    }
}

class TodoModel extends Backbone.Model {
    /** The TodoView one view up (or null if there isn't one. */
    parentTodo: TodoView;
    private _children: TodoModel[] = [];

    initialize() {
        this.name = "";
        this.content = "";
    }

    /** recursively create this todo and all sub-todos from the provided data. */
    initWithData(data: ITodo): TodoModel {
        this.name = data.name;
        this.content = data.content;

        if (data.depth) {
            this.depth = data.depth;
        } else {
            this.depth = 0;
        }

        for (var i = 0; i < data.children.length; i++) {
            var child: ITodo = data.children[i];
            child.depth = this.depth + 1;

            var childModel: TodoModel = new TodoModel();

            childModel.initWithData(child);
            this._children.push(childModel);
        }

        return this;
    }

    /** Recursively get the ITodo data of this Todo. */
    getData(): ITodo {
        return {
            content: this.content,
            name: this.name,
            children: _.map(this.children, (model: TodoModel) => model.getData())
        };
    }

    get depth(): number { return this.get('depth'); }
    set depth(value: number) { this.set('depth', value); }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }

    get content(): string { return this.get('content'); }
    set content(value: string) { this.set('content', value); }

    get done(): boolean { return this.get('done'); }
    set done(value: boolean) { this.set('done', value); }

    get children(): TodoModel[] { return this._children; }
}

class TodoUiState extends Backbone.Model {
    constructor(attrs?: any) {
        super(attrs);

        this.editVisible = false;
        this.editingName = false;
        this.editingContent = false;
    }

    get editVisible(): boolean { return this.get('editVisible'); }
    set editVisible(value: boolean) { this.set('editVisible', value); }

    get editingName(): boolean { return this.get('editingName'); }
    set editingName(value: boolean) { this.set('editingName', value); }

    get editingContent(): boolean { return this.get('editingContent'); }
    set editingContent(value: boolean) { this.set('editingContent', value); }
}

class TodoEditView extends Backbone.View<TodoModel> {
    template: Template;

    events() {
        return {
            'click .edit-add-js': 'addTodo',
            'click .edit-cancel-js': 'cancelTodo',
            'click .name-js': () => false,
            'click .desc-js': () => false
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        this.template = Util.getTemplate("todo-edit");
    }

    getNameText(): string {
        return this.$(".name").first().val();
    }

    getDescText(): string {
        return this.$(".desc").first().val();
    }

    addTodo(e: JQueryMouseEventObject) {
        this.model.name = this.getNameText();
        this.model.content = this.getDescText();

        this.trigger('add-child', this.model);

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
    template: Template;
    childrenViews: TodoView[];
    uiState: TodoUiState;
    editView: TodoEditView;
    mainView: MainView;

    events() {
        return {
            'click .todo-add-js': this.toggleTodo,
            'click .todo-done-js': this.completeTodo,
            'click .edit-name-js': this.showTodoNameEdit,
            'click .edit-content-js': this.showTodoContentEdit,
            'keydown .name-edit': this.editTodoName,
            'keydown .content-edit': this.editTodoContent
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        _.bindAll(this, 'initEditView', 'addChildTodo', 'toggleTodo', 'render');

        this.mainView = options['mainView'];
        this.template = Util.getTemplate("todo");
        this.childrenViews = [];
        this.uiState = new TodoUiState();

        this.initEditView();

        _.each(this.model.children, this.addChildTodo);

        this.listenTo(this, 'click-body', this.hideAllEditNodes);
    }

    private completeTodo() {
        console.log("done");

        return false;
    }

    private hideAllEditNodes(e: JQueryMouseEventObject) {
        _.each(this.childrenViews, (view: TodoView) => { view.trigger('click-body'); });

        this.uiState.editingContent = false;
        this.uiState.editingName = false;
        this.uiState.editVisible = false;

        this.render();
    }

    private showTodoNameEdit(e: JQueryMouseEventObject) {
        this.uiState.editingName = true;

        this.render();

        return false;
    }

    private showTodoContentEdit(e: JQueryMouseEventObject) {
        this.uiState.editingContent = true;

        this.render();

        return false;
    }

    private editTodoName(e: JQueryKeyEventObject) {
        if (e.which === 13) {
            this.model.name = $(e.currentTarget).val();
            this.uiState.editingName = false;

            this.render();
        }
    }

    private editTodoContent(e: JQueryKeyEventObject) {
        if (e.which === 13) {
            this.model.content = $(e.currentTarget).val();
            this.uiState.editingContent = false;

            this.render();
        }
    }

    private initEditView() {
        var editModel = new TodoModel();
        var self = this;

        this.editView = new TodoEditView({ model: editModel });

        this.listenTo(this.editView, 'cancel', this.toggleTodo);
        this.listenTo(this.editView, 'add-child', (model: TodoModel) => {
            self.addChildTodo(model);
            self.toggleTodo();
        });
    }

    addChildTodo(childModel: TodoModel) {
        this.childrenViews.push(new TodoView({
            model: childModel
        }));

        this.render();
    }

    toggleTodo() {
        this.uiState.editVisible = !this.uiState.editVisible;

        this.render();

        return false;
    }

    render() {
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
            var $nameInput = $("<input>")
                .addClass('name-edit')
                .val(this.model.name);

            $editName.replaceWith($nameInput);

            if (!this.uiState.previous('editingName')) {
                $nameInput.select();
            }
        }

        if (this.uiState.editingContent) {
            var $contentInput = $("<input>")
                .addClass('content-edit')
                .val(this.model.content);

            $editContent.replaceWith($contentInput);

            if (!this.uiState.previous('editingContent')) {
                $contentInput.select();
            }
        }

        this.delegateEvents(); // We might lose our own events. D:

        // render children

        _.each(this.childrenViews, (child: TodoView) => {
            child.render().$el.appendTo($childrenContainer);
        });

        this.editView.render().$el.appendTo($addTodo);

        return this;
    }
}

// Global todo state. Could keep track of breadcrumbs etc.
class MainModel extends Backbone.Model {
}

class MainView extends Backbone.View<MainModel> {
    template: Template;
    baseTodoModel: TodoModel;
    baseTodoView: TodoView;

    events() {
        return {
            'click': "clickBody",
            'click .save-btn-js': 'save'
        };
    }

    initialize(options: Backbone.ViewOptions<MainModel>) {
        this.baseTodoModel = new TodoModel().initWithData(options['data']);
        this.baseTodoView = new TodoView({
            model: this.baseTodoModel,
            mainView: this
        });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
    }

    render(): Backbone.View<MainModel> {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$(".items"));

        return this;
    }

    private save() {
        console.log(this.baseTodoModel.getData());

        return false;
    }

    private clickBody(e: JQueryMouseEventObject) {
        this.baseTodoView.trigger('click-body');
    }
}

window.onload = () => {
    var mainView = new MainView({
        data: dummyData
    });

    mainView.render();
};