((LitElement) => {
	const html = LitElement.prototype.html;
	const css = LitElement.prototype.css;

	class LovelaceMultilineTextInput extends LitElement {

		static get properties() {
			return {
				_hass: {},
				_config: {},
				stateObj: {},
				state: {}
			}
		}

		static get styles() {
			return css`
				.flex {
					display: flex;
					align-items: center;
					justify-content: space-evenly;
				}
				.button {
					cursor: pointer;
					padding: 16px;
					opacity: 1;
					transition: opacity 0.5s linear;
				}
				.textarea {
					background: inherit;
					border: inherit;
					border-left: 1px solid var(--primary-color);
					border-bottom: 1px solid var(--primary-color);
					box-shadow: none;
					color: inherit; /*var(--primary-color)*/;
					font: inherit;
					font-size: 16px;
					height: auto;
					letter-spacing: inherit;
					line-height: inherit;
					margin-top: 20px;
					outline: none;
					padding-left: 5px;
					padding-bottom: 5px;
					min-height: 80px;
					overflow-y: auto;
					word-wrap: break-word;
					width: 100%;
					word-spacing: inherit;
				}
				.text-center {
					text-align: center;
				}
				.text-bold {
					font-weight: bold;
				}
				.text-italic {
					font-style: italic; 
				}
				.text-left {
					float: left;
				}
				.text-red {
					color: red;
				}
				.text-right {
					float: right;
				}
				.text-small {
					font-size: 11px;
				}
				.hidden {
					display: none;
				}
				.position-absolute {
					position: absolute;
				}
				.opacity-0 {
					opacity: 0 !important;
				}
				.invisible {
					visibility: hidden;
				}
				.button-disabled {
					cursor: auto;
					pointer-events: none;
				}
				#serviceMessage {
					padding: 5px;
					background-color: var(--primary-background-color);
					border: 1px solid var(--primary-color);
					border-radius: 3px;
					opacity: 1;
					transition: opacity 0.5s linear;
				}
			`;
		}

		updated() {
			let _this = this;
			this.updateComplete.then(() => {
				let new_state = _this.getState();
				// only overwrite if state has changed since last overwrite
				if(_this.state.last_updated_text === null || new_state !== _this.state.last_updated_text) {
					_this.setText(new_state, true);
				}
			});
		}

		render() {
			return this.stateObj ? html`
				<ha-card .hass="${this._hass}" .config="${this._config}" class="background">
		  			${this.state.title ? html`<div class="card-header">${this.state.title}</div>` : null}
			  		<div class="card-content">
						<textarea maxlength="${this.state.max_length !== -1 ? this.state.max_length : ""}" @keyup="${() => this.onKeyupTextarea()}" class="textarea" placeholder="${this.state.placeholder_text}">${this.getState()}</textarea>
						<span class="text-red text-small text-italic text-left" id="spanMinCharactersInfoText"></span>
						<span class="text-small text-italic text-right" id="spanMaxCharactersInfoText"></span>
						${!this.state.showButtons ? html`<div id="serviceMessage" class="text-center text-small invisible opacity-0">&nbsp;</div>` : null}
			  		</div>
			  		${this.state.showButtons ? html`
				  		<div class="flex">
			  				<div id="serviceMessage" class="position-absolute text-small invisible opacity-0">&nbsp;</div>
							${Object.keys(this.state.buttons_ordered).map(this.renderButton.bind(this))}
				  		</div>` : null}
				</ha-card>` : null;
		}

		getCardSize() {
			return Math.round(this.scrollHeight / 50);
		}

		renderButton(key) {
			return this.state.buttons[key]
				? html`<div class="button" title="${this.state.hints[key]}" id="button-${key}" @tap="${() => { if(this.callAction(key) !== false) { this.callService(key); }}}"><ha-icon icon="${this.state.icons[key]}"></ha-icon></div>`
				: null;
		}

		getState() {
			const value = this.stateObj ? this.stateObj.state : this.state.default_text;
			return value.replace("\\n", "\n");
		}

		getText() {
			return this.shadowRoot ? this.shadowRoot.querySelector(".textarea").value : "";
		}

		setText(val, entity_update) {
			if(!this.shadowRoot) {
				return false;
			}

			if(entity_update === true) {
				this.state.last_updated_text = val;
			}
			
			this.shadowRoot.querySelector(".textarea").value = val;
			this.resizeTextarea();
			this.updateCharactersInfoText();
		}

		clearText() {
			clearTimeout(this.state.autosave_timeout);
			this.setText('');
		}

		pasteText() {
			clearTimeout(this.state.autosave_timeout);
			if(!this.shadowRoot) {
				return false;
			}
				
			let elem = this.shadowRoot.querySelector(".textarea");
			if(elem) {
				elem.focus();
				let val = elem.value;
				if(typeof navigator.clipboard.readText === "function") {
					navigator.clipboard.readText().then((text) => { this.setText(val + text); }, (err) => { console.error("Error on paste: ", err); });
				}
				else {
					console.warn("Sorry, your browser does not support the clipboard paste function.");
				}
			}
		}

		onKeyupTextarea() {
			if(this.state.autosave) {
				clearTimeout(this.state.autosave_timeout);
				let _this = this;
				this.state.autosave_timeout = setTimeout(function() {
					if(_this.callAction('save') !== false) {
						_this.callService('save');
					}
				}, 1000);
			}
			this.updateCharactersInfoText();
			this.resizeTextarea();
		}

		updateCharactersInfoText() {
			if(!this.shadowRoot) {
				return false;
			}
			let textLength = this.shadowRoot.querySelector(".textarea").value.length;
			let button_save = this.shadowRoot.querySelector("#button-save");
			let disable_button = false;

			if(this.state.max_length !== false) {
				let maxCharactersInfoText = `${textLength}/${this.state.max_length} max.`;
				let maxCharactersElem = this.shadowRoot.querySelector("#spanMaxCharactersInfoText")
				maxCharactersElem.innerHTML = maxCharactersInfoText;

				if(textLength >= this.state.max_length) {
					maxCharactersElem.classList.add("text-red");
					disable_button = true;
				}
				else {
					maxCharactersElem.classList.remove("text-red");
				}
				if(textLength <= this.state.max_length) {
					disable_button = false;
				}
			}

			if(this.state.min_length > 0) {
				let minCharactersInfoText = `${textLength}/${this.state.min_length} min.`;
				let minCharactersElem = this.shadowRoot.querySelector("#spanMinCharactersInfoText")
				minCharactersElem.innerHTML = minCharactersInfoText;

				if(textLength < this.state.min_length) {
					minCharactersElem.classList.remove("hidden");
					disable_button = true;
				}
				else {
					minCharactersElem.classList.add("hidden");
				}
			}

			if(button_save) {
				if(disable_button) {
					button_save.classList.add("button-disabled");
					button_save.classList.add("text-red");
				}
				else {
					button_save.classList.remove("button-disabled");
					button_save.classList.remove("text-red");
				}
			}
		}

		resizeTextarea() {
			if(!this.shadowRoot) {
				return false;
			}
			let textArea = this.shadowRoot.querySelector('.textarea');
			let textAreaComputedStyle = getComputedStyle(textArea);
			textArea.style.height = "auto";
			textArea.style.overflowY = "auto";
			textArea.style.height = (parseFloat(textArea.scrollHeight) + parseFloat(textAreaComputedStyle.paddingBottom) + parseFloat(textAreaComputedStyle.borderBottomWidth)) + "px";
			textArea.style.overflowY = "hidden";
		}

		callAction(action) {
			if (typeof this.state.actions[action] === 'function') {
				return this.state.actions[action]();
			}
		}

		callService(service) {
			if(this.state.entity_type === 'input_text' || this.state.entity_type === 'var') {
				let value = (typeof this.state.service_values[service] === 'function' ? this.state.service_values[service]() : this.state.service_values[service]);
				if(this.state.service[service]) {
					let _this = this;
					this._hass.callService(this.state.entity_type, this.state.service[service], {entity_id: this.stateObj.entity_id, value: value}).then(function(response) { _this.displayMessage(service, true) }, function(error) { _this.displayMessage(service, false) });
				}
			}
		}

		displayMessage(service, success) {
			if(!this.state.show_success_messages || !this.shadowRoot || !service || service.length < 1) {
				return;
			}

			let serviceMessageContainer = this.shadowRoot.querySelector('#serviceMessage');

			if(!serviceMessageContainer) {
				return;
			}

			// todo: translations
			let message = "";
			if(success) {
				if(service == "save") {
					message = "The content has been saved.";
				}
			}
			else {
				if(service == "save") {
					message = "An error occurred in the backend while saving!";
				}
			}

			if(message.length > 0) {
				serviceMessageContainer.innerHTML = message;
				serviceMessageContainer.classList.remove("invisible");
				serviceMessageContainer.classList.remove("opacity-0");
				let buttons = this.shadowRoot.querySelectorAll(".button");
				buttons.forEach(elem => elem.classList.add("opacity-0"));

				setTimeout(function() {
					serviceMessageContainer.classList.add("opacity-0");
					buttons.forEach(elem => elem.classList.remove("opacity-0"));
				}, 1500);
				setTimeout(function() {
					serviceMessageContainer.classList.add("invisible");
					serviceMessageContainer.innerHTML = "&nbsp;";
				}, 2000);
			}
		}

		actionSave() {
			let len = this.getText().length;
			let length_check = len >= this.state.min_length && (this.state.max_length === false || len <= this.state.max_length);
			return length_check;
		}

		actionClear() {
			this.clearText();
			if(this.state.save_on_clear && this.callAction('save') !== false) {
				this.callService('save');
			}
		}

		actionPaste() {
			this.pasteText();
		}

		setConfig(config) {
			const supported_entity_types = [
				'input_text',
				'var', 		// custom component: https://community.home-assistant.io/t/custom-component-generic-variable-entities/128627
			];

			const actions = {
				save: () => { return this.actionSave(); },
				paste: () => { return this.actionPaste(); },
				clear: () => { return this.actionClear(); },
			};

			// paste has no service, clear must be "confirmed" by saving
			const services = {
				'input_text': {
					save: 'set_value',
				},
				'var': {
					save: 'set',
				},
			};

			const service_values = {
				save: () => { return this.getText(); },
				paste: null,
				clear: '',
			};

			const buttons = {
				save: 1,
				paste: 2,
				clear: 3,
			};

			const icons = {
				save: 'mdi:content-save-outline',
				paste: 'mdi:content-paste',
				clear: 'mdi:trash-can-outline',
			};

			const hints = {
				save: 'Save',
				paste: 'Paste from clipboard',
				clear: 'Clear text'
			};

			let entity_type = config.entity.split('.')[0];
			if (!config.entity || !supported_entity_types.includes(entity_type)) {
				throw new Error('Please define an entity of type: ' + supported_entity_types.join(', '));
			}

			this.state = {
				autosave: config.autosave === true,
				entity: config.entity,
				max_length: parseInt(config.max_length) || false,
				min_length: parseInt(config.min_length) || 0,
				placeholder_text: config.placeholder_text || "",
				save_on_clear: config.save_on_clear === true,
				show_success_messages: config.show_success_messages !== false,
				title: config.title,

				autosave_timeout: null,
				default_text: "",
				entity_type: entity_type,
				last_updated_text: null,
				showButtons: config.buttons !== false,

				actions: Object.assign({}, actions),
				buttons: Object.assign({}, buttons, config.buttons),
				buttons_ordered: {},
				hints: Object.assign({}, hints),
				icons: Object.assign({}, icons, config.icons),
				service: Object.assign({}, services[entity_type]),
				service_values: Object.assign({}, service_values),
			};

			// filter out invalid values and buttons not to be displayed
			let state_buttons = Object.fromEntries(Object.entries(this.state.buttons).filter(([key, value]) => value === true || (!isNaN(value) && value !== 0)));
			// get ordered button keys
			state_buttons = Object.keys(state_buttons).sort(function(a, b) { return state_buttons[a] - state_buttons[b]; });
			// rebuild object with key => value
			this.state.buttons_ordered = {};
			state_buttons.forEach(key => this.state.buttons_ordered[key] = this.state.buttons[key]);

			this.state.min_length = Math.max(this.state.min_length, 0);

			if(this.state.max_length !== false && this.state.max_length <= 0) {
				throw new Error("The max length should be greater than zero.");
			}
			if(this.state.min_length > this.state.max_length && this.state.max_length !== false) {
				throw new Error("The min length must not be greater than max length.");
			}

			this._config = config;
		}

		set hass(hass) {
			this._hass = hass;

			if(hass && this._config) {
				this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
				if(this.stateObj) {
					if(this.state.title === undefined) {
						this.state.title = this.stateObj.attributes.friendly_name || "";
					}
					if(this.state.entity_type === "input_text") {
						if(this.stateObj.attributes.mode !== "text") {
							throw new Error("An input_text entity must be in 'text' mode!");
						}

						if(this.state.min_length === 0 && (this.stateObj.attributes.min || 0) > 0) {
							this.state.min_length = this.stateObj.attributes.min;
							console.warn("Entity " + this._config.entity + " requires at least " + this.stateObj.attributes.min + " characters.");
						}
						if(this.state.max_length === false || this.stateObj.attributes.max < this.state.max_length) {
							if(this.state.max_length !== false) {
								console.warn("Entity " + this._config.entity + " allows less characters (" + this.stateObj.attributes.max + ") than desired.");
							}
							this.state.max_length = this.stateObj.attributes.max;
						}
					}
				}
			}
		}
	}

	customElements.define('lovelace-multiline-text-input-card', LovelaceMultilineTextInput);
})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view")));
