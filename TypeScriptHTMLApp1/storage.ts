class SavedSnapshot extends Backbone.Model {
	private index: number;
	
	// TODO: Actually grab from localstorage
    get data(): number { return this.get('data'); }
    set data(value: number) { this.set('data', value); }
}

/** State related to saving data. */
class SavedDataState extends Backbone.Model {
	savedProps: string[] = ['circularBufferSize', 'circularBufferPosition'];

	fetch(options?: Backbone.ModelFetchOptions): JQueryXHR {
		for (var i = 0; i < this.savedProps.length; i++) {
			var prop = this.savedProps[i];

			this[prop] = window.localStorage.getItem(prop);
		}

		return null;
	}

	save() {
		for (var i = 0; i < this.savedProps.length; i++) {
			var prop = this.savedProps[i];

			window.localStorage.setItem(prop, this[prop]);
		}
	}
	
    get circularBufferSize(): number { return this.get('circularBufferSize'); }
    set circularBufferSize(value: number) { this.set('circularBufferSize', value); }

    get circularBufferPosition(): number { return this.get('circularBufferPosition'); }
    set circularBufferPosition(value: number) { this.set('circularBufferPosition', value); }
}

class SavedData extends Backbone.Collection<SavedSnapshot> {
	baseTodoModel: TodoModel;
	savedDataState: SavedDataState;

	initialize(attributes?: any, options?: any) {
		
	}

	watch(todoModel: TodoModel) {
		this.baseTodoModel = todoModel;

		this.listenTo(this.baseTodoModel, 'good-time-to-save', this.maybeSave);
	}

	/** Consider if we should save. */
	maybeSave():void {

	}

	load(): ITodo {
		var result: ITodo;
		var savedData = window.localStorage.getItem('data');

		this.savedDataState = new SavedDataState();

		if (savedData) {
			savedData = JSON.parse(savedData);
			result = savedData;

			this.savedDataState.fetch();
		} else {
			result = this.firstTimeLoad();
		}

		console.log(this.savedDataState.toJSON());

		return result;
	}

	firstTimeLoad():ITodo {
		this.savedDataState.circularBufferPosition = 0;
		this.savedDataState.circularBufferSize = 50;

		this.savedDataState.save();

		var data: ITodo = <any> {
			name: 'This is a starter todo list.',
			content: '',
			children:
			[{
				name: 'Put some stuff here',
				children: []
			}, {
				name: 'More stuff here.',
				children: []
			}]
		};

		return data;
	}
}

class SavedDataView extends Backbone.View<SavedSnapshot> {

}