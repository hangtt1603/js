var NoteEditController = Composer.Controller.extend({
	elements: {
		'.note-edit form div.tags': 'tags',
		'textarea[name=quick]': 'inp_quick',
		'input[name=title]': 'inp_title',
		'input[name=url]': 'inp_url',
		'textarea[name=text]': 'inp_text'
	},

	events: {
		'submit form': 'edit_note',
		'click ul.type li': 'switch_type'
	},

	type_fields: {
		'quick':   ['quick'],
		'link':  ['url', 'title', 'text'],
		'text':  ['text'],
		'image': ['url', 'title', 'text']
	},

	project: null,
	note: null,
	tag_controller: null,

	init: function()
	{
		if(!this.note) this.note = new Note({type: 'quick'});
		this.render();
		modal.open(this.el);
		var close_fn = function() {
			this.release();
			modal.removeEvent('close', close_fn);
		}.bind(this);
		modal.addEvent('close', close_fn);
		this.tag_controller = new NoteEditTagController({
			inject: this.tags,
			note: this.note,
			project: this.project
		});
		this.select_tab(this.note.get('type'));
		tagit.keyboard.detach(); // disable keyboard shortcuts while editing
	},

	release: function()
	{
		if(this.tag_controller) this.tag_controller.release();
		tagit.keyboard.attach(); // re-enable shortcuts
		this.parent.apply(this, arguments);
	},

	render: function()
	{
		var content = Template.render('notes/edit', {
			note: toJSON(this.note),
			project: toJSON(this.project)
		});
		this.html(content);
	},

	edit_note: function(e)
	{
		if(e) e.stop();

		if(this.note.get('type') == 'quick')
		{
			// do some basic guessing/intelligence stuff
			var val = this.inp_quick.get('value');
			if(val.match(/^[\w]+:\/\/([\.\-\w_\/:\?\+\&#=%,]+)$/i))
			{
				// its a URL
				if(val.match(/\.(jpg|jpeg|gif|png|tiff|bmp)([\w?&=#]+)?$/i))
				{
					// it's an image
					this.note.set({
						type: 'image',
						image: val
					});
				}
				else
				{
					// just a stupid link
					this.note.set({
						type: 'link',
						link: val
					});
				}
			}
			else
			{
				// only other option is text for now
				this.note.set({
					type: 'text',
					text: val,
				});
			}
		}
		else
		{
			switch(this.note.get('type'))
			{
			case 'link':
				this.note.set({
					url: this.inp_url.get('value'),
					title: this.inp_title.get('value'),
					text: this.inp_text.get('value')
				});
				break;
			case 'image':
				this.note.set({
					url: this.inp_url.get('value'),
					title: this.inp_title.get('value'),
					text: this.inp_text.get('value')
				});
				break;
			case 'text':
			default:
				this.note.set({
					text: this.inp_text.get('value')
				});
				break;
			}
		}

		tagit.loading(true);

		var isnew	=	this.note.is_new();
		if(!this.note.get('project_id'))
			this.note.set({project_id: this.project.id()});

		this.note.save({
			success: function() {
				modal.close();
				tagit.loading(false);
				if(isnew) this.project.get('notes').add(this.note);
			}.bind(this),
			error: function() {
				tagit.loading(false);
			}
		});
	},

	select_tab: function(typename)
	{
		var types = this.el.getElements('.note-edit > form > div.type');
		types.each(function(el) { el.removeClass('sel'); });
		var enable = this.type_fields[typename];
		enable.each(function(type) {
			var type = this.el.getElement('.note-edit > form > div.type.'+ type);
			if(type) type.addClass('sel');
		}.bind(this));

		var lis = this.el.getElements('ul.type > li');
		lis.each(function(el) { el.removeClass('sel'); });
		var li = this.el.getElement('ul.type li.'+typename);
		if(li) li.addClass('sel');

		this.note.set({type: typename}, {silent: true});
		var input_sel = typename;
		if(['link','image'].contains(typename)) input_sel = 'url';
		if(this['inp_'+input_sel]) this['inp_'+input_sel].focus();
	},

	switch_type: function(e)
	{
		if(!e) return;
		e.stop();

		var li = next_tag_up('li', e.target);
		var typename = li.get('html').clean().toLowerCase();
		this.select_tab(typename);
	}
});

