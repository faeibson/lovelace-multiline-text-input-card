# multiline-text-input-card

This is a simple lovelace card to display a multiline text input field bound on an `input_text` or `var` entity.

However, snarky-snark's `var` [component](https://github.com/snarky-snark/home-assistant-variables/) is recommended to use since Home Assistant's `input_text` is limited to a maximum of only 255 characters. At this point I will not forget to mention that this great component is capable of so much more - have a look at it!

Plus, I borrowed some code and inspiration from [benct's](https://github.com/benct) awesome [Xiaomi Vacuum Card](https://github.com/benct/lovelace-xiaomi-vacuum-card) - many thanks for that one, Ben!


[![release](https://img.shields.io/github/v/release/faeibson/lovelace-multiline-text-input-card)](https://github.com/faeibson/lovelace-multiline-text-input-card/releases)
![code_size](https://img.shields.io/github/languages/code-size/faeibson/lovelace-multiline-text-input-card)
![license](https://img.shields.io/github/license/faeibson/lovelace-multiline-text-input-card)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

![Screenshot](https://raw.githubusercontent.com/faeibson/lovelace-multiline-text-input-card/master/screenshot.png)

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:lovelace-multiline-text-input-card`
| entity | string | **Required** | An `input_text` or `var` entity
| autosave | bool | `false` | Save text automatically one second after input
| min_length | int | `0` | The minimum text length allowed to be saved to the entity (*)
| max_length | int/bool | `false` | The maximum text length to be allowed (*)
| placeholder_text | string | | Placeholder text to be displayed when empty
| save_on_clear | bool | `false` | Save empty text after pressing the clear button (no effect along with `min_length`)
| title | string | *friendly_name* | The card title (if undefined, falls back to the entity's `friendly_name` attribute)
| buttons | object/bool | *(see below)* | Set to `false` to hide button row
| icons | object | *(see below)* | Set custom button icons (same keys as `buttons` object)

(*) Note: If necessary, the entity's min/max length attributes will be taken into account and overwrite the config.

### Buttons object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| save | bool | `true` | Show or hide save button
| paste | bool | `true` | Show or hide clipboard paste button (*)
| clear | bool | `true` | Show or hide clear button

(*) Note: Clipboard paste does not work in all browsers!

### Icons object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| save | string | `mdi:content-save-outline` | Save button icon
| paste | string | `mdi:content-paste` | Paste button icon
| clear | string | `mdi:trash-can-outline` | Clear button icon

## Examples

Don't forget to add your `input_text` or `var` entity in your `configuration.yaml`! ;)

### Simple config example:
```yaml
- type: custom:lovelace-multiline-text-input-card
  entity: input_text.input_text_entity
```

### Advanced configuration:
```yaml
- type: custom:lovelace-multiline-text-input-card
  autosave: true
  entity: input_text.input_text_entity
  max_length: 50
  min_length: 10
  placeholder_text: 'Text entered here is going to be saved automatically when between 10 and 50 characters length.'
  title: Multiline text input card
  buttons:
    save: false
    paste: true
    clear: true
  icons:
    paste: mdi:some-icon
    clear: mdi:other-icon
```