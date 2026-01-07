((LitElement) => {
	const html = LitElement.prototype.html;
	const css = LitElement.prototype.css;
	const version = '1.0.6';

	const SUPPORTED_ENTITY_DOMAINS = [
		'input_text',
		'var', 		// custom component: https://github.com/snarky-snark/home-assistant-variables/
	];
	const HA_ATTRIBUTE_MAX_LENGTH = 65535;
	const HA_STATE_MAX_LENGTH = 255;

	class LovelaceMultilineTextInput extends LitElement {

		static get properties() {
			return {
				_hass: {},
				stateObj: {},
				config: {},
			};
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
			this.updateComplete.then(() => {
				const new_state = this.getState();
				// only overwrite if state has changed since last overwrite
				if (this.config.last_updated_text === null || new_state !== this.config.last_updated_text) {
					this.setText(new_state, true);
				}
			});
		}

		render() {
			return this.stateObj ? html`
				<ha-card .hass="${this._hass}" .config="${this.config}" class="h-full flex-col">
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
			let value = String(this.stateObj ? this.stateObj.state : this.config.initial_value);
			if(this.config.store_as.includes('attribute') && this.config.store_as_attribute_name?.length) {
				value = this.stateObj.attributes[this.config.store_as_attribute_name] || this.config.initial_value;
			}
			return String(value);
		}

		getText() {
			return this.shadowRoot ? this.shadowRoot.querySelector('.textarea')?.value : '';
		}

		setText(val, entity_update = false) {
			if (!this.shadowRoot) {
				return false;
			}

			this.shadowRoot.querySelector('.textarea').value = val;

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
			clearTimeout(this.timeouts['autosave']);
			this.setText('');
		}

		pasteText() {
			clearTimeout(this.timeouts.autosave);

			const elem = this.shadowRoot.querySelector('.textarea');
			if (!elem) {
				return;
			}
			elem.focus();

			if(!navigator.clipboard) {
				console.warn('Sorry, your browser does not support the clipboard API.');
				return;
			}

			navigator.permissions.query({name: 'clipboard-read'}).then((status) => {
				if (status.state === 'granted' || status.state === 'prompt') {	
					navigator.clipboard.readText()
						.then((text) => {
							this.setText((elem.value ?? '') + text);
						})
						.catch((err) => {
							console.error('Error on paste: ', err);
						});
				} else {
					console.warn('Clipboard read permission denied!');
				}
			});
		}

		onTextareaChanged() {
			if (this.config.autosave) {
				clearTimeout(this.timeouts.autosave);
				this.timeouts.autosave = setTimeout(() => {
					if (this.callAction('save') !== false) {
						this.callService('save');
					}
				}, this.config.autosave_delay);
			}
			this.updateCharactersInfoText();
			this.resizeTextarea();
		}

		updateCharactersInfoText() {
			const textLength = this.shadowRoot.querySelector('.textarea').value.length;
			const button_save = this.shadowRoot.querySelector('#button-save');
			const disable_button = false;

			const maxCharactersInfoText = `${textLength}/${this.config.max_length} max.`;
			const maxCharactersElem = this.shadowRoot.querySelector('#spanMaxCharactersInfoText');
			maxCharactersElem.innerHTML = maxCharactersInfoText;

			if (textLength >= this.config.max_length) {
				maxCharactersElem.classList.add('text-red');
				disable_button = true;
			}
			else {
				maxCharactersElem.classList.remove('text-red');
			}
			if (textLength <= this.config.max_length) {
				disable_button = false;
			}

			if (this.config.min_length > 0) {
				const minCharactersInfoText = `${textLength}/${this.config.min_length} min.`;
				const minCharactersElem = this.shadowRoot.querySelector('#spanMinCharactersInfoText');
				minCharactersElem.innerHTML = minCharactersInfoText;

				if (textLength < this.config.min_length) {
					minCharactersElem.classList.remove('invisible');
					disable_button = true;
				}
				else {
					minCharactersElem.classList.add('invisible');
				}
			}

			if (button_save) {
				if (disable_button) {
					button_save.classList.add('button-disabled');
					button_save.classList.add('text-red');
				}
				else {
					button_save.classList.remove('button-disabled');
					button_save.classList.remove('text-red');
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
			textArea.style.minHeight = newMinHeight + 'px';
		}

		callAction(action) {
			if (typeof this.config.actions[action] === 'function') {
				return this.config.actions[action]();
			}
		}

		callService(service) {
			if (this.config.entity_domain === 'input_text' || this.config.entity_domain === 'var') {
				const value = String((typeof this.config.service_values[service] === 'function' ? this.config.service_values[service]() : this.config.service_values[service]));
				if (this.config.service[service]) {
					const saveToStatePromise = () => {
						return this._hass.callService(this.config.entity_domain, this.config.service[service], { entity_id: this.stateObj.entity_id, value });
					};
					const saveToAttributePromise = () => {
						const setAttributes = {};
						setAttributes[this.config.store_as_attribute_name] = value;

						return this._hass.callService(this.config.entity_domain, this.config.service[service], { entity_id: this.stateObj.entity_id, attributes: setAttributes });
					};
					
					Promise.resolve()
						.then(this.config.store_as.includes('state') && saveToStatePromise)
						.then(this.config.store_as.includes('attribute') && this.config.entity_domain === 'var' && saveToAttributePromise)
						.then(() => {
							this.displayMessage(service, true);
						})
						.catch((error) => {
							this.displayMessage(service, false);
						});
				}
			}
		}

		displayMessage(service, success) {
			if (!this.config.show_success_messages || !this.shadowRoot || !service || service.length < 1) {
				return;
			}

			const serviceMessageContainer = this.shadowRoot.querySelector('#serviceMessage');
			if (!serviceMessageContainer) {
				return;
			}

			let message = '';
			if (service === 'save') {
				message = success ? 'Content saved.' : 'An error occurred in the backend while saving!';
			}

			if (message.length) {
				serviceMessageContainer.innerHTML = message;
				serviceMessageContainer.classList.remove('invisible');
				serviceMessageContainer.classList.remove('opacity-0');
				const buttons = this.shadowRoot.querySelectorAll('.button');
				buttons.forEach(elem => elem.classList.add('opacity-0'));

				setTimeout(function () {
					serviceMessageContainer.classList.add('opacity-0');
					buttons.forEach(elem => elem.classList.remove('opacity-0'));
				}, 1500);
				setTimeout(function () {
					serviceMessageContainer.classList.add('invisible');
					serviceMessageContainer.innerHTML = '&nbsp;';
				}, 2000);
			}
		}

		actionSave() {
			const len = this.getText().length;
			return len >= this.config.min_length && (this.config.max_length === false || len <= this.config.max_length);
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
			const actions = {
				save: () => { return this.actionSave(); },
				paste: () => { return this.actionPaste(); },
				clear: () => { return this.actionClear(); },
			};

			// paste has no service, clear will be persisted by saving
			const services = {
				'input_text': {
					save: 'set_value',
				},
				'var': {
					save: 'set',
				},
			};

			const serviceValues = {
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

			const entityDomain = config.entity?.split('.')[0];
			if (!config.entity || !SUPPORTED_ENTITY_DOMAINS.includes(entityDomain)) {
				throw new Error('Please define an entity of type: ' + SUPPORTED_ENTITY_DOMAINS.join(', '));
			}

			const storeAsConfig = config.store_as || [ entityDomain === 'input_text' ? 'state' : 'attribute' ];

			if(entityDomain === 'input_text' && storeAsConfig.includes('attribute')) {
				throw new Error(`Domain ${entityDomain} cannot store as attribute. Please use an entity of the var component to achieve this.`);
			}
			const storeAsState = storeAsConfig.includes('state');
			const storeMaxLength = storeAsState ? HA_STATE_MAX_LENGTH : HA_ATTRIBUTE_MAX_LENGTH;
			const maxLengthConfig = parseInt(config.max_length) || storeMaxLength;
			if(maxLengthConfig > storeMaxLength) {
				throw new Error(`max_length ${maxLengthConfig} exceeds the limit (${storeMaxLength}) of the current store_as configuration (${storeAsConfig.join(', ')})`);
			}

			const autosaveDelay = parseInt(config.autosave_delay_seconds);

			this.config = {
				autosave: config.autosave === true,
				entity: config.entity,
				max_length: maxLengthConfig,
				min_length: parseInt(config.min_length) || 0,
				min_lines_displayed: parseInt(config.min_lines_displayed ?? 2),
				placeholder_text: config.placeholder_text || '',
				store_as: storeAsConfig,
				store_as_attribute_name: config.store_as_attribute_name || 'multiline_text_input',
				save_on_clear: config.save_on_clear === true,
				show_success_messages: config.show_success_messages !== false,
				title: config.title,

				autosave_delay: (isNaN(autosaveDelay) ? 1 : autosaveDelay) * 1000,
				initial_value: config.initial_value || '',
				entity_domain: entityDomain,
				last_updated_text: null,
				showButtons: config.buttons !== false,

				actions: Object.assign({}, actions),
				buttons: Object.assign({}, buttons, config.buttons),
				buttons_ordered: {},
				hints: Object.assign({}, hints),
				icons: Object.assign({}, icons, config.icons),
				service: Object.assign({}, services[entityDomain]),
				service_values: Object.assign({}, serviceValues),
			};

			// filter out invalid values and buttons not to be displayed
			let stateButtons = Object.fromEntries(Object.entries(this.config.buttons).filter(([key, value]) => value === true || (!isNaN(value) && value !== 0)));
			// get ordered button keys
			stateButtons = Object.keys(stateButtons).sort(function (a, b) { return stateButtons[a] - stateButtons[b]; });
			// rebuild object with key => value
			stateButtons.forEach(key => this.config.buttons_ordered[key] = this.config.buttons[key]);

			this.config.min_length = Math.max(this.config.min_length, 0);

			if (this.config.max_length <= 0) {
				throw new Error('The max length should be greater than zero.');
			}
			if (this.config.min_length > this.config.max_length) {
				throw new Error('The min length must not be greater than max length.');
			}
			if (this.config.min_lines_displayed < 1) {
				throw new Error('At least one line must be displayed.');
			}
			if (this.config.autosave_delay < 0) {
				throw new Error('autosave_delay_seconds must be set to zero or a positive number (defaults to 1).');
			}
			
			this.timeouts = {
				autosave: null
			};
		}

		set hass(hass) {
			this._hass = hass;

			if (hass && this.config) {
				this.stateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
				if (this.stateObj) {
					if (this.config.title === undefined) {
						this.config.title = this.stateObj.attributes.friendly_name || '';
					}
					if (this.config.entity_domain === 'input_text') {
						if (this.stateObj.attributes.mode !== 'text') {
							throw new Error(`The input_text entity must be in 'text' mode (is: ${this.stateObj.attributes.mode})!`);
						}
					}
				}
				else {
					throw new Error(`Entity ${this.config.entity} does not exist!`);
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
})(window.LitElement || Object.getPrototypeOf(customElements.get('hui-masonry-view') || customElements.get('hui-view')));
