class TagList extends Backbone.Collection<TagModel> {

}

class TagModel extends Backbone.Model {
    constructor(name: string, tagType: string) {
        super();

        this.name = name;
        this.tagType = tagType;
    }

    get name(): string { return this.get('name'); }
    set name(value: string) { this.set('name', value); }

    get tagType(): string { return this.get('tagType'); }
    set tagType(value: string) { this.set('tagType', value); }
}

class TagView extends Backbone.View<TagModel> {
    template: ITemplate;
    isBeingEdited: boolean;

    constructor(model: TagModel, isBeingEdited: boolean = false) {
        this.tagName = 'a';
        this.isBeingEdited = isBeingEdited;

        super();

        this.template = Util.getTemplate('tag');
        this.model = model;
    }

    render(): TagView {
        var renderOptions = this.model.toJSON();
        renderOptions['isBeingEdited'] = this.isBeingEdited;
        
        this.$el.html(this.template(renderOptions));

        return this;
    }
}

class TagListView extends Backbone.View<Backbone.Model> {
    template: ITemplate;
    tags: TagList;
    tagViews: TagView[];
    currentlySelectedTagId: number = -1;

    constructor(tags: TagList) {
        super();

        this.tagViews = [];
        this.tags = tags;

        this.listenTo(this.tags, 'add', () => {
            this.addTagView(this.tags.last(), true);
        });
        
        this.tags.each((m, i) => {
            this.addTagView(m, false);
        });
    }

    addTagView(model: TagModel, isCurrentlyEditing) {
        var view = new TagView(model, isCurrentlyEditing);

        this.tagViews.push(view);
    }

    render(): TagListView {
        this.$el.empty();

        var selectedIndex = -1;

        for (var i = 0; i < this.tagViews.length; i++) {
            var view = this.tagViews[i];

            view.render().$el.appendTo(this.$el);

            if (view.isBeingEdited) {
                selectedIndex = i;
            }
        }

        if (selectedIndex !== -1) {
            this.tagViews[selectedIndex].$el.find('.tagname-js').focus();
        }

        return this;
    }
}