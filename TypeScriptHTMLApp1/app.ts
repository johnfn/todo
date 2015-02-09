// TODO (lol)
// X indent inner items
// * edit todos
// * header items (just for organization)
//   * I think todos will need a 'type' key
// * mouseover one, highlight all
// * zoomin
// * breadcrumb trail visible
// * pay the power bill

interface Template { (...data: any[]): string; }
interface Todo {
    name: string;
    content: string;
    depth?: number; // TODO: This really shouldn't be optional - it's currently that way bc of my dummy data
    children: Todo[];
}

var dummyData: Todo = {
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
    private _children: TodoModel[] = [];

    initialize() {
        this.name = "";
        this.content = "";
    }

    /** recursively create this todo and all sub-todos from the provided data. */
    initWithData(data: Todo): TodoModel {
        this.name = data.name;
        this.content = data.content;

        if (data.depth) {
            this.depth = data.depth;
        } else {
            this.depth = 0;
        }

        for (var i = 0; i < data.children.length; i++) {
            var child: Todo = data.children[i];
            child.depth = this.depth + 1;

            var childModel: TodoModel = new TodoModel();

            childModel.initWithData(child);
            this._children.push(childModel);
        }

        return this;
    }

    get depth(): number { return this.get('depth'); }
    set depth(value: number) { this.set('depth', value); }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }

    get content(): string { return this.get('content'); }
    set content(value: string) { this.set('content', value); }

    get children(): TodoModel[] { return this._children; }
}

class TodoUIState extends Backbone.Model {
    constructor(attrs?: any) {
        super(attrs);

        this.editVisible = false;
    }

    get editVisible(): boolean { return this.get('editVisible'); }
    set editVisible(value: boolean) { this.set('editVisible', value); }
}

class TodoEditView extends Backbone.View<TodoModel> {
    template: Template;

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        this.template = Util.getTemplate("todo-edit");
    }

    render() {
        this.$el.html(this.template());

        return this;
    }
}

class TodoView extends Backbone.View<TodoModel> {
    template: Template;
    childrenViews: TodoView[];
    uiState: TodoUIState;
    editView: TodoEditView;

    events() {
        return {
            'click .todo-add-js': 'clickAddTodo'
        };
    }

    initialize(options: Backbone.ViewOptions<TodoModel>) {
        this.template = Util.getTemplate("todo");
        this.childrenViews = [];
        this.uiState = new TodoUIState();

        this.initChildren();
        this.initEditView();
    }

    private initChildren() {
        for (var i = 0; i < this.model.children.length; i++) {
            var childModel = this.model.children[i];
            var childView = new TodoView({ model: childModel });

            this.childrenViews.push(childView);
        }
    }

    private initEditView() {
        var editModel = new TodoModel();

        this.editView = new TodoEditView({ model: editModel });
    }

    clickAddTodo() {
        this.uiState.editVisible = !this.uiState.editVisible;

        this.render();

        return false;
    }

    render() {
        var self = this;
        var $childrenContainer;
        var $addTodo;

        this.$el.html(this.template(this.model.toJSON()));
        this.delegateEvents(); // I don't even know.

        // use .children to ensure only TOPMOST children so that we dont 
        // append the current child to the children list of the other todos.
        $childrenContainer = this.$('.children');
        $addTodo = this.$('.todo-add');

        // render children

        this.editView.render().$el.appendTo($addTodo);

        _.each(this.childrenViews,(child: TodoView) => {
            child.render().$el.appendTo($childrenContainer);
        });

        // update state per uiState

        $addTodo.toggle(this.uiState.editVisible);

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

    initialize(options: Backbone.ViewOptions<MainModel>) {
        this.baseTodoModel = new TodoModel().initWithData(options['data']);
        this.baseTodoView = new TodoView({ model: this.baseTodoModel });
        this.setElement($("#main-content"));
        this.template = Util.getTemplate("main");
    }

    render(): Backbone.View<MainModel> {
        this.$el.html(this.template);
        this.baseTodoView.render().$el.appendTo(this.$(".items"));

        return this;
    }
}

window.onload = () => {
    var mainView = new MainView({
        data: dummyData
    });

    mainView.render();
};