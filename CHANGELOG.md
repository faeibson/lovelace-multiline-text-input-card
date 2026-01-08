# Changelog
All notable changes to this project will be documented in this file.

## 1.0.7
- Fixed: Setting `show_buttons` to `false` resulted in an error
- Renamed the `show_success_messages` option to `display_action_results` (old name will still work)
- Enhancement: Setting `display_action_results: true` (which is default) will not result in any additional height anymore. Improved display and styling of the card. Reduced padding of the action buttons to require less space.

## 1.0.6
- (Big!) enhancement: **Possibility to store content as an `var` entity's attribute, which allows up to 16 KB (65535 characters) content!** (also the new default behaviour for `var` entities) ([#10], [#17])
- Enhancement: Introduced `store_as`, `store_as_attribute_name` options to specify the storage target (`attribute` and/or `state`)
- Enhancement: New option `autosave_delay_seconds` defines the wait delay for the autosave trigger (in seconds)
- Enhancement: New option `initial_value` defines the initial content if no value is set to the specified entity's state or attribute
- Improved code, refactored a bit, some better error handling
- The max length / char count will now always be displayed as it can't be be circumvented anyway

## 1.0.5
- Smaller refactorings and improved code
- Title / card header can now be hidden by just assigning an empty value / null ([#15])
- Fixed: Non-functional buttons ([#9], [#16] - thanks to [@adamhun94])
- Fixed: Horizontal resizing of textarea may cause glitches ([#14] - thanks to [@ildar170975])
- Fixed: Buttons are not centered ([#13])
- Fixed: Clipboard behaviour
- Enhancement: Autosave behaviour (not firing on every keyup anymore)
- Removed `textarea` `margin-top` and replaced the JS resizing by flex CSS
- Enhancement: Introduced `min_lines_displayed` option to set the minimal displayed height (lines/rows) of the textbox, defaults to 2 ([#6])
- Enhancement: Stretch to full size of parent container in order to fit in stack cards ([#6])

## 1.0.4
- Added the possibility to rearrange the buttons ([#2])
- Added the possibility to display success messages of backend calls

## 1.0.3
- Fixed HA 0.116 compatibility issue ([#3])

## 1.0.2
- Clear text bugfix ([#1])

## 1.0.1
- Readme + description

## 1.0.0

- **Initial release**

[#1]: /../../issues/1
[#2]: /../../issues/2
[#3]: /../../issues/3
[#6]: /../../issues/6
[#9]: /../../issues/9
[#10]: /../../issues/10
[#13]: /../../issues/13
[#14]: /../../issues/14
[#15]: /../../issues/15
[#16]: /../../issues/16
[#17]: /../../issues/17
[@adamhun94]: https://github.com/adamhun94
[@ildar170975]: https://github.com/ildar170975