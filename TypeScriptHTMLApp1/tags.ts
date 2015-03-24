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

    constructor(attrs: Backbone.ViewOptions<TagModel>) {
        this.tagName = 'a';

        super(attrs);

        this.template = Util.getTemplate('tag');
    }

    render(): TagView {
        this.$el.html(this.template(this.model.toJSON()));

        return this;
    }
}

class TagListView extends Backbone.View<Backbone.Model> {
    template: ITemplate;
    tags: TagList;

    constructor(tags: TagList) {
        this.tags = tags;

        super();
    }

    render(): TagListView {
        this.$el.empty();

        this.tags.each(m => {
            var view = new TagView({
                model: m
            });

            view.render().$el.appendTo(this.$el);
        });

        return this;
    }
}