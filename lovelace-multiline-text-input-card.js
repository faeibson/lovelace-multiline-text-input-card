((LitElement) => {
	const html = LitElement.prototype.html;
	const css = LitElement.prototype.css;
	const version = "1.0.5";

	class LovelaceMultilineTextInput extends LitElement {

		static get properties() {
			return {
				_hass: {},
				_config: {},
				stateObj: {},
				config: {}
			}
		}

		static get styles() {
			return css`
				.button {
					cursor: pointer;
					padding: 16px;
					opacity: 1;
					transition: opacity 0.5s linear;
				}
				.button-disabled {
					cursor: auto;
					pointer-events: none;
				}
				.flex-1 {
					flex: 1;
				}
				.flex-center {
					display: flex;
					align-items: center;
					justify-content: space-evenly;
				}
				.flex-col {
					display: flex;
					flex-direction: column;
				}
				.flex-left {
					display: flex;
					justify-content: start;
				}
				.flex-right {
					display: flex;
					justify-content: end;
				}
				.flex-row {
					display: flex;
					flex-direction: row;
				}
				.hidden {
					display: none;
				}
				.h-full {
					height: 100%;
				}
				.invisible {
					visibility: hidden;
				}
				.space-between {
					justify-content: space-between;
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
					height: 100%;
					field-sizing: content;
					letter-spacing: inherit;
					line-height: inherit;
					outline: none;
					padding-left: 5px;
					padding-bottom: 5px;
					word-wrap: break-word;
					width: 100%;
					word-spacing: inherit;
					max-width: 100%;
					min-width: 100%;
				}
				.text-bold {
					font-weight: bold;
				}
				.text-center {
					text-align: center;
				}
				.text-italic {
					font-style: italic; 
				}
				.text-red {
					color: red;
				}
				.text-small {
					font-size: 11px;
				}
				.opacity-0 {
					opacity: 0 !important;
				}
				.position-absolute {
					position: absolute;
				}
				.w-full {
					width: 100%;
				}
				#serviceMessage {
					padding: 5px;
					background-color: var(--primary-background-color);
					border: 1px solid var(--primary-color);
					border-radius: 3px;
					opacity: 1;
					transition: opacity 0.5s linear;
				}
				ha-card, ha-card * {
					box-sizing: border-box;
				}
			`;
		}

		updated() {
			let _this = this;
			this.updateComplete.then(() => {
				let new_state = _this.getState();
				// only overwrite if state has changed since last overwrite
				if (_this.config.last_updated_text === null || new_state !== _this.config.last_updated_text) {
					_this.setText(new_state, true);
				}
			});
		}

		render() {
			return this.stateObj ? html`
				<ha-card .hass="${this._hass}" .config="${this._config}" class="h-full flex-col">
					${this.config.title?.length ? html`<div class="card-header">${this.config.title}</div>` : ''}
			  		<div class="card-content flex-col flex-1">
						<textarea maxlength="${this.config.max_length !== -1 ? this.config.max_length : ""}" @propertychange="${() => this.onTextareaChanged()}" @input="${() => this.onTextareaChanged()}" class="textarea" placeholder="${this.config.placeholder_text}">${this.getState()}</textarea>
						<div class="card-text-constraints flex-row flex-1 space-between">
							<span class="text-red text-small text-italic" id="spanMinCharactersInfoText"></span>
							<span class="text-small text-italic" id="spanMaxCharactersInfoText"></span>
						</div>
						${!this.config.showButtons ? html`<div id="serviceMessage" class="text-center text-small invisible opacity-0">&nbsp;</div>` : null}
						${this.config.showButtons ? html`
							<div class="card-buttons flex-center w-full">
								<div id="serviceMessage" class="position-absolute text-small invisible opacity-0">&nbsp;</div>
								${Object.keys(this.config.buttons_ordered).map(this.renderButton.bind(this))}
							</div>` : null}
			  		</div>
				</ha-card>` : null;
		}

		getCardSize() {
			return Math.round(this.scrollHeight / 50);
		}

		renderButton(key) {
			return this.config.buttons[key]
				? html`<div class="button" title="${this.config.hints[key]}" id="button-${key}" @tap="${() => { if (this.callAction(key) !== false) { this.callService(key); } }}" @click="${() => { if (this.callAction(key) !== false) { this.callService(key); } }}"><ha-icon icon="${this.config.icons[key]}"></ha-icon></div>`
				: null;
		}

		getState() {
			const value = this.stateObj ? this.stateObj.state : this.config.default_text;
			return value.replace("\\n", "\n");
		}

		getText() {
			return this.shadowRoot ? this.shadowRoot.querySelector(".textarea").value : "";
		}

		setText(val, entity_update = false) {
			if (!this.shadowRoot) {
				return false;
			}

			this.shadowRoot.querySelector(".textarea").value = val;

			if (entity_update === true) {
				this.config.last_updated_text = val;
				this.resizeTextarea();
				this.updateCharactersInfoText();
			}
			else {
				this.onTextareaChanged();
			}
		}

		clearText() {
			clearTimeout(this.config.autosave_timeout);
			this.setText('');
		}

		pasteText() {
			clearTimeout(this.config.autosave_timeout);
			if (!this.shadowRoot) {
				return false;
			}

			let elem = this.shadowRoot.querySelector(".textarea");
			if (!elem) {
				return;
			}
			elem.focus();

			if(!navigator.clipboard) {
				console.warn("Sorry, your browser does not support the clipboard API.");
				return;
			}

			navigator.permissions.query({name: 'clipboard-read'}).then((status) => {
				if (status.state === 'granted' || status.state === 'prompt') {	
					navigator.clipboard.readText()
						.then((text) => {
							this.setText((elem.value ?? '') + text);
						})
						.catch((err) => {
							console.error("Error on paste: ", err);
						});
				} else {
					console.warn('Clipboard read permission denied');
				}
			});
		}

		onTextareaChanged() {
			if (this.config.autosave) {
				clearTimeout(this.config.autosave_timeout);
				let _this = this;
				this.config.autosave_timeout = setTimeout(function () {
					if (_this.callAction('save') !== false) {
						_this.callService('save');
					}
				}, 1000);
			}
			this.updateCharactersInfoText();
			this.resizeTextarea();
		}

		updateCharactersInfoText() {
			if (!this.shadowRoot) {
				return false;
			}
			let textLength = this.shadowRoot.querySelector(".textarea").value.length;
			let button_save = this.shadowRoot.querySelector("#button-save");
			let disable_button = false;

			if (this.config.max_length !== false) {
				let maxCharactersInfoText = `${textLength}/${this.config.max_length} max.`;
				let maxCharactersElem = this.shadowRoot.querySelector("#spanMaxCharactersInfoText")
				maxCharactersElem.innerHTML = maxCharactersInfoText;

				if (textLength >= this.config.max_length) {
					maxCharactersElem.classList.add("text-red");
					disable_button = true;
				}
				else {
					maxCharactersElem.classList.remove("text-red");
				}
				if (textLength <= this.config.max_length) {
					disable_button = false;
				}
			}

			if (this.config.min_length > 0) {
				let minCharactersInfoText = `${textLength}/${this.config.min_length} min.`;
				let minCharactersElem = this.shadowRoot.querySelector("#spanMinCharactersInfoText")
				minCharactersElem.innerHTML = minCharactersInfoText;

				if (textLength < this.config.min_length) {
					minCharactersElem.classList.remove("invisible");
					disable_button = true;
				}
				else {
					minCharactersElem.classList.add("invisible");
				}
			}

			if (button_save) {
				if (disable_button) {
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
			if (!this.shadowRoot) {
				return false;
			}
			const textArea = this.shadowRoot.querySelector('.textarea');
			const textAreaComputedStyle = getComputedStyle(textArea);

			const lineHeight = parseFloat(textAreaComputedStyle.lineHeight);
			const borderTopWidth = parseFloat(textAreaComputedStyle.borderTopWidth);
			const borderBottomWidth = parseFloat(textAreaComputedStyle.borderBottomWidth);
			const paddingTop = parseFloat(textAreaComputedStyle.paddingTop);
			const paddingBottom = parseFloat(textAreaComputedStyle.paddingBottom);
			const newMinHeight = lineHeight * this.config.min_lines_displayed + borderTopWidth + borderBottomWidth + paddingTop + paddingBottom;
			textArea.style.minHeight = newMinHeight + "px";
		}

		callAction(action) {
			if (typeof this.config.actions[action] === 'function') {
				return this.config.actions[action]();
			}
		}

		callService(service) {
			if (this.config.entity_type === 'input_text' || this.config.entity_type === 'var') {
				let value = (typeof this.config.service_values[service] === 'function' ? this.config.service_values[service]() : this.config.service_values[service]);
				if (this.config.service[service]) {
					let _this = this;
					this._hass.callService(this.config.entity_type, this.config.service[service], { entity_id: this.stateObj.entity_id, value: value }).then(function (response) { _this.displayMessage(service, true) }, function (error) { _this.displayMessage(service, false) });
				}
			}
		}

		displayMessage(service, success) {
			if (!this.config.show_success_messages || !this.shadowRoot || !service || service.length < 1) {
				return;
			}

			let serviceMessageContainer = this.shadowRoot.querySelector('#serviceMessage');

			if (!serviceMessageContainer) {
				return;
			}

			// todo: translations
			let message = "";
			if (success) {
				if (service == "save") {
					message = "The content has been saved.";
				}
			}
			else {
				if (service == "save") {
					message = "An error occurred in the backend while saving!";
				}
			}

			if (message.length > 0) {
				serviceMessageContainer.innerHTML = message;
				serviceMessageContainer.classList.remove("invisible");
				serviceMessageContainer.classList.remove("opacity-0");
				let buttons = this.shadowRoot.querySelectorAll(".button");
				buttons.forEach(elem => elem.classList.add("opacity-0"));

				setTimeout(function () {
					serviceMessageContainer.classList.add("opacity-0");
					buttons.forEach(elem => elem.classList.remove("opacity-0"));
				}, 1500);
				setTimeout(function () {
					serviceMessageContainer.classList.add("invisible");
					serviceMessageContainer.innerHTML = "&nbsp;";
				}, 2000);
			}
		}

		actionSave() {
			let len = this.getText().length;
			let length_check = len >= this.config.min_length && (this.config.max_length === false || len <= this.config.max_length);
			return length_check;
		}

		actionClear() {
			this.clearText();
			if (this.config.save_on_clear && this.callAction('save') !== false) {
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

			this.config = {
				autosave: config.autosave === true,
				entity: config.entity,
				max_length: parseInt(config.max_length) || false,
				min_length: parseInt(config.min_length) || 0,
				min_lines_displayed: parseInt(config.min_lines_displayed ?? 2),
				placeholder_text: config.placeholder_text ?? "",
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
			let state_buttons = Object.fromEntries(Object.entries(this.config.buttons).filter(([key, value]) => value === true || (!isNaN(value) && value !== 0)));
			// get ordered button keys
			state_buttons = Object.keys(state_buttons).sort(function (a, b) { return state_buttons[a] - state_buttons[b]; });
			// rebuild object with key => value
			this.config.buttons_ordered = {};
			state_buttons.forEach(key => this.config.buttons_ordered[key] = this.config.buttons[key]);

			this.config.min_length = Math.max(this.config.min_length, 0);

			if (this.config.max_length !== false && this.config.max_length <= 0) {
				throw new Error("The max length should be greater than zero.");
			}
			if (this.config.min_length > this.config.max_length && this.config.max_length !== false) {
				throw new Error("The min length must not be greater than max length.");
			}

			this._config = config;
		}

		set hass(hass) {
			this._hass = hass;

			if (hass && this._config) {
				this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
				if (this.stateObj) {
					if (this.config.title === undefined) {
						this.config.title = this.stateObj.attributes.friendly_name || "";
					}
					if (this.config.entity_type === "input_text") {
						if (this.stateObj.attributes.mode !== "text") {
							throw new Error("An input_text entity must be in 'text' mode!");
						}

						if (this.config.min_length === 0 && (this.stateObj.attributes.min || 0) > 0) {
							this.config.min_length = this.stateObj.attributes.min;
							console.warn("Entity " + this._config.entity + " requires at least " + this.stateObj.attributes.min + " characters.");
						}
						if (this.config.max_length === false || this.stateObj.attributes.max < this.config.max_length) {
							if (this.config.max_length !== false) {
								console.warn("Entity " + this._config.entity + " allows less characters (" + this.stateObj.attributes.max + ") than desired.");
							}
							this.config.max_length = this.stateObj.attributes.max;
						}
					}
				}
			}
		}
	}

	if (!customElements.get('lovelace-multiline-text-input-card')) {
		customElements.define('lovelace-multiline-text-input-card', LovelaceMultilineTextInput);
		console.info(
			`%c  multiline-text-input-card \n%c  version: ${version}    `,
			'color: orange; font-weight: bold; background: black',
			'color: white; font-weight: bold; background: dimgray',
		);
	}
})(window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view")));
