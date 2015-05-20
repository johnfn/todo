class TagList extends Backbone.Collection<TagModel> {
    constructor(models: TagModel[]) {
        super();

        _.each(models, (m) => {
            this.add(new TagModel(m.name, m.tagType));
        });
    }
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
    currentText: string;

    events() {
        return {
            'click .remove-tag': this.clickRemoveTag,
            'click': this.searchForThisTag,
            'keyup': this.updateCurrentText
        };
    }

    constructor(model: TagModel, isBeingEdited: boolean = false) {
        this.tagName = 'a';
        this.isBeingEdited = isBeingEdited;
        this.currentText = "";

        super();

        this.template = Util.getTemplate('tag');
        this.model = model;
    }

    searchForThisTag(e: JQueryMouseEventObject) {
        var $search = $('.search-input').val(this.model.name).focus();

        _.defer(() => {
            $search.trigger('keyup');
        });
    }

    clickRemoveTag(e: JQueryMouseEventObject) {
        this.trigger('remove-tag');

        return false;
    }

    updateCurrentText() {
        if (this.$('input').is(':focus')) {
            this.currentText = this.$('input').val();
        }
    }

    keydown(e: JQueryKeyEventObject): boolean {
        // Enter
        if (e.which == 13) {
            this.isBeingEdited = false;
            this.model.name = this.currentText;

            this.render();

            this.trigger('finish-adding');
            return true;
        }

        return false;
    }

    render(): TagView {
        var renderOptions = this.model.toJSON();
        renderOptions['isBeingEdited'] = this.isBeingEdited;

        this.$el.html(this.template(renderOptions));
        this.delegateEvents();

        // Hack to put the caret at the end of the input.
        this.$("input").focus().val("").val(this.currentText);

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

        this.listenTo(this.tags, 'add', (model) => {
            this.addTagView(model, true);
        });

        this.listenTo(this.tags, 'remove', (model) => {
            this.tagViews = _.filter(this.tagViews,(view) => view.model != model);
            this.render();
        });

        this.tags.each((m, i) => {
            this.addTagView(m, false);
        });
    }

    keydown(e: JQueryKeyEventObject): boolean {
        if (!this.currentlyEditing()) return false;

        var focusedTag = _.find(this.tagViews, view => view.isBeingEdited);

        return focusedTag.keydown(e);
    }

    addTagView(model: TagModel, isCurrentlyEditing) {
        var view = new TagView(model, isCurrentlyEditing);

        this.tagViews.push(view);

        this.listenTo(view, 'finish-adding', () => this.trigger('global-change'));
    }

    currentlyEditing(): boolean {
        return _.any(this.tagViews, view => view.isBeingEdited);
    }

    render(): TagListView {
        this.$el.empty();

        var selectedIndex = -1;

        _.each(this.tagViews,(view, i) => {
            view.render().$el.appendTo(this.$el);

            if (view.isBeingEdited) {
                selectedIndex = i;
            }

            view.listenTo(view, 'remove-tag',() => {
                this.tags.remove(view.model);
                this.trigger('global-change');
            });
        });

        if (selectedIndex !== -1) {
            this.tagViews[selectedIndex].$el.find('.tagname-js').focus();
        }

        return this;
    }
}